package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync/atomic"
	"syscall"
	"time"

	"job-search-assistant/internal/db"
	"job-search-assistant/parser/sources"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	kafka "github.com/segmentio/kafka-go"
)

// Task represents a single job to fetch: source, source_id and url
type Task struct {
	Source   string
	SourceID string
	URL      string
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// Configuration from env
	databaseURL := getenv("DATABASE_URL", "postgres://app:changeme@postgres:5432/jobsdb?sslmode=disable")
	kafkaBrokers := getenv("KAFKA_BROKERS", "kafka:9092")
	rawTopic := getenv("RAW_TOPIC", "raw_jobs_topic")
	workers := atoi(getenv("PARSER_WORKERS", "4"))
	seeds := getenv("JOB_SEEDS", "")      // optional startup seeds
	proxies := getenv("HTTP_PROXIES", "") // comma separated http://host:port
	port := getenv("PARSER_PORT", "8081")

	// DB pool
	pool, err := db.NewPool(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer pool.Close()

	// Kafka writer
	writer := &kafka.Writer{
		Addr:     kafka.TCP(strings.Split(kafkaBrokers, ",")...),
		Topic:    rawTopic,
		Balancer: &kafka.Hash{},
	}
	defer writer.Close()

	// Build HTTP clients (one per proxy) to rotate through
	clients := buildHTTPClients(proxies)

	// Optional browser fetcher (lazy init on first 403/451)
	var browserFetcher *BrowserFetcher
	if getenv("USE_BROWSER", "") != "" {
		browserFetcher = NewBrowserFetcher()
		if browserFetcher != nil {
			defer browserFetcher.Close()
		}
	}

	// Global task queue
	tasks := make(chan Task, 1000)

	// Startup seeds (optional — for backward compat)
	if seeds != "" {
		go seedTasks(seeds, tasks)
	}

	// Worker pool
	log.Printf("starting parser: workers=%d proxies=%d", workers, len(clients))
	for i := 0; i < workers; i++ {
		go func(id int) {
			worker(id, pool, writer, clients, browserFetcher, tasks)
		}(i)
	}

	// HTTP server
	app := fiber.New(fiber.Config{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	app.Post("/parse", func(c *fiber.Ctx) error {
		var req struct {
			Query   string   `json:"query"`
			Sources []string `json:"sources"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if strings.TrimSpace(req.Query) == "" {
			return fiber.NewError(fiber.StatusBadRequest, "query is required")
		}
		if len(req.Sources) == 0 {
			req.Sources = []string{"hh", "habr"}
		}

		for _, source := range req.Sources {
			searchURL := sources.BuildSearchURL(source, req.Query)
			if searchURL == "" {
				continue
			}
			sourceID := "search-" + req.Query
			select {
			case tasks <- Task{Source: source, SourceID: sourceID, URL: searchURL}:
				log.Printf("parse request queued: source=%s query=%s", source, req.Query)
			default:
				log.Printf("task queue full, dropping: source=%s", source)
			}
		}

		return c.JSON(fiber.Map{
			"status":  "started",
			"query":   req.Query,
			"sources": req.Sources,
		})
	})

	log.Printf("parser HTTP server listening on :%s", port)

	srvErr := make(chan error, 1)
	go func() {
		srvErr <- app.Listen(":" + port)
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-srvErr:
		log.Fatalf("server error: %v", err)
	case sig := <-sigCh:
		log.Printf("received signal %v, shutting down...", sig)
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = app.ShutdownWithContext(shutdownCtx)
	}
}

// worker fetches tasks, downloads content with backoff & proxy rotation, writes raw_jobs and publishes to Kafka
func worker(id int, pool *pgxpool.Pool, writer *kafka.Writer, clients []*http.Client, browserFetcher *BrowserFetcher, tasks chan Task) {
	logPrefix := fmt.Sprintf("worker-%d", id)
	clientCount := len(clients)
	var round uint64

	for t := range tasks {
		// choose client by round-robin
		idx := int(atomic.AddUint64(&round, 1)) % max(1, clientCount)
		client := clients[idx]

		// attempt fetch with exponential backoff
		var html string
		var lastErr error
		useBrowser := false
		for attempt := 0; attempt < 6; attempt++ {
			sleep := time.Duration(100*math.Pow(2, float64(attempt))) * time.Millisecond
			time.Sleep(sleep + time.Duration(rand.Intn(200))*time.Millisecond)

			_, html, lastErr = fetchHTTP(client, t.URL)
			if lastErr == nil {
				log.Printf("%s: fetched %s (len=%d, preview=%q)", logPrefix, t.URL, len(html), truncate(html, 300))
				break
			}
			// Если получили 403/451 — попробуем через браузер
			if isBlockedStatus(lastErr) && browserFetcher != nil && !useBrowser {
				log.Printf("%s: HTTP blocked (%v), trying browser fetch for %s", logPrefix, lastErr, t.URL)
				html, lastErr = browserFetcher.Fetch(t.URL)
				if lastErr == nil {
					log.Printf("%s: browser fetched %s (len=%d)", logPrefix, t.URL, len(html))
					break
				}
				useBrowser = true
			}
			log.Printf("%s: fetch attempt %d failed for %s: %v", logPrefix, attempt, t.URL, lastErr)
		}
		if lastErr != nil {
			log.Printf("%s: giving up on %s: %v", logPrefix, t.URL, lastErr)
			continue
		}

		// Извлекаем ссылки только с поисковых страниц (по наличию query-параметров).
		if isSearchPage(t.URL) {
			links := sources.ExtractJobLinks(t.Source, html)
			if len(links) > 0 {
				log.Printf("%s: на странице поиска %s найдено %d вакансий", logPrefix, t.URL, len(links))
				for _, link := range links {
					sourceID := extractIDFromURL(link)
					select {
					case tasks <- Task{Source: t.Source, SourceID: sourceID, URL: link}:
					default:
						log.Printf("%s: task queue full, skipping %s", logPrefix, link)
					}
				}
			} else {
				log.Printf("%s: поисковая страница %s пуста", logPrefix, t.URL)
			}
			continue
		}

		// compute source_hash
		sourceHash := computeHash(t.Source, t.SourceID)

		// parse site-specific HTML into fields
		pr, perr := sources.Parse(t.Source, html, t.URL)
		var titlePtr *string
		var contentText string
		var rawMeta map[string]interface{}
		if perr == nil && pr != nil {
			contentText = pr.Text
			rawMeta = pr.Meta
			if pr.Title != "" {
				titlePtr = &pr.Title
			}
		} else {
			contentText = stripTags(html)
			rawMeta = map[string]interface{}{"url": t.URL}
		}

		// save raw job (insert or get existing id)
		rawID, err := saveRawJob(pool, t.Source, t.SourceID, sourceHash, titlePtr, contentText, html, t.URL, rawMeta)
		if err != nil {
			log.Printf("%s: failed saveRawJob: %v", logPrefix, err)
			continue
		}

		// publish to kafka with key=source_hash and value=rawID
		msg := kafka.Message{
			Key:   []byte(sourceHash),
			Value: []byte(fmt.Sprintf("%d", rawID)),
		}
		if err := writer.WriteMessages(context.Background(), msg); err != nil {
			log.Printf("%s: kafka write failed: %v", logPrefix, err)
		} else {
			log.Printf("%s: published raw job %d (source=%s id=%s)", logPrefix, rawID, t.Source, t.SourceID)
		}
	}
}

// fetchHTTP does an HTTP GET with realistic browser headers and returns text/plain and HTML
func fetchHTTP(client *http.Client, urlStr string) (text string, html string, err error) {
	req, _ := http.NewRequest("GET", urlStr, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7")
	// Не запрашиваем сжатие — в контейнере может не хватить библиотек для декомпрессии
	// req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Cache-Control", "max-age=0")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "none")
	req.Header.Set("Sec-Fetch-User", "?1")

	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", "", fmt.Errorf("bad status %d", resp.StatusCode)
	}
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", err
	}
	s := string(b)
	return stripTags(s), s, nil
}

// isBlockedStatus проверяет, является ли ошибка блокировкой бота
func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

func isBlockedStatus(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "403") || strings.Contains(s, "451")
}

// saveRawJob inserts into raw_jobs, returns id (existing or new)
func saveRawJob(pool *pgxpool.Pool, source, sourceID, sourceHash string, title *string, text, html, sourceURL string, raw map[string]interface{}) (int64, error) {
	ctx := context.Background()
	rawJSON, _ := json.Marshal(raw)
	var id int64
	err := pool.QueryRow(ctx, `INSERT INTO raw_jobs (source, source_id, source_hash, title, content_text, content_html, source_url, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, source, sourceID, sourceHash, title, text, html, sourceURL, string(rawJSON)).Scan(&id)
	if err == nil {
		return id, nil
	}
	err2 := pool.QueryRow(ctx, `SELECT id FROM raw_jobs WHERE source_hash=$1`, sourceHash).Scan(&id)
	if err2 != nil {
		return 0, err2
	}
	return id, nil
}

// helpers
func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func atoi(s string) int {
	i, _ := strconv.Atoi(s)
	return i
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func computeHash(source, sourceID string) string {
	h := sha256.Sum256([]byte(source + ":" + sourceID))
	return hex.EncodeToString(h[:])
}

// buildHTTPClients returns a slice of http.Clients; if proxies empty returns single default client
func buildHTTPClients(proxiesCSV string) []*http.Client {
	var clients []*http.Client
	proxies := []string{}
	if proxiesCSV != "" {
		proxies = strings.Split(proxiesCSV, ",")
	}
	if len(proxies) == 0 {
		clients = append(clients, &http.Client{Timeout: 20 * time.Second})
		return clients
	}

	for _, p := range proxies {
		p = strings.TrimSpace(p)
		proxyURL, err := url.Parse(p)
		if err != nil {
			log.Printf("invalid proxy %s: %v", p, err)
			continue
		}
		tr := &http.Transport{
			Proxy:               http.ProxyURL(proxyURL),
			DialContext:         (&net.Dialer{Timeout: 30 * time.Second}).DialContext,
			TLSHandshakeTimeout: 10 * time.Second,
			MaxIdleConns:        100,
			IdleConnTimeout:     90 * time.Second,
		}
		clients = append(clients, &http.Client{Transport: tr, Timeout: 20 * time.Second})
	}
	if len(clients) == 0 {
		clients = append(clients, &http.Client{Timeout: 20 * time.Second})
	}
	return clients
}

// seedTasks parses seeds and sends tasks.
func seedTasks(seeds string, ch chan<- Task) {
	if seeds == "" {
		return
	}
	parts := strings.Split(seeds, "|")
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		pieces := strings.SplitN(p, ":", 3)
		if len(pieces) != 3 {
			log.Printf("invalid seed entry: %s", p)
			continue
		}
		source := pieces[0]
		sourceID := pieces[1]
		rest := pieces[2]

		if strings.HasPrefix(rest, "search:") {
			query := strings.TrimPrefix(rest, "search:")
			searchURL := sources.BuildSearchURL(source, query)
			if searchURL == "" {
				log.Printf("unsupported search source: %s", source)
				continue
			}
			ch <- Task{Source: source, SourceID: sourceID, URL: searchURL}
		} else {
			ch <- Task{Source: source, SourceID: sourceID, URL: rest}
		}
	}
}

func isSearchPage(urlStr string) bool {
	u, err := url.Parse(urlStr)
	if err != nil {
		return false
	}
	path := u.Path
	// HH: поиск — /search/vacancy, карточка — /vacancy/12345
	if strings.Contains(path, "/search/vacancy") {
		return true
	}
	// Habr: поиск — /vacancies (без числового ID после), карточка — /vacancies/100500
	if path == "/vacancies" || path == "/vacancies/" {
		return true
	}
	if strings.HasPrefix(path, "/vacancies/") {
		rest := strings.TrimPrefix(path, "/vacancies/")
		rest = strings.Split(rest, "/")[0]
		if rest != "" && isAllDigits(rest) {
			return false // карточка вакансии
		}
		return true // категория или поиск
	}
	return false
}

func isAllDigits(s string) bool {
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return s != ""
}

func extractIDFromURL(urlStr string) string {
	u, err := url.Parse(urlStr)
	if err != nil {
		return urlStr
	}
	parts := strings.Split(strings.Trim(u.Path, "/"), "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return urlStr
}

func stripTags(s string) string {
	out := make([]rune, 0, len(s))
	inTag := false
	for _, r := range s {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
			inTag = false
			continue
		}
		if !inTag {
			out = append(out, r)
		}
	}
	return strings.TrimSpace(string(out))
}
