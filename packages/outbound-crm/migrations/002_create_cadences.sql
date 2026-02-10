-- Migration 002: Create Cadences table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 3
-- References: icps

CREATE TABLE IF NOT EXISTS cadences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icp_id UUID REFERENCES icps(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'multi')),
    steps JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Steps JSONB format:
-- [
--   { "step": 0, "delay_days": 0, "channel": "email", "template_id": null },
--   { "step": 1, "delay_days": 3, "channel": "email", "template_id": null },
--   { "step": 2, "delay_days": 7, "channel": "email", "template_id": null },
--   { "step": 3, "delay_days": 12, "channel": "email", "template_id": null }
-- ]

-- Indexes
CREATE INDEX idx_cadences_icp_id ON cadences(icp_id);
CREATE INDEX idx_cadences_active ON cadences(active);

-- Updated_at trigger
CREATE TRIGGER set_cadences_updated_at
    BEFORE UPDATE ON cadences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE cadences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on cadences"
    ON cadences
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on cadences"
    ON cadences
    FOR SELECT
    USING (auth.role() = 'authenticated');
