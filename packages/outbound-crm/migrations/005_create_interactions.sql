-- Migration 005: Create Interactions table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 5
-- References: leads
-- High-volume table - optimized for insert performance and time-range queries

CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'email_sent', 'email_opened', 'email_clicked', 'email_replied', 'email_bounced',
        'linkedin_sent', 'linkedin_replied',
        'whatsapp_sent', 'whatsapp_replied',
        'auto_reply',
        'score_updated',
        'status_changed',
        'weekly_report'
    )),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'instagram', 'system')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes optimized for common queries
CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);
CREATE INDEX idx_interactions_lead_type ON interactions(lead_id, type);

-- Composite for tracking deduplication (open/click per lead per step)
CREATE INDEX idx_interactions_dedup ON interactions(lead_id, type, (metadata->>'step_number'))
    WHERE type IN ('email_opened', 'email_clicked');

-- RLS
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on interactions"
    ON interactions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on interactions"
    ON interactions
    FOR SELECT
    USING (auth.role() = 'authenticated');
