# Story OB-LEV-8: Lead Scoring System

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** Draft
**Priority:** Medium
**Complexity:** Medium
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["logic-validation", "calculation-testing"]

---

## Story

**As a** outbound operations manager,
**I want** an automated lead scoring system that calculates and updates a score for each lead based on their interactions (opens, clicks, replies) and profile data (company size, role match),
**so that** I can prioritize the hottest leads for manual follow-up and optimize resource allocation.

---

## Acceptance Criteria

1. N8N workflow `WF-06-lead-scoring` created and functional
2. Triggered on every new interaction (email_opened, email_clicked, email_replied)
3. Score calculation based on weighted interaction points:
   - Email opened: +5 points
   - Email clicked: +15 points
   - Email replied: +30 points
   - Multiple opens (same email): +2 per additional open
   - Opened multiple different emails: +10 bonus
4. Profile score based on lead data:
   - Has company website: +5
   - Company size 'medium' or 'large': +10
   - Role is decision-maker (socio, diretor): +15
   - Has LinkedIn URL: +5
   - Source quality: linkedin (+10), google_maps (+5), oab_directory (+5)
5. Score decay: leads that haven't interacted in 14+ days lose 10% of score weekly
6. Lead score updated in leads.lead_score after each calculation
7. Hot lead threshold: when score exceeds 50, notification sent to sales team
8. Interaction record created: type='score_updated', metadata includes previous_score, new_score, reason
9. Score can be recalculated in batch (trigger: process all leads)
10. Score formula is configurable (stored in cadences or ICP settings, not hardcoded)

---

## Tasks / Subtasks

- [ ] Task 1: Create scoring workflow (AC: 1, 2)
  - [ ] 1.1 Create N8N workflow triggered by Supabase webhook on interactions insert
  - [ ] 1.2 Add batch trigger for recalculating all leads
  - [ ] 1.3 Fetch lead data and all their interactions

- [ ] Task 2: Interaction scoring logic (AC: 3)
  - [ ] 2.1 Count interactions by type for the lead
  - [ ] 2.2 Apply weights: opened=5, clicked=15, replied=30
  - [ ] 2.3 Apply bonuses: multi-open=2, multi-email=10
  - [ ] 2.4 Calculate total interaction score

- [ ] Task 3: Profile scoring logic (AC: 4)
  - [ ] 3.1 Check lead fields: website, company_size, role, linkedin_url, source
  - [ ] 3.2 Apply profile weights per criteria
  - [ ] 3.3 Calculate total profile score

- [ ] Task 4: Score decay (AC: 5)
  - [ ] 4.1 Check last_contacted_at and last interaction date
  - [ ] 4.2 If 14+ days since last interaction: apply 10% weekly decay
  - [ ] 4.3 Decay runs on weekly cron (Sunday night)
  - [ ] 4.4 Minimum score after decay: 0

- [ ] Task 5: Score update and notifications (AC: 6, 7, 8)
  - [ ] 5.1 Calculate final_score = interaction_score + profile_score - decay
  - [ ] 5.2 Update leads.lead_score
  - [ ] 5.3 Create interaction: type='score_updated', metadata={previous, new, reason}
  - [ ] 5.4 If score crosses 50 threshold: send notification
  - [ ] 5.5 Notification includes: lead name, company, score, top interactions

- [ ] Task 6: Configuration (AC: 10)
  - [ ] 6.1 Store scoring weights in ICP criteria JSONB or separate config
  - [ ] 6.2 Allow per-ICP scoring adjustments
  - [ ] 6.3 Document default scoring formula

---

## Dev Notes

### Default Scoring Formula

```
INTERACTION SCORE:
  email_opened (unique per step)  = +5 each
  email_clicked (unique per step) = +15 each
  email_replied                   = +30 each
  multi_open_bonus (>1 open same) = +2 per additional
  multi_email_bonus (opened 2+)   = +10 flat

PROFILE SCORE:
  has_website     = +5
  company_medium+ = +10
  role_decisor    = +15
  has_linkedin    = +5
  source_linkedin = +10
  source_maps/oab = +5

DECAY:
  No interaction 14+ days = -10%/week

TOTAL = interaction_score + profile_score - decay
```

### Hot Lead Thresholds

| Score | Classification | Action |
|---|---|---|
| 0-20 | Cold | Continue cadence |
| 21-49 | Warm | Monitor |
| 50+ | Hot | Notify sales team |
| 80+ | Very Hot | Immediate manual outreach |

### Dependencies

- **Requires:** OB-LEV-1 (CRM), OB-LEV-6 (tracking generates interactions for scoring)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-8 | Created 2026-02-09*
