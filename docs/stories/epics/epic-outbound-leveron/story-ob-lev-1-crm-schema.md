# Story OB-LEV-1: CRM Schema & Database Setup

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** Draft
**Priority:** Critical
**Complexity:** Medium
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@data-engineer"
quality_gate: "@architect"
quality_gate_tools: ["schema-review", "migration-validation"]

---

## Story

**As a** outbound operations manager,
**I want** a CRM database structured in Supabase with tables for leads, ICPs, cadences, templates, interactions, experiments and email domains,
**so that** all outbound data is centralized, queryable, and ready for N8N workflow integration.

---

## Acceptance Criteria

1. Table `leads` created in Supabase with all fields: identification (name, email, phone, linkedin, instagram), company (name, website, size, industry, role), qualification (icp_id, source, lead_score, status), cadence tracking (cadence_id, step, started_at, paused), email tracking (sent, opened, clicked, replied, last_contacted), and metadata (notes, tags, custom_fields, timestamps)
2. Table `icps` created with fields: name, company, description, criteria (JSONB), active, timestamps
3. Table `cadences` created with fields: name, icp_id (FK), channel, steps (JSONB), active, timestamps
4. Table `message_templates` created with fields: cadence_id (FK), step_number, channel, subject, body, variables (array), version, timestamps
5. Table `interactions` created with fields: lead_id (FK), type, channel, metadata (JSONB), timestamps
6. Table `experiments` created with fields: name, icp_id (FK), variant_a (JSONB), variant_b (JSONB), status, winner, results (JSONB), timestamps
7. Table `email_domains` created with fields: domain, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, daily_limit, sent_today, warmup_phase, reputation_score, active, timestamps
8. View `pipeline_view` created showing lead count by status, contacted last 7 days, avg score
9. View `cadence_performance` created showing reply rate per cadence per ICP
10. RLS (Row Level Security) enabled on all tables with appropriate policies
11. ICP "escritorios_advocacia" seeded with criteria for law firms (5-50 advogados, socio-diretor as decisor)
12. Cadence "leveron_escritorios_email_v1" seeded with 4-step email cadence (day 0, 3, 7, 12)
13. All foreign keys and indexes properly configured for query performance

---

## Tasks / Subtasks

- [ ] Task 1: Design and create migration files (AC: 1-7)
  - [ ] 1.1 Create migration for `icps` table (must be first - referenced by others)
  - [ ] 1.2 Create migration for `cadences` table (references icps)
  - [ ] 1.3 Create migration for `leads` table (references icps, cadences)
  - [ ] 1.4 Create migration for `message_templates` table (references cadences)
  - [ ] 1.5 Create migration for `interactions` table (references leads)
  - [ ] 1.6 Create migration for `experiments` table (references icps)
  - [ ] 1.7 Create migration for `email_domains` table (standalone)
  - [ ] 1.8 Run migrations against Supabase instance
  - [ ] 1.9 Verify all tables created with correct columns and types

- [ ] Task 2: Create views (AC: 8, 9)
  - [ ] 2.1 Create `pipeline_view` with status grouping and metrics
  - [ ] 2.2 Create `cadence_performance` view with reply rate calculation
  - [ ] 2.3 Verify views return correct data with test records

- [ ] Task 3: Configure RLS and indexes (AC: 10, 13)
  - [ ] 3.1 Enable RLS on all tables
  - [ ] 3.2 Create policies for service role access (N8N will use service key)
  - [ ] 3.3 Create indexes on frequently queried columns: leads.status, leads.icp_id, leads.cadence_id, leads.email, interactions.lead_id, interactions.created_at
  - [ ] 3.4 Verify RLS blocks anonymous access but allows service role

- [ ] Task 4: Seed initial data (AC: 11, 12)
  - [ ] 4.1 Insert ICP "escritorios_advocacia" with criteria JSONB
  - [ ] 4.2 Insert cadence "leveron_escritorios_email_v1" with 4 steps
  - [ ] 4.3 Insert 4 message templates (one per cadence step) with placeholder copy
  - [ ] 4.4 Verify seed data is queryable

- [ ] Task 5: Validation
  - [ ] 5.1 Test insert/update/delete on each table
  - [ ] 5.2 Test foreign key constraints (orphan prevention)
  - [ ] 5.3 Test views with sample data
  - [ ] 5.4 Document connection string and service key location

---

## Dev Notes

### Schema Reference

Full SQL schema available in `docs/outbound/OUTBOUND-STRATEGY-PLAN.md` section 7.

### Key Decisions

- **JSONB for flexibility:** `criteria`, `steps`, `metadata`, `custom_fields`, `results` use JSONB to avoid schema rigidity for experimental fields
- **Status as TEXT:** Lead status uses TEXT (not enum) for flexibility during experimentation: 'new', 'enriched', 'in_cadence', 'replied', 'meeting', 'proposal', 'won', 'lost', 'unsubscribed'
- **Encrypted SMTP passwords:** `smtp_pass_encrypted` stores encrypted values (encryption handled at application layer in N8N)
- **sent_today counter:** Resets daily via N8N cron workflow (not DB trigger)

### Supabase MCP

The project has Supabase MCP configured at `.aios-core/infrastructure/tools/mcp/supabase.yaml`. Use it for database operations.

### Testing

- Insert sample leads, verify FK constraints
- Query views with sample data
- Test RLS blocks unauthenticated access

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-1 | Created 2026-02-09*
