package models

import "time"

// User represents users_metadata table (partial)
type User struct {
    ID        string                 `json:"id"`
    Name      string                 `json:"name"`
    Email     string                 `json:"email"`
    Phone     *string                `json:"phone,omitempty"`
    Preferences map[string]interface{} `json:"preferences"`
    BaseResume map[string]interface{} `json:"base_resume,omitempty"`
    CreatedAt time.Time              `json:"created_at"`
    UpdatedAt time.Time              `json:"updated_at"`
}

// ProcessedJob is a lightweight representation returned by API
type ProcessedJob struct {
    ID            string   `json:"id"`
    RawJobID      int64    `json:"raw_job_id"`
    Title         *string  `json:"title,omitempty"`
    Source        *string  `json:"source,omitempty"`
    SourceURL     *string  `json:"source_url,omitempty"`
    Relevance     *float64 `json:"relevance_score,omitempty"`
    MatchedSkills []string `json:"matched_skills,omitempty"`
    HardSkills    []string `json:"hard_skills,omitempty"`
    AiRecommendation *string `json:"ai_recommendation,omitempty"`
}
