-- Phase 3.2 — SugarCube knowledge base (FTS5 when supported on target D1)

CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  patient_context TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
