-- ============================================================
-- Outbound CRM - Combined Migrations
-- Generated: 2026-02-10T02:39:07.154Z
-- Total migrations: 12
-- ============================================================
-- Instructions:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Paste this entire file
-- 4. Click "Run"
-- ============================================================

-- ====== 001_create_icps.sql ======
-- Migration 001: Create ICPs table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 2
-- Must run FIRST - referenced by leads, cadences, experiments

CREATE TABLE IF NOT EXISTS icps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    criteria JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_icps_company ON icps(company);
CREATE INDEX idx_icps_active ON icps(active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_icps_updated_at
    BEFORE UPDATE ON icps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE icps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on icps"
    ON icps
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on icps"
    ON icps
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- ====== 002_create_cadences.sql ======
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


-- ====== 003_create_leads.sql ======
-- Migration 003: Create Leads table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 1
-- References: icps, cadences

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    email_validated BOOLEAN DEFAULT false,
    phone TEXT,
    whatsapp TEXT,
    linkedin_url TEXT,
    instagram_handle TEXT,

    -- Company
    company_name TEXT,
    company_website TEXT,
    company_size TEXT CHECK (company_size IN ('micro', 'small', 'medium', 'large') OR company_size IS NULL),
    industry TEXT,
    role TEXT,

    -- Qualification
    icp_id UUID REFERENCES icps(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    lead_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'enriched', 'unqualified', 'incomplete',
        'in_cadence', 'cadence_complete',
        'replied', 'meeting', 'proposal', 'won', 'lost',
        'bounced', 'unsubscribed'
    )),

    -- Cadence
    cadence_id UUID REFERENCES cadences(id) ON DELETE SET NULL,
    cadence_step INTEGER DEFAULT 0,
    cadence_started_at TIMESTAMPTZ,
    cadence_paused BOOLEAN DEFAULT false,

    -- Tracking
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    last_replied_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for frequent queries
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_icp_id ON leads(icp_id);
CREATE INDEX idx_leads_cadence_id ON leads(cadence_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_leads_last_contacted ON leads(last_contacted_at);

-- Composite index for cadence engine query
CREATE INDEX idx_leads_cadence_active ON leads(status, cadence_paused)
    WHERE status = 'in_cadence' AND cadence_paused = false;

-- Updated_at trigger
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on leads"
    ON leads
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on leads"
    ON leads
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- ====== 004_create_message_templates.sql ======
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


-- ====== 005_create_interactions.sql ======
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


-- ====== 006_create_experiments.sql ======
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


-- ====== 007_create_email_domains.sql ======
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


-- ====== 008_create_views.sql ======
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


-- ====== 009_seed_data.sql ======
-- Migration 009: Seed Initial Data
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 11, 12

-- Seed ICP: Escritorios de Advocacia
INSERT INTO icps (name, company, description, criteria, active)
VALUES (
    'escritorios_advocacia',
    'leveron',
    'Escritorios de advocacia de pequeno e medio porte (5-50 advogados). Decisor: socio-diretor ou socio-administrativo. Dor: processos manuais, falta de sistemas, gestao ineficiente.',
    '{
        "segment": "escritorios_advocacia",
        "company_size_min": 5,
        "company_size_max": 50,
        "decision_maker_roles": ["socio-diretor", "socio-administrativo", "socio", "diretor"],
        "budget_range": {"min": 5000, "max": 30000, "currency": "BRL"},
        "pain_points": ["processos_manuais", "falta_sistemas", "gestao_ineficiente"],
        "channels": ["email", "linkedin"],
        "scoring_weights": {
            "interaction": {
                "email_opened": 5,
                "email_clicked": 15,
                "email_replied": 30,
                "multi_open_bonus": 2,
                "multi_email_bonus": 10
            },
            "profile": {
                "has_website": 5,
                "company_medium_plus": 10,
                "role_decisor": 15,
                "has_linkedin": 5,
                "source_linkedin": 10,
                "source_maps_oab": 5
            },
            "decay": {
                "inactive_days_threshold": 14,
                "weekly_decay_pct": 10
            },
            "hot_threshold": 50
        }
    }'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

-- Seed Cadence: Email v1 for Escritorios
INSERT INTO cadences (name, icp_id, channel, steps, active)
SELECT
    'leveron_escritorios_email_v1',
    id,
    'email',
    '[
        {"step": 0, "delay_days": 0, "channel": "email", "description": "Abertura - identificar dor + pergunta aberta"},
        {"step": 1, "delay_days": 3, "channel": "email", "description": "Follow-up com valor - case de resultado"},
        {"step": 2, "delay_days": 7, "channel": "email", "description": "Prova social - resultado de escritorio similar"},
        {"step": 3, "delay_days": 12, "channel": "email", "description": "Breakup - ultimo contato, tom casual"}
    ]'::jsonb,
    true
FROM icps
WHERE name = 'escritorios_advocacia'
ON CONFLICT DO NOTHING;

-- Seed Message Templates (placeholder copy - to be replaced with final copy)
-- Step 0: Abertura
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    0,
    'email',
    '{{company_name}} - pergunta rapida sobre gestao',
    E'Ola {{first_name}},\n\nVi que o {{company_name}} atua na area {{industry}} e fiquei curioso sobre como voces gerenciam os processos internos do escritorio hoje.\n\nMuitos escritorios que conversamos ainda dependem de planilhas e processos manuais para controle de prazos, documentos e comunicacao com clientes.\n\nVoces ja pensaram em automatizar alguma parte da operacao?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name', 'industry'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 1: Follow-up com valor
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    1,
    'email',
    'RE: {{company_name}} - pergunta rapida sobre gestao',
    E'{{first_name}}, complementando meu ultimo email.\n\nRecentemente ajudamos um escritorio de porte similar ao {{company_name}} a reduzir em 40%% o tempo gasto com tarefas administrativas, simplesmente automatizando o controle de prazos processuais.\n\nO interessante eh que a mudanca nao exigiu trocar nenhum sistema - apenas integramos o que eles ja usavam.\n\nSe fizer sentido, posso compartilhar como funcionou?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 2: Prova social
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    2,
    'email',
    'RE: {{company_name}} - pergunta rapida sobre gestao',
    E'{{first_name}}, ultima informacao que achei relevante.\n\nTemos 3 escritorios na regiao que implementaram automacoes no ultimo trimestre:\n\n- Um reduziu erros de prazo de 12/mes para zero\n- Outro economizou 20h/semana da equipe administrativa\n- O terceiro melhorou o tempo de resposta ao cliente em 60%%\n\nSe algum desses cenarios se parece com o que voces enfrentam no {{company_name}}, vale uma conversa de 15 minutos.\n\nO que acha?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 3: Breakup
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    3,
    'email',
    'Devo parar de escrever?',
    E'{{first_name}}, sei que a rotina de um escritorio eh intensa.\n\nEsse eh meu ultimo contato - nao quero ser inconveniente.\n\nSe em algum momento fizer sentido conversar sobre tecnologia para o {{company_name}}, estou a disposicao.\n\nDesejo sucesso!\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;


-- ====== 010_create_rpc_functions.sql ======
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


-- ====== 011_seed_ab_variants.sql ======
-- Migration 011: Seed A/B Test Variant B Templates
-- Epic: OB-LEV | Story: OB-LEV-9 (A/B Testing)
--
-- Creates "B" variants for each cadence step to enable A/B testing.
-- Variant A: Existing templates (consultative, question-based approach)
-- Variant B: Direct value-proposition approach (more assertive)

-- Step 0 Variant B: Direct value proposition (instead of open question)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    0,
    'email',
    '{{first_name}}, 40% menos tempo em tarefas administrativas',
    E'{{first_name}},\n\nEscritorio de advocacia com mais de 5 advogados normalmente gasta 15h/semana em tarefas administrativas que poderiam ser automatizadas.\n\nNa Leveron, ajudamos escritorios como o {{company_name}} a recuperar esse tempo com automacoes simples - sem trocar sistemas, sem complicacao.\n\nResultado medio: 40% de reducao em trabalho manual nos primeiros 30 dias.\n\nPosso mostrar como funciona em 15 minutos?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 1 Variant B: Specific pain point (instead of generic case)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    1,
    'email',
    'RE: {{first_name}}, 40% menos tempo em tarefas administrativas',
    E'{{first_name}}, so complementando.\n\nOs 3 maiores desperdicios de tempo que vemos em escritorios:\n\n1. Controle manual de prazos processuais (risco de perder prazo)\n2. Busca de documentos em pastas e emails (15min+ por busca)\n3. Comunicacao com cliente via WhatsApp sem registro (perde historico)\n\nSe algum desses soa familiar, temos solucoes prontas que resolvem em menos de 2 semanas.\n\nQuer que eu mande um diagnostico rapido do que poderia ser automatizado no {{company_name}}?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 2 Variant B: ROI focused (instead of social proof stories)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    2,
    'email',
    'RE: {{first_name}}, 40% menos tempo em tarefas administrativas',
    E'{{first_name}}, fiz uma conta rapida.\n\nSe o {{company_name}} tem ao menos 1 pessoa dedicada a tarefas administrativas:\n\n- Custo atual: ~R$ 3.500/mes (salario + encargos)\n- Com automacao: libera 60%% desse tempo\n- Economia estimada: R$ 2.100/mes\n- Investimento na automacao: se paga em menos de 3 meses\n\nIsso sem contar o risco zero de perder prazos processuais, que pode custar muito mais.\n\nVale uma conversa de 15 minutos para detalhar esses numeros pro seu caso?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 3 Variant B: Permission-based breakup (instead of simple goodbye)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    3,
    'email',
    'Posso ajudar de outra forma?',
    E'{{first_name}}, entendo que talvez nao seja o momento certo.\n\nSe o timing nao eh agora, sem problema. Mas antes de parar de escrever, queria perguntar:\n\nExiste algum outro desafio no {{company_name}} onde tecnologia poderia ajudar? As vezes a necessidade eh diferente do que imaginamos.\n\nSe preferir, tambem posso enviar nosso guia gratuito: "5 Automacoes que Todo Escritorio Deveria Ter".\n\nDe qualquer forma, desejo sucesso!\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Seed initial A/B experiment
INSERT INTO experiments (name, template_id, cadence_step, status, variants, primary_metric, min_sample_size, max_duration_days)
SELECT
    'Step 0: Question vs Value Prop',
    NULL,
    0,
    'draft',
    '{
        "A": {"description": "Consultative - open question about processes", "sent": 0, "opened": 0, "clicked": 0, "replied": 0},
        "B": {"description": "Direct - 40% time reduction value prop", "sent": 0, "opened": 0, "clicked": 0, "replied": 0}
    }'::jsonb,
    'reply_rate',
    100,
    14
WHERE EXISTS (SELECT 1 FROM cadences WHERE name = 'leveron_escritorios_email_v1')
ON CONFLICT DO NOTHING;

-- Verify
SELECT
    mt.step_number,
    mt.version,
    LEFT(mt.subject, 50) as subject_preview,
    LEFT(mt.body, 60) as body_preview
FROM message_templates mt
JOIN cadences c ON mt.cadence_id = c.id
WHERE c.name = 'leveron_escritorios_email_v1'
ORDER BY mt.step_number, mt.version;


-- ====== 012_add_warmup_tracking.sql ======
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


-- ============================================================
-- All migrations complete!
-- ============================================================