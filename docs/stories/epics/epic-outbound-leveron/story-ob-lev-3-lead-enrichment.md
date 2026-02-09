# Story OB-LEV-3: Lead Enrichment Workflow

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** Draft
**Priority:** High
**Complexity:** High
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["data-validation", "workflow-testing"]

---

## Story

**As a** outbound operations manager,
**I want** an automated enrichment workflow that finds and validates corporate emails for each lead, and enriches company data (size, website tech, digital presence),
**so that** only leads with verified emails enter the cadence, reducing bounce rate below 3%.

---

## Acceptance Criteria

1. N8N workflow `WF-02-email-enrichment` created and functional
2. Triggered automatically when new lead is inserted in CRM with status 'new'
3. Email finding: attempts to find corporate email using at least 2 methods (pattern generation + API lookup)
4. Email pattern generation: tries common patterns (nome@dominio, nome.sobrenome@dominio, etc) based on company website domain
5. Email validation: every found email is validated via email verification API (NeverBounce, ZeroBounce, or similar)
6. Only emails with 'valid' or 'catch-all' status are saved; 'invalid' and 'disposable' are discarded
7. Lead status updated: 'new' -> 'enriched' (if email found and valid) or 'unqualified' (if no valid email after all attempts)
8. Company enrichment: website technology detection (has website? uses which CMS?), company size estimate, social media presence (Instagram, LinkedIn)
9. Enrichment metadata stored in leads.custom_fields JSONB: { email_source, email_validation_status, website_tech, has_instagram, has_linkedin, enriched_at }
10. leads.email_validated set to true only for verified emails
11. Processing rate: handles up to 100 leads per hour without hitting API rate limits
12. Error handling: API failures retry 3x with exponential backoff; persistent failures logged and lead flagged for manual review

---

## Tasks / Subtasks

- [ ] Task 1: Create N8N workflow WF-02-email-enrichment (AC: 1, 2)
  - [ ] 1.1 Create workflow triggered by Supabase webhook (new lead insert)
  - [ ] 1.2 Add manual trigger for batch processing existing leads
  - [ ] 1.3 Add input validation: skip leads that already have validated email

- [ ] Task 2: Email finding module (AC: 3, 4)
  - [ ] 2.1 Extract domain from lead's company_website
  - [ ] 2.2 Generate email patterns: first@domain, first.last@domain, flast@domain, firstl@domain
  - [ ] 2.3 Integrate Hunter.io or Snov.io API for email lookup by company domain
  - [ ] 2.4 If API returns results, use API email; otherwise try pattern-based approach
  - [ ] 2.5 Store email_source in custom_fields: 'hunter_api', 'snov_api', 'pattern_generated'

- [ ] Task 3: Email validation module (AC: 5, 6, 10)
  - [ ] 3.1 Integrate email verification API (NeverBounce or ZeroBounce)
  - [ ] 3.2 Send found email for validation
  - [ ] 3.3 Accept: 'valid', 'catch-all' (with flag)
  - [ ] 3.4 Reject: 'invalid', 'disposable', 'unknown'
  - [ ] 3.5 Set leads.email_validated = true for accepted emails
  - [ ] 3.6 Store validation result in custom_fields.email_validation_status

- [ ] Task 4: Company enrichment module (AC: 8, 9)
  - [ ] 4.1 Check if company website is accessible (HTTP HEAD request)
  - [ ] 4.2 Detect basic tech: WordPress, Wix, custom, etc (via HTML meta tags)
  - [ ] 4.3 Search for company Instagram: Exa search "[company name] instagram"
  - [ ] 4.4 Search for company LinkedIn page: Exa search "[company name] linkedin"
  - [ ] 4.5 Estimate company size: use number of partners from OAB data or LinkedIn employees
  - [ ] 4.6 Store all enrichment data in leads.custom_fields

- [ ] Task 5: Status management and error handling (AC: 7, 11, 12)
  - [ ] 5.1 Update lead status: 'new' -> 'enriched' or 'unqualified'
  - [ ] 5.2 Implement retry logic: 3 attempts with 2s, 4s, 8s backoff
  - [ ] 5.3 Flag persistent failures: set custom_fields.enrichment_error = error message
  - [ ] 5.4 Add rate limiting: process max 100 leads/hour
  - [ ] 5.5 Log enrichment summary: total processed, emails found, emails validated, failures

---

## Dev Notes

### Email Pattern Strategy

For Brazilian law firms, common email patterns:
- `nome@escritorio.adv.br`
- `nome@escritorio.com.br`
- `nome.sobrenome@escritorio.adv.br`
- `contato@escritorio.adv.br` (generic)

Many smaller firms use generic emails (contato@, juridico@). Strategy:
1. Try to find personal email via API first
2. Fall back to pattern generation
3. If only generic found, still use it but flag in custom_fields

### Email Verification APIs

| Service | Free Tier | Cost | Integration |
|---|---|---|---|
| NeverBounce | 1000 free | $0.008/email | HTTP API |
| ZeroBounce | 100 free | $0.008/email | HTTP API |
| Hunter.io | 25 free/month | $49/1000 | HTTP API |

### Dependencies

- **Requires:** OB-LEV-1 (CRM tables), OB-LEV-2 (leads must exist in CRM)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-3 | Created 2026-02-09*
