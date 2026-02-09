# Story OB-LEV-4: Email Infrastructure Setup

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** Draft
**Priority:** Critical
**Complexity:** Medium
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@devops"
quality_gate: "@architect"
quality_gate_tools: ["infrastructure-review", "security-validation"]

---

## Story

**As a** outbound operations manager,
**I want** 2-3 email sending domains configured with proper DNS records (SPF, DKIM, DMARC), connected to an SMTP provider, and registered in the CRM,
**so that** cold emails are delivered to inbox (not spam) and domain reputation is protected through warmup and rotation.

---

## Acceptance Criteria

1. 2-3 sending domains purchased (NOT the main Leveron domain) - e.g., leveron-tech.com, leveron-dev.com
2. DNS configured for each domain: SPF record, DKIM record, DMARC record, MX records
3. SMTP provider configured (Amazon SES, Resend, or direct SMTP) with credentials for each domain
4. Each domain registered in `email_domains` table in Supabase with SMTP credentials (encrypted)
5. Test email sent from each domain successfully reaches inbox (not spam) on Gmail, Outlook, and Yahoo
6. Warmup schedule defined and documented: week 1 (5/day), week 2 (15/day), week 3 (30/day), week 4 (50/day)
7. Daily sending limit enforced per domain via `email_domains.daily_limit` field
8. N8N can connect to SMTP and send test email via workflow
9. Reply-to address configured to route responses back to a monitored inbox
10. Unsubscribe header (List-Unsubscribe) configured in email headers for LGPD compliance

---

## Tasks / Subtasks

- [ ] Task 1: Domain acquisition and DNS setup (AC: 1, 2)
  - [ ] 1.1 Purchase 2-3 domains similar to Leveron brand
  - [ ] 1.2 Configure SPF record: `v=spf1 include:[smtp-provider] -all`
  - [ ] 1.3 Configure DKIM: generate key pair, add TXT record
  - [ ] 1.4 Configure DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@[domain]`
  - [ ] 1.5 Configure MX records pointing to email provider
  - [ ] 1.6 Verify DNS propagation (24-48h wait)
  - [ ] 1.7 Test DNS records with MXToolbox or similar

- [ ] Task 2: SMTP provider setup (AC: 3, 8)
  - [ ] 2.1 Choose provider: Amazon SES (recommended for cost) or Resend (recommended for simplicity)
  - [ ] 2.2 Create account and verify domains
  - [ ] 2.3 Generate SMTP credentials (username/password or API key)
  - [ ] 2.4 Test SMTP connection from N8N: create test workflow with Email Send node
  - [ ] 2.5 Document SMTP settings: host, port, encryption, credentials

- [ ] Task 3: CRM registration (AC: 4, 7)
  - [ ] 3.1 Insert each domain into `email_domains` table
  - [ ] 3.2 Store SMTP credentials encrypted
  - [ ] 3.3 Set initial daily_limit: 5 (warmup phase)
  - [ ] 3.4 Set warmup_phase: true
  - [ ] 3.5 Set reputation_score: 100.0

- [ ] Task 4: Deliverability testing (AC: 5, 9, 10)
  - [ ] 4.1 Send test email to Gmail account - verify inbox delivery
  - [ ] 4.2 Send test email to Outlook account - verify inbox delivery
  - [ ] 4.3 Send test email to Yahoo account - verify inbox delivery
  - [ ] 4.4 Check spam score using mail-tester.com or similar
  - [ ] 4.5 Configure reply-to header pointing to monitored inbox
  - [ ] 4.6 Add List-Unsubscribe header to email template

- [ ] Task 5: Warmup documentation (AC: 6)
  - [ ] 5.1 Document warmup schedule with daily limits per week
  - [ ] 5.2 Define warmup email strategy: send to known contacts first
  - [ ] 5.3 Plan daily_limit increases in CRM: 5 -> 15 -> 30 -> 50
  - [ ] 5.4 Set calendar reminders for limit increases

---

## Dev Notes

### SMTP Provider Comparison

| Provider | Cost | Pros | Cons |
|---|---|---|---|
| **Amazon SES** | $0.10/1000 | Cheapest, great reputation, high deliverability | Complex setup, sandboxed initially |
| **Resend** | Free 100/day | Simple API, quick setup, good docs | Limited free tier |
| **Brevo** | Free 300/day | N8N native node, generous free tier | Less control over delivery |

### DNS Records Template

```
SPF:   v=spf1 include:amazonses.com -all
DKIM:  [provider-generated key]
DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@leveron.com
MX:    10 inbound-smtp.[region].amazonaws.com
```

### Warmup Schedule

| Week | Daily Limit | Total/Week | Target |
|------|-------------|------------|--------|
| 1 | 5 | 35 | Known contacts, warm list |
| 2 | 15 | 105 | Mix of warm + cold |
| 3 | 30 | 210 | Mostly cold |
| 4+ | 50 | 350 | Full cold outbound |

### Security Notes

- SMTP passwords stored encrypted in `email_domains.smtp_pass_encrypted`
- N8N accesses credentials via environment variables or credential store
- Never commit SMTP credentials to code repository

### Dependencies

- **No dependencies** - Can start immediately in parallel with OB-LEV-1

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-4 | Created 2026-02-09*
