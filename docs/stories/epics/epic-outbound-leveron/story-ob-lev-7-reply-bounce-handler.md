# Story OB-LEV-7: Reply & Bounce Handler

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** Draft
**Priority:** High
**Complexity:** Medium
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["integration-testing", "workflow-validation"]

---

## Story

**As a** outbound operations manager,
**I want** automated detection of email replies and bounces, with replies pausing the lead's cadence and triggering a notification, and bounces removing the lead from the cadence and flagging the email as invalid,
**so that** I can respond quickly to interested leads and maintain list hygiene automatically.

---

## Acceptance Criteria

### Reply Handler (WF-05)
1. N8N workflow `WF-05-reply-handler` created and functional
2. Monitors reply-to inbox via IMAP or email webhook (checks every 5 minutes)
3. When reply detected, matches sender email to lead in CRM
4. Lead cadence is paused: cadence_paused = true
5. Lead status updated to 'replied'
6. Lead record updated: emails_replied++, last_replied_at = now()
7. Interaction record created: type='email_replied', metadata includes subject, snippet of reply body (first 200 chars)
8. Notification sent (email or webhook) to sales team with lead name, company, reply preview
9. Replies that are auto-replies (out of office, delivery notification) are detected and ignored (cadence NOT paused)

### Bounce Handler (WF-09)
10. N8N workflow `WF-09-bounce-handler` created and functional
11. Monitors bounce notifications via SMTP webhook or inbox parsing
12. Hard bounces: lead removed from cadence, email marked as invalid (email_validated = false), status = 'bounced'
13. Soft bounces: logged but cadence continues (retry on next step)
14. Interaction record created: type='email_bounced', metadata includes bounce_type (hard/soft), bounce_reason
15. Domain reputation tracking: if bounce rate > 5% in a day for a domain, domain.active set to false and alert sent
16. Daily bounce rate calculated and stored in email_domains.reputation_score adjustment

---

## Tasks / Subtasks

### Reply Handler
- [ ] Task 1: Create WF-05-reply-handler (AC: 1, 2)
  - [ ] 1.1 Create N8N workflow with IMAP trigger (check every 5 minutes)
  - [ ] 1.2 Configure IMAP connection to reply-to inbox
  - [ ] 1.3 Filter: only process emails that are replies (has In-Reply-To header)
  - [ ] 1.4 Add manual trigger for testing

- [ ] Task 2: Reply matching and processing (AC: 3, 4, 5, 6, 7)
  - [ ] 2.1 Extract sender email from reply
  - [ ] 2.2 Query CRM: find lead by email
  - [ ] 2.3 If lead found: set cadence_paused = true, status = 'replied'
  - [ ] 2.4 Update: emails_replied++, last_replied_at = now()
  - [ ] 2.5 Create interaction: type='email_replied', metadata={subject, snippet}
  - [ ] 2.6 If lead not found: log as unmatched reply

- [ ] Task 3: Auto-reply detection (AC: 9)
  - [ ] 3.1 Check for auto-reply indicators: X-Auto-Response-Suppress header, subject contains "Out of Office" / "Fora do escritorio" / "Automatica"
  - [ ] 3.2 Check for delivery notifications: "Delivery Status Notification" / "Undeliverable"
  - [ ] 3.3 If auto-reply: log interaction as type='auto_reply', do NOT pause cadence
  - [ ] 3.4 Maintain list of auto-reply patterns (configurable)

- [ ] Task 4: Notification (AC: 8)
  - [ ] 4.1 Send notification via email or webhook: lead name, company, reply subject, first 200 chars
  - [ ] 4.2 Include link to lead in CRM (if dashboard exists) or lead_id for reference
  - [ ] 4.3 Notification should be near-real-time (within 5 minutes of reply)

### Bounce Handler
- [ ] Task 5: Create WF-09-bounce-handler (AC: 10, 11)
  - [ ] 5.1 Create N8N workflow triggered by SMTP bounce webhook or inbox parsing
  - [ ] 5.2 Parse bounce notification to extract: bounced email, bounce type, reason
  - [ ] 5.3 Distinguish hard bounce (permanent: invalid address, domain doesn't exist) vs soft bounce (temporary: mailbox full, server unavailable)

- [ ] Task 6: Bounce processing (AC: 12, 13, 14)
  - [ ] 6.1 Hard bounce: set lead status='bounced', email_validated=false, cadence_paused=true
  - [ ] 6.2 Soft bounce: log interaction, keep cadence running
  - [ ] 6.3 Create interaction: type='email_bounced', metadata={bounce_type, reason}
  - [ ] 6.4 If same lead soft-bounces 3 times: treat as hard bounce

- [ ] Task 7: Domain health monitoring (AC: 15, 16)
  - [ ] 7.1 After each bounce, calculate today's bounce rate per domain
  - [ ] 7.2 Formula: bounces_today / sent_today * 100
  - [ ] 7.3 If rate > 5%: set domain.active = false, send alert
  - [ ] 7.4 Adjust reputation_score: -5 per hard bounce, -1 per soft bounce (min 0)
  - [ ] 7.5 Alert includes: domain, bounce rate, total bounces, recommendation

---

## Dev Notes

### Auto-Reply Detection Patterns

```javascript
const AUTO_REPLY_PATTERNS = [
  /out of office/i,
  /fora do escrit[oó]rio/i,
  /resposta autom[aá]tica/i,
  /automatic reply/i,
  /delivery (status )?notification/i,
  /undeliverable/i,
  /mail delivery (system|subsystem)/i,
  /nao entregue/i
]
```

### Bounce Types

| Type | Examples | Action |
|---|---|---|
| Hard bounce | "User unknown", "Domain not found", "Mailbox disabled" | Remove from cadence |
| Soft bounce | "Mailbox full", "Server unavailable", "Try again later" | Retry next step |
| Auto-reply | "Out of office", "Resposta automatica" | Ignore (continue cadence) |

### IMAP Configuration

- Check every 5 minutes
- Move processed emails to "Processed" folder
- Keep unmatched replies in "Unmatched" folder for manual review

### Dependencies

- **Requires:** OB-LEV-5 (cadence must be sending emails to generate replies/bounces)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-7 | Created 2026-02-09*
