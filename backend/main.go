package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"job-search-assistant/internal/db"
	"job-search-assistant/internal/handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (optional)
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://app:changeme@postgres:5432/jobsdb?sslmode=disable"
	}

	// Initialize DB pool
	pool, err := db.NewPool(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer pool.Close()

	// Run lightweight migrations: ensure password_hash column exists
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := pool.Exec(ctx, "ALTER TABLE users_metadata ADD COLUMN IF NOT EXISTS password_hash TEXT"); err != nil {
		log.Printf("warning: failed to ensure password_hash column: %v", err)
	}

	// Create handlers with dependencies
	h := handlers.NewHandler(pool, &http.Client{Timeout: 20 * time.Second})

	// Fiber app
	app := fiber.New(fiber.Config{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	// Enable CORS so frontend (localhost:3000) can call the API
	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	}))

	// Health
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "time": time.Now()})
	})

	// Users CRUD + Auth
	app.Post("/users", h.CreateUser)
	app.Post("/login", h.Login)
	app.Get("/users/:id", h.GetUser)
	app.Put("/users/:id", h.UpdateUser)
	app.Delete("/users/:id", h.DeleteUser)

	// Jobs feed
	app.Get("/jobs", h.GetJobsFeed)

	// Trigger job parsing (async via parser service)
	app.Post("/jobs/parse", h.ParseJobs)

	// Smart apply (sync generation) - expects JSON { user_id, job_id }
	app.Post("/smart-apply", h.SmartApply)

		// Serve OpenAPI spec
		app.Get("/openapi.yaml", func(c *fiber.Ctx) error {
				return c.SendFile("openapi.yaml")
		})

		// Serve Swagger UI (simple single-file page using CDN)
		app.Get("/docs", func(c *fiber.Ctx) error {
				html := `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>API Docs</title>
		<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
		<style>body{margin:0;padding:0}</style>
	</head>
	<body>
		<div id="swagger-ui"></div>
		<script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
		<script>
			window.onload = function() {
				const ui = SwaggerUIBundle({
					url: '/openapi.yaml',
					dom_id: '#swagger-ui',
					presets: [SwaggerUIBundle.presets.apis],
				});
				window.ui = ui;
			};
		</script>
	</body>
</html>`
				c.Type("html", "utf-8")
				return c.SendString(html)
		})

	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	// Start server and handle graceful shutdown on SIGINT/SIGTERM
	log.Printf("starting api on %s", addr)

	srvErr := make(chan error, 1)
	go func() {
		srvErr <- app.Listen(addr)
	}()

	// Wait for termination signal or server error
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-srvErr:
		log.Fatalf("server error: %v", err)
	case sig := <-sigCh:
		log.Printf("received signal %v, shutting down...", sig)
		// give fiber a short timeout to finish
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := app.ShutdownWithContext(shutdownCtx); err != nil {
			// fallback to plain Shutdown
			_ = app.Shutdown()
			log.Printf("error during shutdown: %v", err)
		}
	}
}
