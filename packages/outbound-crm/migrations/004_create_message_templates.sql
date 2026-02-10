-- Migration 004: Create Message Templates table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 4
-- References: cadences

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cadence_id UUID REFERENCES cadences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'instagram')),
    subject TEXT,
    body TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    version TEXT DEFAULT 'A' CHECK (version IN ('A', 'B')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_templates_cadence_id ON message_templates(cadence_id);
CREATE INDEX idx_templates_step ON message_templates(cadence_id, step_number, version);

-- Unique constraint: one active template per cadence+step+version
CREATE UNIQUE INDEX idx_templates_unique_active
    ON message_templates(cadence_id, step_number, version)
    WHERE active = true;

-- Updated_at trigger
CREATE TRIGGER set_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on message_templates"
    ON message_templates
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on message_templates"
    ON message_templates
    FOR SELECT
    USING (auth.role() = 'authenticated');
