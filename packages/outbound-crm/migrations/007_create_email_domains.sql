-- Migration 007: Create Email Domains table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 7
-- Standalone table - no foreign keys

CREATE TABLE IF NOT EXISTS email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT NOT NULL,
    smtp_pass_encrypted TEXT NOT NULL,
    daily_limit INTEGER DEFAULT 50,
    sent_today INTEGER DEFAULT 0,
    warmup_phase BOOLEAN DEFAULT true,
    reputation_score FLOAT DEFAULT 100.0 CHECK (reputation_score >= 0 AND reputation_score <= 100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_domains_active ON email_domains(active);
CREATE INDEX idx_email_domains_domain ON email_domains(domain);

-- Updated_at trigger
CREATE TRIGGER set_email_domains_updated_at
    BEFORE UPDATE ON email_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE email_domains ENABLE ROW LEVEL SECURITY;

-- Only service role can access email domains (contains SMTP credentials)
CREATE POLICY "Service role full access on email_domains"
    ON email_domains
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
