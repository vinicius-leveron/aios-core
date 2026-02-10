-- Migration 006: Create Experiments table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 6
-- References: icps

CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icp_id UUID REFERENCES icps(id) ON DELETE SET NULL,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'paused', 'concluded')),
    winner TEXT CHECK (winner IN ('A', 'B') OR winner IS NULL),
    results JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- Variant JSONB format:
-- {
--   "subject": "{{company_name}} - pergunta rapida",
--   "body": "Ola {{first_name}}, ...",
--   "sent": 0,
--   "opened": 0,
--   "clicked": 0,
--   "replied": 0
-- }

-- Indexes
CREATE INDEX idx_experiments_icp_id ON experiments(icp_id);
CREATE INDEX idx_experiments_status ON experiments(status);

-- RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on experiments"
    ON experiments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on experiments"
    ON experiments
    FOR SELECT
    USING (auth.role() = 'authenticated');
