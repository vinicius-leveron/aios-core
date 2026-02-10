# Story OB-LEV-6: Email Tracking System

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** In Progress
**Priority:** High
**Complexity:** Medium
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["integration-testing", "privacy-review"]

---

## Story

**As a** outbound operations manager,
**I want** to track email opens and link clicks in real-time, updating lead records and interaction history in the CRM,
**so that** I know which leads are engaging and can prioritize follow-ups on warm leads.

---

## Acceptance Criteria

1. N8N workflow `WF-04-email-tracking` created and functional
2. Open tracking: invisible 1x1 pixel embedded in HTML emails, served via Supabase Edge Function or N8N webhook
3. When pixel is loaded, interaction record created: type='email_opened', metadata includes email_step, timestamp, user_agent
4. Click tracking: all links in email body are wrapped with redirect URL that logs the click before redirecting to original destination
5. When redirect is triggered, interaction record created: type='email_clicked', metadata includes original_url, email_step
6. Lead record updated on open: emails_opened++
7. Lead record updated on click: emails_clicked++
8. Deduplication: multiple opens/clicks from same lead for same email step count as 1 unique open/click (but all are logged in interactions)
9. Tracking pixel URL is unique per lead per email step (encodes lead_id + step_number)
10. Tracking does not break email rendering in Gmail, Outlook, Apple Mail
11. Privacy: tracking pixel must be small (<100 bytes), served with correct Content-Type header

---

## Tasks / Subtasks

- [ ] Task 1: Open tracking endpoint (AC: 2, 3, 9, 11)
  - [ ] 1.1 Create Supabase Edge Function OR N8N webhook: GET /track/open/:tracking_id
  - [ ] 1.2 Decode tracking_id to extract lead_id and step_number
  - [ ] 1.3 Insert interaction record: type='email_opened'
  - [ ] 1.4 Return 1x1 transparent GIF with Content-Type: image/gif
  - [ ] 1.5 Handle errors gracefully (invalid tracking_id still returns pixel)

- [ ] Task 2: Click tracking endpoint (AC: 4, 5)
  - [ ] 2.1 Create endpoint: GET /track/click/:tracking_id?url=:encoded_url
  - [ ] 2.2 Decode tracking_id and original URL
  - [ ] 2.3 Insert interaction record: type='email_clicked', metadata={original_url}
  - [ ] 2.4 Redirect (302) to original URL
  - [ ] 2.5 Handle invalid URLs gracefully (redirect to company website)

- [ ] Task 3: Email template integration (AC: 10)
  - [ ] 3.1 Modify email cadence engine (WF-03) to inject tracking pixel before </body>
  - [ ] 3.2 Modify email cadence engine to wrap all links with click tracking redirect
  - [ ] 3.3 Generate unique tracking_id per lead per step: base64(lead_id:step:timestamp)
  - [ ] 3.4 Test rendering in Gmail web, Outlook web, Apple Mail

- [ ] Task 4: CRM updates and deduplication (AC: 6, 7, 8)
  - [ ] 4.1 On first open per lead+step: increment leads.emails_opened
  - [ ] 4.2 On first click per lead+step: increment leads.emails_clicked
  - [ ] 4.3 All interactions logged regardless (for analytics), but counter only increments on first
  - [ ] 4.4 Use Supabase upsert or check-before-increment pattern

---

## Dev Notes

### Tracking ID Format

```
tracking_id = base64url(lead_id + ":" + step_number + ":" + salt)
```

Salt prevents ID guessing. Decode on server side.

### Tracking Pixel HTML

```html
<img src="https://track.leveron-tech.com/track/open/[tracking_id]" width="1" height="1" style="display:none" alt="" />
```

### Link Wrapping

```
Original: https://leveron.com/caso-escritorio
Wrapped:  https://track.leveron-tech.com/track/click/[tracking_id]?url=https%3A%2F%2Fleveron.com%2Fcaso-escritorio
```

### Email Client Compatibility

- Gmail: may proxy images (shows as opened from Google IP)
- Outlook: may block images by default (open not tracked until user loads images)
- Apple Mail: iOS 15+ Privacy Protection may preload pixels (false opens)
- Mitigation: combine open tracking with click tracking for more accurate engagement signal

### Dependencies

- **Requires:** OB-LEV-5 (cadence engine must embed tracking in emails)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-6 | Created 2026-02-09*
