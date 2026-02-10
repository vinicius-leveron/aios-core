-- Test Data Seed for E2E Testing
-- Run this AFTER the main migrations (001-010)
-- These records are used by tests/e2e-test.js
--
-- To run: psql $DATABASE_URL -f tests/seed-test-data.sql
-- To cleanup: psql $DATABASE_URL -c "DELETE FROM leads WHERE email LIKE '%@test.leveron.com'"

-- Test ICP (if not already seeded by 009)
INSERT INTO icps (slug, name, description, scoring_weights, active)
VALUES (
  'test_icp',
  'Test ICP',
  'ICP for E2E testing',
  '{
    "interaction": {"email_opened": 5, "email_clicked": 15, "email_replied": 30},
    "profile": {"has_website": 5, "company_medium_plus": 10, "role_decisor": 15},
    "hot_threshold": 50
  }'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Test cadence
INSERT INTO cadences (name, icp_id, steps, active)
SELECT
  'Test Cadence',
  id,
  '[
    {"step": 0, "delay_days": 0, "channel": "email", "subject": "Test Step 0"},
    {"step": 1, "delay_days": 3, "channel": "email", "subject": "Test Step 1"},
    {"step": 2, "delay_days": 7, "channel": "email", "subject": "Test Step 2"}
  ]'::jsonb,
  true
FROM icps WHERE slug = 'test_icp'
ON CONFLICT DO NOTHING;

-- Test email domain
INSERT INTO email_domains (domain, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, daily_limit, sent_today, active, reputation_score, warmup_phase)
VALUES (
  'test.leveron.com',
  'smtp.resend.com',
  465,
  'resend',
  'CONFIGURE_AFTER_DEPLOY',
  10,
  0,
  true,
  100,
  'test'
)
ON CONFLICT (domain) DO NOTHING;

-- Test message templates
INSERT INTO message_templates (cadence_id, step_number, version, subject, body, active)
SELECT
  c.id,
  0,
  'A',
  'Test: {{first_name}}, pergunta sobre {{company_name}}',
  'Ola {{first_name}},

Estou entrando em contato pois notei que o {{company_name}} poderia se beneficiar de automacao.

Este e um email de teste do sistema outbound.

Atenciosamente,
Equipe Leveron',
  true
FROM cadences c
JOIN icps i ON c.icp_id = i.id
WHERE i.slug = 'test_icp'
ON CONFLICT DO NOTHING;

-- Test leads (3 in different statuses)
INSERT INTO leads (first_name, last_name, email, company_name, role, source, status, icp_id, cadence_id, email_validated)
SELECT
  'Test', 'New', 'new@test.leveron.com', 'Escritorio Teste New', 'Advogado', 'manual_test', 'new',
  i.id, c.id, false
FROM icps i JOIN cadences c ON c.icp_id = i.id WHERE i.slug = 'test_icp'
ON CONFLICT DO NOTHING;

INSERT INTO leads (first_name, last_name, email, company_name, role, source, status, icp_id, cadence_id, email_validated)
SELECT
  'Test', 'Enriched', 'enriched@test.leveron.com', 'Escritorio Teste Enriched', 'Socio', 'google_maps', 'enriched',
  i.id, c.id, true
FROM icps i JOIN cadences c ON c.icp_id = i.id WHERE i.slug = 'test_icp'
ON CONFLICT DO NOTHING;

INSERT INTO leads (first_name, last_name, email, company_name, role, source, status, icp_id, cadence_id, email_validated, cadence_step, cadence_started_at, cadence_paused)
SELECT
  'Test', 'InCadence', 'cadence@test.leveron.com', 'Escritorio Teste Cadence', 'Socio-diretor', 'linkedin', 'in_cadence',
  i.id, c.id, true, 0, NOW(), false
FROM icps i JOIN cadences c ON c.icp_id = i.id WHERE i.slug = 'test_icp'
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'Leads:' as info, count(*) as total FROM leads WHERE email LIKE '%@test.leveron.com';
SELECT 'Domains:' as info, count(*) as total FROM email_domains WHERE domain = 'test.leveron.com';
