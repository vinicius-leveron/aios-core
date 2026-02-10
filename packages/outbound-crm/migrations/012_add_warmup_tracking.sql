-- Migration 012: Add warmup tracking columns
-- Required by: WF-07-warmup-manager.json

-- Track when the current warmup phase started (for phase advancement logic)
ALTER TABLE email_domains
ADD COLUMN IF NOT EXISTS warmup_phase_started_at TIMESTAMPTZ DEFAULT NOW();

-- Track total emails sent (lifetime, not just today)
ALTER TABLE email_domains
ADD COLUMN IF NOT EXISTS total_sent BIGINT DEFAULT 0;

-- Add index for warmup manager query (active domains with their phase)
CREATE INDEX IF NOT EXISTS idx_email_domains_warmup
ON email_domains (active, warmup_phase)
WHERE active = true;

-- Add opted_out status to leads status check if using enum-like validation
-- (The leads table uses TEXT, so this is just documentation)
COMMENT ON COLUMN leads.status IS 'Lead status: new, enriched, in_cadence, replied, bounced, unqualified, opted_out, completed';
