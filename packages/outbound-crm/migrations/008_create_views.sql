-- Migration 008: Create Views
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 8, 9

-- Pipeline View: overview of lead funnel by status
CREATE OR REPLACE VIEW pipeline_view AS
SELECT
    status,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE last_contacted_at > now() - interval '7 days') AS contacted_7d,
    COUNT(*) FILTER (WHERE last_replied_at > now() - interval '7 days') AS replied_7d,
    ROUND(AVG(lead_score), 1) AS avg_score,
    MIN(created_at) AS oldest_lead,
    MAX(created_at) AS newest_lead
FROM leads
GROUP BY status
ORDER BY
    CASE status
        WHEN 'new' THEN 1
        WHEN 'enriched' THEN 2
        WHEN 'in_cadence' THEN 3
        WHEN 'cadence_complete' THEN 4
        WHEN 'replied' THEN 5
        WHEN 'meeting' THEN 6
        WHEN 'proposal' THEN 7
        WHEN 'won' THEN 8
        WHEN 'lost' THEN 9
        WHEN 'bounced' THEN 10
        WHEN 'unsubscribed' THEN 11
        ELSE 12
    END;

-- Cadence Performance: reply rate per cadence per ICP
CREATE OR REPLACE VIEW cadence_performance AS
SELECT
    c.name AS cadence_name,
    c.channel,
    i.name AS icp_name,
    COUNT(DISTINCT l.id) AS total_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.emails_sent > 0) AS leads_contacted,
    COUNT(DISTINCT l.id) FILTER (WHERE l.emails_opened > 0) AS leads_opened,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'replied') AS leads_replied,
    ROUND(
        COUNT(DISTINCT l.id) FILTER (WHERE l.emails_opened > 0)::numeric /
        NULLIF(COUNT(DISTINCT l.id) FILTER (WHERE l.emails_sent > 0), 0) * 100, 2
    ) AS open_rate,
    ROUND(
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'replied')::numeric /
        NULLIF(COUNT(DISTINCT l.id) FILTER (WHERE l.emails_sent > 0), 0) * 100, 2
    ) AS reply_rate
FROM cadences c
JOIN icps i ON c.icp_id = i.id
LEFT JOIN leads l ON l.cadence_id = c.id
WHERE c.active = true
GROUP BY c.name, c.channel, i.name;

-- Domain Health: current status of all email domains
CREATE OR REPLACE VIEW domain_health AS
SELECT
    domain,
    active,
    warmup_phase,
    daily_limit,
    sent_today,
    ROUND((sent_today::numeric / NULLIF(daily_limit, 0)) * 100, 1) AS utilization_pct,
    reputation_score,
    CASE
        WHEN reputation_score >= 80 THEN 'healthy'
        WHEN reputation_score >= 60 THEN 'warning'
        ELSE 'critical'
    END AS health_status,
    updated_at AS last_activity
FROM email_domains
ORDER BY reputation_score ASC;

-- Hot Leads: top scoring leads ready for manual outreach
CREATE OR REPLACE VIEW hot_leads AS
SELECT
    l.id,
    l.first_name,
    l.last_name,
    l.email,
    l.company_name,
    l.role,
    l.lead_score,
    l.status,
    l.emails_sent,
    l.emails_opened,
    l.emails_replied,
    l.last_contacted_at,
    l.last_replied_at,
    i.name AS icp_name
FROM leads l
LEFT JOIN icps i ON l.icp_id = i.id
WHERE l.lead_score >= 50
    AND l.status NOT IN ('won', 'lost', 'unsubscribed', 'bounced')
ORDER BY l.lead_score DESC
LIMIT 20;
