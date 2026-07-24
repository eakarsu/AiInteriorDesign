BEGIN;
CREATE TABLE IF NOT EXISTS interior_ai_results(
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  provider_receipt_id TEXT,
  result TEXT NOT NULL,
  usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS interior_ai_results_user_created_idx
  ON interior_ai_results(user_id, created_at DESC);
COMMIT;
