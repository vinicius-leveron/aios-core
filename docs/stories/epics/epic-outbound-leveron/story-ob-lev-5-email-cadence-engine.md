# Story OB-LEV-5: Email Cadence Engine

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** In Progress
**Priority:** Critical
**Complexity:** Very High
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["workflow-review", "integration-testing"]

---

## Story

**As a** outbound operations manager,
**I want** an automated email cadence engine in N8N that sends the right email at the right time to each lead based on their cadence step and schedule,
**so that** the 4-email sequence (day 0, 3, 7, 12) runs automatically without manual intervention, respecting domain daily limits and warmup phases.

---

## Acceptance Criteria

1. N8N workflow `WF-03-email-cadence-engine` created and functional
2. Triggered by daily cron (e.g., 9:00 AM BRT on weekdays)
3. Queries CRM for leads with status 'in_cadence' and cadence_paused = false
4. For each lead, calculates which cadence step should be sent based on cadence_started_at and step delays
5. Sends correct email template for the current step, with variables replaced: {{first_name}}, {{company_name}}, {{role}}, etc
6. Email sent using the appropriate domain from `email_domains` table, respecting daily_limit
7. Domain rotation: distributes sends across available active domains to balance load
8. After sending, updates lead: emails_sent++, last_contacted_at, cadence_step++
9. Creates interaction record in `interactions` table: type='email_sent', channel='email', metadata includes template_id, domain used, subject
10. Leads that complete all 4 steps are moved to status 'cadence_complete'
11. Leads that replied (detected by WF-05) are automatically skipped
12. Leads that bounced are automatically skipped
13. Respects warmup phase: if domain.warmup_phase = true, applies warmup daily_limit instead of full limit
14. Sends only on weekdays (Monday-Friday), not weekends
15. Email includes: proper From name (Leveron), reply-to address, List-Unsubscribe header, text/plain fallback

---

## Tasks / Subtasks

- [ ] Task 1: Create base workflow (AC: 1, 2)
  - [ ] 1.1 Create N8N workflow with cron trigger (9:00 AM BRT, weekdays)
  - [ ] 1.2 Add manual trigger for testing
  - [ ] 1.3 Add weekend check node (skip if Saturday/Sunday)

- [ ] Task 2: Lead selection logic (AC: 3, 4, 11, 12)
  - [ ] 2.1 Query Supabase: leads WHERE status = 'in_cadence' AND cadence_paused = false
  - [ ] 2.2 Join with cadences table to get step configuration
  - [ ] 2.3 Calculate next_send_date for each lead: cadence_started_at + sum of delays for completed steps
  - [ ] 2.4 Filter: only leads where next_send_date <= today
  - [ ] 2.5 Exclude leads that already replied or bounced

- [ ] Task 3: Template rendering (AC: 5)
  - [ ] 3.1 For each lead, fetch message_template for current cadence_step
  - [ ] 3.2 Replace variables: {{first_name}}, {{last_name}}, {{company_name}}, {{role}}, {{industry}}
  - [ ] 3.3 Handle missing variables gracefully (use fallback text or skip variable)
  - [ ] 3.4 Generate both HTML and plain text versions

- [ ] Task 4: Domain management and sending (AC: 6, 7, 13, 15)
  - [ ] 4.1 Query active email_domains where sent_today < daily_limit
  - [ ] 4.2 Implement round-robin domain selection
  - [ ] 4.3 Check warmup_phase flag and apply appropriate limit
  - [ ] 4.4 Send email via SMTP: From, Reply-To, Subject, Body (HTML + text), List-Unsubscribe header
  - [ ] 4.5 Increment domain.sent_today after successful send
  - [ ] 4.6 If all domains exhausted (daily limit reached), stop processing and log

- [ ] Task 5: Post-send updates (AC: 8, 9, 10)
  - [ ] 5.1 Update lead: emails_sent++, last_contacted_at = now(), cadence_step++
  - [ ] 5.2 Insert interaction: type='email_sent', channel='email', metadata={template_id, domain, subject, message_id}
  - [ ] 5.3 Check if lead completed all steps: if cadence_step > max_steps, set status='cadence_complete'
  - [ ] 5.4 Log summary: total_sent, per_domain_sent, skipped_replied, skipped_bounced, domains_exhausted

- [ ] Task 6: Daily limit reset workflow
  - [ ] 6.1 Create separate N8N workflow: cron at 00:00 BRT daily
  - [ ] 6.2 Reset sent_today = 0 for all email_domains
  - [ ] 6.3 Log reset confirmation

- [ ] Task 7: Cadence activation workflow
  - [ ] 7.1 Create workflow to move enriched leads into cadence
  - [ ] 7.2 Set lead status from 'enriched' to 'in_cadence'
  - [ ] 7.3 Set cadence_started_at = now(), cadence_step = 0
  - [ ] 7.4 Assign cadence_id from ICP default cadence
  - [ ] 7.5 Manual or batch trigger (select leads by ICP)

---

## Dev Notes

### Cadence Configuration (from strategy plan)

```
Step 0 (Day 0):  Email 1 - Abertura
  Subject: "{{company_name}} - pergunta rapida sobre gestao"
  Content: Identificar dor + pergunta aberta

Step 1 (Day 3):  Email 2 - Follow-up com valor
  Subject: RE: (mesmo thread)
  Content: Case de resultado ou dado relevante

Step 2 (Day 7):  Email 3 - Prova social
  Subject: RE: (mesmo thread)
  Content: Resultado de outro escritorio similar

Step 3 (Day 12): Email 4 - Breakup
  Subject: "Devo parar de escrever?"
  Content: Ultimo contato, tom casual
```

### Threading Strategy

Emails 2-4 should appear as replies in the same thread:
- Use same Subject with "RE: " prefix
- Set In-Reply-To and References headers pointing to first email's Message-ID
- Store Message-ID of first email in lead custom_fields for thread continuity

### Domain Rotation Logic

```
available_domains = domains WHERE active=true AND sent_today < daily_limit
selected = available_domains[send_count % len(available_domains)]  // round-robin
```

### Rate Limiting

- N8N Wait node: 2-5 seconds between each email send (appear more human)
- Randomize wait time slightly to avoid patterns
- Total throughput: ~720-1800 emails/hour across all domains

### Dependencies

- **Requires:** OB-LEV-1 (CRM), OB-LEV-3 (enriched leads), OB-LEV-4 (email infrastructure)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-5 | Created 2026-02-09*
