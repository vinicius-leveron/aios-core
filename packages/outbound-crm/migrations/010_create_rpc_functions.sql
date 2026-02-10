-- Migration 010: RPC Functions for Edge Functions
-- Required by: edge-functions/track/index.ts

-- Atomic counter increment for lead fields
-- Used by tracking edge function to safely increment emails_opened/emails_clicked
CREATE OR REPLACE FUNCTION increment_lead_counter(
  p_lead_id UUID,
  p_field TEXT
) RETURNS void AS $$
BEGIN
  -- Only allow known counter fields (prevent SQL injection)
  IF p_field NOT IN ('emails_sent', 'emails_opened', 'emails_clicked', 'emails_replied') THEN
    RAISE EXCEPTION 'Invalid counter field: %', p_field;
  END IF;

  EXECUTE format(
    'UPDATE leads SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    p_field, p_field
  ) USING p_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic counter increment for domain sent_today
-- Used by cadence engine to safely increment sent_today on email_domains
CREATE OR REPLACE FUNCTION increment_domain_sent(
  p_domain_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE email_domains
  SET sent_today = COALESCE(sent_today, 0) + 1
  WHERE id = p_domain_id
    AND sent_today < daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement domain reputation on bounce
-- Used by bounce handler workflow
CREATE OR REPLACE FUNCTION decrement_domain_reputation(
  p_domain TEXT,
  p_amount INT DEFAULT 5
) RETURNS void AS $$
BEGIN
  UPDATE email_domains
  SET reputation_score = GREATEST(0, COALESCE(reputation_score, 100) - p_amount)
  WHERE domain = p_domain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch decay lead scores (weekly job)
-- Used by lead scoring workflow WF-06
CREATE OR REPLACE FUNCTION decay_lead_scores(
  p_days_inactive INT DEFAULT 14,
  p_decay_factor DECIMAL DEFAULT 0.9
) RETURNS INT AS $$
DECLARE
  affected INT;
BEGIN
  WITH decayed AS (
    UPDATE leads
    SET lead_score = GREATEST(0, FLOOR(lead_score * p_decay_factor))
    WHERE lead_score > 0
      AND last_contacted_at < NOW() - (p_days_inactive || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO affected FROM decayed;

  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset daily domain counters (midnight job)
-- Used by WF-AUX-daily-reset
CREATE OR REPLACE FUNCTION reset_domain_daily_counters()
RETURNS INT AS $$
DECLARE
  affected INT;
BEGIN
  WITH reset AS (
    UPDATE email_domains
    SET sent_today = 0
    WHERE sent_today > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO affected FROM reset;

  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
