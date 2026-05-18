import os
import json
import time
import math
import hashlib
import logging
from typing import List

from kafka import KafkaConsumer
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

LOG = logging.getLogger("ml_scorer")
logging.basicConfig(level=logging.INFO)


def getenv(k, d=None):
    v = os.getenv(k)
    return v if v is not None else d


def pseudo_embedding(text: str, dim: int) -> List[float]:
    # Deterministic pseudo-embedding fallback: SHA256 chunks -> floats in [-1,1]
    h = hashlib.sha256(text.encode("utf-8")).digest()
    out = []
    i = 0
    while len(out) < dim:
        # expand hash
        hh = hashlib.sha256(h + i.to_bytes(4, "little")).digest()
        for b in hh:
            if len(out) >= dim:
                break
            out.append((b / 255.0) * 2.0 - 1.0)
        i += 1
    return out[:dim]


def cosine(a: List[float], b: List[float]) -> float:
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)


class MLScorer:
    def __init__(self):
        self.kafka_brokers = getenv("KAFKA_BROKERS", "kafka:9092")
        self.topic = getenv("RAW_TOPIC", "raw_jobs_topic")
        self.scored_topic = getenv("SCORED_TOPIC", "scored_jobs_topic")
        self.db_url = getenv("DATABASE_URL", "postgres://app:changeme@postgres:5432/jobsdb")
        self.embedding_dim = int(getenv("EMBEDDING_DIM", "1536"))
        self.skills = [s.strip().lower() for s in getenv("SKILLS_CSV", "python,java,sql,aws,react").split(",") if s.strip()]
        self.embedder = getenv("EMBEDDER", "pseudo")  # options: openai | local | pseudo
        self.local_model_name = getenv("LOCAL_MODEL", "all-MiniLM-L6-v2")
        self.local_model = None
        if self.embedder == "local":
            if SentenceTransformer is None:
                LOG.error("sentence-transformers not available; install requirements or change EMBEDDER")
            else:
                LOG.info("loading local embedder model %s", self.local_model_name)
                self.local_model = SentenceTransformer(self.local_model_name)

        self.consumer = KafkaConsumer(
            self.topic,
            bootstrap_servers=self.kafka_brokers.split(","),
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            group_id="ml-scorer-group",
            value_deserializer=lambda v: v.decode("utf-8") if v else None,
            key_deserializer=lambda k: k.decode("utf-8") if k else None,
        )

        self.conn = None

    def connect_db(self):
        if self.conn:
            return
        self.conn = psycopg2.connect(self.db_url)
        self.conn.autocommit = True

    def fetch_raw_job(self, raw_id: int):
        cur = self.conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, title, content_text, content_html, raw_json FROM raw_jobs WHERE id = %s", (raw_id,))
        return cur.fetchone()

    def fetch_all_users(self):
        cur = self.conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, base_resume::text as base_resume FROM users_metadata WHERE base_resume IS NOT NULL")
        return cur.fetchall()

    def upsert_processed(self, raw_id: int, relevance: float, matched: List[str], hard: List[str], ai_rec: str, embedding: List[float]):
        # Convert embedding to pgvector literal like '[0.1,0.2]'
        emb_text = "[" + ",".join(f"{x:.6f}" for x in embedding) + "]"
        cur = self.conn.cursor()
        cur.execute("SELECT upsert_processed_job(%s, %s, %s, %s, %s, %s::vector)", (raw_id, relevance, matched, hard, ai_rec, emb_text))

    def extract_skills(self, text: str):
        t = text.lower()
        matched = [s for s in self.skills if s in t]
        # hard skills: pick those that look exact (same as matched here)
        return matched, matched

    def embed_text(self, text: str):
        # Local embedder
        if self.embedder == "local" and self.local_model is not None:
            try:
                emb = self.local_model.encode(text)
                return emb.tolist() if hasattr(emb, 'tolist') else list(emb)
            except Exception as e:
                LOG.warning("local embedding failed: %s", e)

        # OpenAI embedder
        if self.embedder == "openai":
            key = getenv("OPENAI_API_KEY")
            if key:
                try:
                    url = "https://api.openai.com/v1/embeddings"
                    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
                    payload = {"model": "text-embedding-3-small", "input": text}
                    r = requests.post(url, headers=headers, json=payload, timeout=15)
                    r.raise_for_status()
                    j = r.json()
                    return j["data"][0]["embedding"]
                except Exception as e:
                    LOG.warning("OpenAI embeddings failed: %s", e)

        # fallback to pseudo embedding
        return pseudo_embedding(text, self.embedding_dim)

    def process_message(self, msg):
        raw_id = int(msg.value)
        LOG.info("Processing raw job id=%d", raw_id)
        job = self.fetch_raw_job(raw_id)
        if not job:
            LOG.warning("raw job %d not found", raw_id)
            return

        content = job.get("content_text") or job.get("title") or ""
        embedding = self.embed_text(content)

        # compute relevance against users
        users = self.fetch_all_users()
        max_score = 0.0
        for u in users:
            br = u.get("base_resume") or ""
            if br == "":
                continue
            uemb = self.embed_text(br)
            sc = cosine(embedding, uemb)
            if sc > max_score:
                max_score = sc

        # simple skill extraction
        matched, hard = self.extract_skills(content)
        ai_rec = "Top skills: " + ", ".join(matched) if matched else "No skills detected"

        # Map similarity (-1..1) to 0..1
        score = max(0.0, (max_score + 1.0) / 2.0)

        self.upsert_processed(raw_id, score, matched, hard, ai_rec, embedding)
        LOG.info("Upserted processed job %d score=%.4f matched=%s", raw_id, score, matched)

    def run(self):
        self.connect_db()
        LOG.info("ML Scorer started, listening to %s", self.topic)
        for msg in self.consumer:
            try:
                self.process_message(msg)
            except Exception as e:
                LOG.exception("failed to process message: %s", e)


if __name__ == "__main__":
    s = MLScorer()
    s.run()
