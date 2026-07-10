PRAGMA foreign_keys = ON;

CREATE TABLE corpus_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  official_url TEXT NOT NULL,
  default_license TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE TABLE corpus_sentences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL REFERENCES corpus_sources(id),
  external_id TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  text_sha256 TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  license TEXT NOT NULL CHECK (length(license) > 0),
  source_url TEXT NOT NULL CHECK (length(source_url) > 0),
  quality_status TEXT NOT NULL DEFAULT 'approved',
  cefr_level TEXT,
  scene_key TEXT,
  sample_bucket INTEGER NOT NULL CHECK (sample_bucket BETWEEN 0 AND 999),
  UNIQUE(source_id, external_id),
  UNIQUE(text_sha256, language)
);

CREATE INDEX corpus_sentences_candidate_idx
  ON corpus_sentences(quality_status, cefr_level, scene_key, sample_bucket, id);

CREATE TABLE lesson_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sentence_id INTEGER NOT NULL UNIQUE REFERENCES corpus_sentences(id),
  title_zh TEXT NOT NULL,
  translation_zh TEXT NOT NULL,
  teaching_note_zh TEXT,
  audio_key TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  daily_eligible INTEGER NOT NULL DEFAULT 0 CHECK (daily_eligible IN (0, 1)),
  published_at TEXT
);

CREATE INDEX lesson_cards_daily_idx ON lesson_cards(daily_eligible, status, id);

CREATE TABLE user_daily_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  local_date TEXT NOT NULL,
  lesson_card_id INTEGER NOT NULL REFERENCES lesson_cards(id),
  sentence_id INTEGER NOT NULL REFERENCES corpus_sentences(id),
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  next_review_at TEXT,
  UNIQUE(user_id, local_date),
  UNIQUE(user_id, sentence_id)
);

CREATE INDEX user_daily_assignments_review_idx
  ON user_daily_assignments(user_id, next_review_at);

CREATE TABLE user_sentence_history (
  user_id TEXT NOT NULL,
  sentence_id INTEGER NOT NULL REFERENCES corpus_sentences(id),
  first_assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assignment_id INTEGER NOT NULL REFERENCES user_daily_assignments(id),
  PRIMARY KEY(user_id, sentence_id)
);
