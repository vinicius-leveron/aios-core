# Story OB-LEV-9: A/B Testing Engine

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** In Progress
**Priority:** Medium
**Complexity:** Medium
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["statistical-validation", "workflow-testing"]

---

## Story

**As a** outbound operations manager,
**I want** to run A/B tests on email subject lines and body copy, splitting leads evenly between variants and measuring open rate and reply rate per variant,
**so that** I can continuously optimize messaging and improve conversion rates based on data.

---

## Acceptance Criteria

1. N8N workflow `WF-10-ab-tester` created and functional
2. Experiments can be created with: name, ICP, variant_a (subject + body), variant_b (subject + body)
3. When a lead enters a cadence with an active experiment, they are randomly assigned to variant A or B (50/50 split)
4. Assignment is persistent: once assigned, the lead always receives the same variant for all cadence steps in that experiment
5. Variant assignment stored in lead custom_fields: { experiment_id, variant }
6. Cadence engine (WF-03) checks for active experiment and sends the correct variant template
7. Experiment results tracked: opens, clicks, replies per variant
8. Results view: open_rate_a, open_rate_b, reply_rate_a, reply_rate_b, sample_size_a, sample_size_b
9. Statistical significance indicator: when sample size > 50 per variant, calculate if difference is significant (p < 0.05)
10. Experiment can be concluded manually: set winner, deactivate losing variant
11. When experiment concludes, all new leads automatically get the winning variant

---

## Tasks / Subtasks

- [ ] Task 1: Experiment management (AC: 1, 2)
  - [ ] 1.1 Create N8N workflow for experiment CRUD operations
  - [ ] 1.2 Create experiment endpoint: POST with name, icp_id, variant_a, variant_b
  - [ ] 1.3 Store in `experiments` table with status='running'
  - [ ] 1.4 Create corresponding message_templates for each variant (version='A' and version='B')

- [ ] Task 2: Variant assignment (AC: 3, 4, 5)
  - [ ] 2.1 When lead enters cadence, check for active experiment for their ICP
  - [ ] 2.2 If active experiment: randomly assign A or B (50/50)
  - [ ] 2.3 Store assignment in lead custom_fields: {experiment_id, variant}
  - [ ] 2.4 Assignment is immutable for the duration of the experiment
  - [ ] 2.5 Ensure even distribution: alternate rather than pure random if needed

- [ ] Task 3: Cadence engine integration (AC: 6)
  - [ ] 3.1 Modify WF-03 to check lead's experiment assignment before sending
  - [ ] 3.2 If assigned to experiment: fetch template matching variant (A or B)
  - [ ] 3.3 If no experiment: use default template
  - [ ] 3.4 Log variant used in interaction metadata

- [ ] Task 4: Results tracking and analysis (AC: 7, 8, 9)
  - [ ] 4.1 Create Supabase view or query: experiment results aggregated by variant
  - [ ] 4.2 Metrics per variant: total_sent, total_opened, total_clicked, total_replied
  - [ ] 4.3 Calculate rates: open_rate, click_rate, reply_rate per variant
  - [ ] 4.4 Implement basic statistical significance: z-test for proportions
  - [ ] 4.5 Mark significant difference when p < 0.05 and sample_size > 50 per variant

- [ ] Task 5: Experiment conclusion (AC: 10, 11)
  - [ ] 5.1 Endpoint to conclude experiment: set winner, status='concluded'
  - [ ] 5.2 Store final results in experiments.results JSONB
  - [ ] 5.3 After conclusion: deactivate losing variant templates
  - [ ] 5.4 New leads entering cadence automatically get winning variant

---

## Dev Notes

### Statistical Significance

Z-test for difference in proportions:
```
z = (p1 - p2) / sqrt(p_hat * (1 - p_hat) * (1/n1 + 1/n2))
where p_hat = (x1 + x2) / (n1 + n2)

Significant if |z| > 1.96 (p < 0.05)
```

Minimum sample size recommendation: 50 per variant for reply rate, 100 for open rate.

### Experiment Results Schema

```json
{
  "variant_a": {
    "sent": 100,
    "opened": 45,
    "clicked": 12,
    "replied": 6,
    "open_rate": 0.45,
    "reply_rate": 0.06
  },
  "variant_b": {
    "sent": 100,
    "opened": 38,
    "clicked": 8,
    "replied": 3,
    "open_rate": 0.38,
    "reply_rate": 0.03
  },
  "significant": true,
  "p_value": 0.032,
  "winner": "A"
}
```

### What to A/B Test First

1. **Subject line** (highest impact on open rate)
2. **First line of email** (impacts reply rate)
3. **CTA style** (question vs. statement)
4. **Email length** (short vs. detailed)

### Dependencies

- **Requires:** OB-LEV-5 (cadence engine to integrate with)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-9 | Created 2026-02-09*
