-- SQL initialization for "Job Search AI Assistant"
-- Creates required extensions, schemas, tables and indexes
-- This file is executed on first postgres container startup (mounted into /docker-entrypoint-initdb.d)

-- Enable pgvector extension (extension name is `vector`)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users metadata: profiles, search preferences (JSONB), base resume
CREATE TABLE IF NOT EXISTS users_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    base_resume JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If upgrading an existing DB, ensure password_hash column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users_metadata' AND column_name='password_hash'
    ) THEN
        ALTER TABLE users_metadata ADD COLUMN password_hash TEXT;
    END IF;
END$$;

-- Raw jobs: append-only storage of harvested vacancies
CREATE TABLE IF NOT EXISTS raw_jobs (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,                 -- e.g. hh.ru, habr
    source_id TEXT NOT NULL,              -- ID on the source platform
    source_hash TEXT NOT NULL,            -- hash for deduplication (SHA256 on source+id)
    title TEXT,
    content_text TEXT,
    content_html TEXT,
    source_url TEXT,                      -- прямая ссылка на вакансию на сайте-источнике
    raw_json JSONB,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source, source_id),
    UNIQUE (source_hash)
);

-- If upgrading an existing DB, ensure source_url column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='raw_jobs' AND column_name='source_url'
    ) THEN
        ALTER TABLE raw_jobs ADD COLUMN source_url TEXT;
    END IF;
END$$;

-- Processed jobs: scored/enriched results
-- embedding column uses pgvector vector type with dimension 1536 by default (adjust if you use different model)
CREATE TABLE IF NOT EXISTS processed_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_job_id BIGINT NOT NULL REFERENCES raw_jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_metadata(id) ON DELETE SET NULL,
    relevance_score DOUBLE PRECISION,    -- 0.0 - 1.0
    matched_skills TEXT[],
    hard_skills TEXT[],
    ai_recommendation TEXT,
    embedding vector(384),               -- vector dimension: change if your embedding model differs (set to 384 for all-MiniLM-L6-v2)
    parsed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    extra JSONB
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_raw_jobs_source_hash ON raw_jobs (source_hash);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_source_id ON raw_jobs (source, source_id);
CREATE INDEX IF NOT EXISTS idx_processed_jobs_user_id ON processed_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_processed_jobs_score ON processed_jobs (relevance_score DESC);

-- pgvector ivfflat index for approximate nearest neighbor search. Requires ANALYZE and proper number of lists.
-- Note: change 'lists' depending on dataset size; for small datasets ivfflat may not help.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_processed_jobs_embedding_ivfflat'
    ) THEN
        -- Create ivfflat index; lists=100 is a reasonable default for medium datasets
        EXECUTE 'CREATE INDEX idx_processed_jobs_embedding_ivfflat ON processed_jobs USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)';
    END IF;
EXCEPTION WHEN undefined_function THEN
    -- If ivfflat is not available (old pgvector), skip index creation; user can create a GIN index instead
    RAISE NOTICE 'ivfflat index not supported in this pgvector build; skip advanced vector index creation.';
END$$;

-- Optional GIN index on JSONB preferences for common queries
CREATE INDEX IF NOT EXISTS idx_users_preferences_gin ON users_metadata USING GIN (preferences);

-- Topics table (optional) for keeping track of kafka processing state (dedup/at-least-once handling hints)
CREATE TABLE IF NOT EXISTS kafka_offsets (
    topic TEXT NOT NULL,
    partition INT NOT NULL,
    offset BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (topic, partition)
);

-- Helpful function to upsert processed job by raw_job_id
CREATE OR REPLACE FUNCTION upsert_processed_job(
    p_raw_job_id BIGINT,
    p_relevance DOUBLE PRECISION,
    p_matched_skills TEXT[],
    p_hard_skills TEXT[],
    p_ai_recommendation TEXT,
    p_embedding vector
) RETURNS VOID AS $$
BEGIN
    INSERT INTO processed_jobs (raw_job_id, relevance_score, matched_skills, hard_skills, ai_recommendation, embedding)
    VALUES (p_raw_job_id, p_relevance, p_matched_skills, p_hard_skills, p_ai_recommendation, p_embedding)
    ON CONFLICT (raw_job_id) DO UPDATE SET
        relevance_score = EXCLUDED.relevance_score,
        matched_skills = EXCLUDED.matched_skills,
        hard_skills = EXCLUDED.hard_skills,
        ai_recommendation = EXCLUDED.ai_recommendation,
        embedding = EXCLUDED.embedding,
        parsed_at = now();
END;
$$ LANGUAGE plpgsql;

-- Final ANALYZE to fill planner statistics (helps ivfflat and others)
ANALYZE;
