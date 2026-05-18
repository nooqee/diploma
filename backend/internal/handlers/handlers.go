package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"job-search-assistant/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	db   *pgxpool.Pool
	http *http.Client
}

func NewHandler(db *pgxpool.Pool, httpClient *http.Client) *Handler {
	return &Handler{db: db, http: httpClient}
}

// CreateUser creates a new user (simple implementation: stores preferences/base_resume as JSONB)
func (h *Handler) CreateUser(c *fiber.Ctx) error {
	// Accept explicit registration payload including password + confirm
	var payload struct {
		Name            string                 `json:"name"`
		Email           string                 `json:"email"`
		Phone           *string                `json:"phone"`
		Password        string                 `json:"password"`
		PasswordConfirm string                 `json:"password_confirm"`
		Preferences     map[string]interface{} `json:"preferences"`
		BaseResume      map[string]interface{} `json:"base_resume"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// Basic validation
	if strings.TrimSpace(payload.Name) == "" || strings.TrimSpace(payload.Email) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name and email required")
	}
	if payload.Password == "" || payload.Password != payload.PasswordConfirm {
		return fiber.NewError(fiber.StatusBadRequest, "passwords do not match or empty")
	}

	// sanitize inputs to reduce stored XSS risk (strip tags)
	sanitize := func(s string) string {
		// very small sanitizer: remove tags
		re := regexp.MustCompile(`<[^>]*>`)
		return strings.TrimSpace(re.ReplaceAllString(s, ""))
	}
	name := sanitize(payload.Name)
	email := sanitize(payload.Email)
	var phone *string
	if payload.Phone != nil {
		p := sanitize(*payload.Phone)
		phone = &p
	}

	// Hash password with bcrypt
	hashed, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to hash password")
	}

	// Insert
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	prefBytes, _ := json.Marshal(payload.Preferences)
	baseBytes, _ := json.Marshal(payload.BaseResume)

	var id string
	row := h.db.QueryRow(ctx, `
		INSERT INTO users_metadata (name, email, phone, password_hash, preferences, base_resume)
		VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb) RETURNING id`, name, email, phone, string(hashed), string(prefBytes), string(baseBytes))
	if err := row.Scan(&id); err != nil {
		// detect unique violation on email
		if pgErr := (func(e error) *pgconn.PgError {
			if e == nil {
				return nil
			}
			if p, ok := e.(*pgconn.PgError); ok {
				return p
			}
			return nil
		})(err); pgErr != nil && pgErr.Code == "23505" {
			return fiber.NewError(fiber.StatusConflict, "email already registered")
		}
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	u := models.User{ID: id, Name: name, Email: email, Phone: phone, Preferences: payload.Preferences, BaseResume: payload.BaseResume}
	return c.Status(fiber.StatusCreated).JSON(u)
}

// Login checks email+password and returns user
func (h *Handler) Login(c *fiber.Ctx) error {
	var payload struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if strings.TrimSpace(payload.Email) == "" || payload.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email and password required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var id, name, email, hash string
	var phone *string
	var prefsBytes, baseBytes []byte
	row := h.db.QueryRow(ctx, `SELECT id, name, email, phone, password_hash, preferences::text, base_resume::text FROM users_metadata WHERE email=$1`, payload.Email)
	if err := row.Scan(&id, &name, &email, &phone, &hash, &prefsBytes, &baseBytes); err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(payload.Password)); err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid email or password")
	}

	var prefs map[string]interface{}
	var base map[string]interface{}
	_ = json.Unmarshal(prefsBytes, &prefs)
	if len(baseBytes) > 0 {
		_ = json.Unmarshal(baseBytes, &base)
	}

	u := models.User{ID: id, Name: name, Email: email, Phone: phone, Preferences: prefs, BaseResume: base}
	return c.JSON(u)
}

// GetUser returns a user by id
func (h *Handler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	var name, email string
	var phone *string
	var prefsBytes, baseBytes []byte
	row := h.db.QueryRow(ctx, `SELECT name, email, phone, preferences::text, base_resume::text FROM users_metadata WHERE id=$1`, id)
	if err := row.Scan(&name, &email, &phone, &prefsBytes, &baseBytes); err != nil {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}

	var prefs map[string]interface{}
	var base map[string]interface{}
	_ = json.Unmarshal(prefsBytes, &prefs)
	if len(baseBytes) > 0 {
		_ = json.Unmarshal(baseBytes, &base)
	}

	u := models.User{ID: id, Name: name, Email: email, Phone: phone, Preferences: prefs, BaseResume: base}
	return c.JSON(u)
}

// UpdateUser updates preferences and base_resume (partial)
func (h *Handler) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var payload struct {
		Preferences map[string]interface{} `json:"preferences"`
		BaseResume  map[string]interface{} `json:"base_resume"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	prefBytes, _ := json.Marshal(payload.Preferences)
	baseBytes, _ := json.Marshal(payload.BaseResume)

	_, err := h.db.Exec(ctx, `UPDATE users_metadata SET preferences = $1::jsonb, base_resume = $2::jsonb, updated_at = now() WHERE id=$3`, string(prefBytes), string(baseBytes), id)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// DeleteUser deletes a user by id
func (h *Handler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd, err := h.db.Exec(ctx, `DELETE FROM users_metadata WHERE id=$1`, id)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if cmd.RowsAffected() == 0 {
		return fiber.NewError(fiber.StatusNotFound, "user not found")
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// GetJobsFeed returns processed jobs ordered by relevance_score desc with optional filters
func (h *Handler) GetJobsFeed(c *fiber.Ctx) error {
	minScoreQ := c.Query("min_score")
	sourceQ := c.Query("source")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Build base query — LEFT JOIN чтобы показывать вакансии даже без processed_jobs (ml_scorer отключён)
	q := `SELECT 
			COALESCE(p.id::text, '') as pid,
			r.id as raw_job_id,
			r.title,
			r.source,
			r.source_url,
			COALESCE(p.relevance_score, 0) as relevance_score,
			COALESCE(p.matched_skills, '{}') as matched_skills,
			COALESCE(p.hard_skills, '{}') as hard_skills,
			p.ai_recommendation
		  FROM raw_jobs r
		  LEFT JOIN processed_jobs p ON p.raw_job_id = r.id`

	var params []interface{}
	where := " WHERE true"
	if minScoreQ != "" {
		if v, err := strconv.ParseFloat(minScoreQ, 64); err == nil {
			params = append(params, v)
			where += fmt.Sprintf(" AND COALESCE(p.relevance_score, 0) >= $%d", len(params))
		}
	}
	if sourceQ != "" {
		src := strings.TrimSpace(sourceQ)
		params = append(params, src)
		where += fmt.Sprintf(" AND r.source = $%d", len(params))
	}

	order := " ORDER BY r.fetched_at DESC LIMIT 100"
	rows, err := h.db.Query(ctx, q+where+order, params...)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	defer rows.Close()

	var out []models.ProcessedJob
	for rows.Next() {
		var pj models.ProcessedJob
		var pid string
		var matched, hard []string
		var aiRec *string
		if err := rows.Scan(&pid, &pj.RawJobID, &pj.Title, &pj.Source, &pj.SourceURL, &pj.Relevance, &matched, &hard, &aiRec); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		// Если processed_jobs нет — используем raw_job_id как id
		if pid != "" {
			pj.ID = pid
		} else {
			pj.ID = fmt.Sprintf("raw-%d", pj.RawJobID)
		}
		pj.MatchedSkills = matched
		pj.HardSkills = hard
		pj.AiRecommendation = aiRec
		out = append(out, pj)
	}

	return c.JSON(out)
}

// ParseJobs запускает парсинг вакансий через parser-сервис.
// Body: { "query": "golang", "sources": ["hh", "habr"] }
func (h *Handler) ParseJobs(c *fiber.Ctx) error {
	var req struct {
		Query   string   `json:"query"`
		Sources []string `json:"sources,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if strings.TrimSpace(req.Query) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "query is required")
	}

	parserURL := os.Getenv("PARSER_URL")
	if parserURL == "" {
		parserURL = "http://parser:8081"
	}

	bodyBytes, _ := json.Marshal(req)
	httpReq, _ := http.NewRequestWithContext(c.Context(), http.MethodPost, parserURL+"/parse", bytes.NewReader(bodyBytes))
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := h.http.Do(httpReq)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, fmt.Sprintf("parser unreachable: %v", err))
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	c.Status(resp.StatusCode)
	return c.Send(respBody)
}

// SmartApply performs synchronous generation by calling external DeepSeek API with resume+job context
func (h *Handler) SmartApply(c *fiber.Ctx) error {
	var req struct {
		UserID string `json:"user_id"`
		JobID  string `json:"job_id"`
		Tone   string `json:"tone,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// fetch user resume & job content
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var resumeJSON, jobText string
	// get base_resume
	row := h.db.QueryRow(ctx, `SELECT base_resume::text FROM users_metadata WHERE id=$1`, req.UserID)
	_ = row.Scan(&resumeJSON)

	// find raw job content by processed_jobs.id or raw_job_id
	// first try processed_jobs.id
	var rawJobID int64
	row2 := h.db.QueryRow(ctx, `SELECT raw_job_id FROM processed_jobs WHERE id=$1`, req.JobID)
	if err := row2.Scan(&rawJobID); err != nil {
		// try treating job_id as raw_job_id
		rawJobID = 0
		// attempt parse
	}

	if rawJobID == 0 {
		// try raw_jobs
		row3 := h.db.QueryRow(ctx, `SELECT content_text FROM raw_jobs WHERE id=$1`, req.JobID)
		_ = row3.Scan(&jobText)
	} else {
		row3 := h.db.QueryRow(ctx, `SELECT content_text FROM raw_jobs WHERE id=$1`, rawJobID)
		_ = row3.Scan(&jobText)
	}

	// Build payload for DeepSeek
	payload := map[string]interface{}{
		"resume": resumeJSON,
		"job":    jobText,
		"tone":   req.Tone,
	}
	bodyBytes, _ := json.Marshal(payload)

	deepseekURL := "http://deepseek:8000/generate"
	if env := os.Getenv("DEEPSEEK_URL"); env != "" {
		deepseekURL = env
	}

	httpReq, _ := http.NewRequestWithContext(ctx, http.MethodPost, deepseekURL, io.NopCloser(bytes.NewReader(bodyBytes)))
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := h.http.Do(httpReq)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fiber.NewError(fiber.StatusBadGateway, fmt.Sprintf("deepseek error: %s", string(b)))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}

	// Return the DeepSeek response to client. Optionally persist generated artifacts.
	return c.JSON(result)
}
