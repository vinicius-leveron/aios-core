# Story OB-LEV-2: Lead Scraping Pipeline

**Epic:** [EPIC-OB-LEV - Outbound Leveron: Escritorios de Advocacia](EPIC-OB-LEV-INDEX.md)
**Status:** In Progress
**Priority:** High
**Complexity:** High
**Created:** 2026-02-09

---

## Executor Assignment

executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["data-validation", "compliance-review"]

---

## Story

**As a** outbound operations manager,
**I want** an automated pipeline that scrapes law firm data from Google Maps, OAB directories and LinkedIn,
**so that** I have a qualified list of 50+ leads with company name, address, phone, website, and decision-maker info ready for enrichment.

---

## Acceptance Criteria

1. N8N workflow `WF-01-lead-ingestion` created and functional
2. Google Maps scraping: extracts law firms by region with name, address, phone, website, rating
3. OAB directory scraping: extracts registered law firms with OAB number, partners, specialization
4. LinkedIn scraping (via Exa MCP): finds decision-makers (socios) at identified firms
5. Data deduplication: same firm from multiple sources is merged (match by name + city)
6. Data validation: records with no company name or no contact info are flagged as incomplete
7. All scraped leads are inserted into `leads` table in Supabase CRM with source field populated
8. Webhook endpoint available for manual trigger (upload CSV or trigger scraping by region)
9. First batch: minimum 50 validated leads from escritorios de advocacia
10. Scraping respects rate limits: max 1 request/second for Google Maps, 2 seconds between LinkedIn queries
11. Logs: every scraping run logs total found, duplicates removed, valid leads inserted, errors

---

## Tasks / Subtasks

- [ ] Task 1: Create N8N workflow WF-01-lead-ingestion (AC: 1, 8)
  - [ ] 1.1 Create workflow with webhook trigger (POST /webhook/lead-ingestion)
  - [ ] 1.2 Add manual trigger option (for testing)
  - [ ] 1.3 Add input validation node (accepts: region, source_type, csv_file)
  - [ ] 1.4 Route to appropriate scraping branch based on source_type

- [ ] Task 2: Google Maps scraping module (AC: 2, 10)
  - [ ] 2.1 Use Browser MCP or N8N HTTP node to query Google Maps for "escritorio de advocacia em [regiao]"
  - [ ] 2.2 Extract: name, address, phone, website, rating, number of reviews
  - [ ] 2.3 Implement rate limiting (1 req/sec)
  - [ ] 2.4 Handle pagination (multiple pages of results)
  - [ ] 2.5 Test with 3 regions: Sao Paulo, Rio de Janeiro, Belo Horizonte

- [ ] Task 3: OAB directory scraping module (AC: 3)
  - [ ] 3.1 Research OAB directory structure (state-level sites)
  - [ ] 3.2 Scrape OAB-SP as first target
  - [ ] 3.3 Extract: firm name, OAB number, partners list, address, specializations
  - [ ] 3.4 Map OAB data format to leads table schema

- [ ] Task 4: LinkedIn enrichment via Exa MCP (AC: 4)
  - [ ] 4.1 For each scraped firm, search Exa for "[firm name] socio advogado linkedin"
  - [ ] 4.2 Extract: decision-maker name, role, LinkedIn URL
  - [ ] 4.3 Implement rate limiting (2s between queries)
  - [ ] 4.4 Store LinkedIn URL in leads.linkedin_url

- [ ] Task 5: Deduplication and validation (AC: 5, 6)
  - [ ] 5.1 Implement dedup logic: match by normalized company_name + city
  - [ ] 5.2 Merge records: prefer record with more data fields filled
  - [ ] 5.3 Flag incomplete records (no company_name or no email+phone+website)
  - [ ] 5.4 Set lead status: 'new' for valid, 'incomplete' for flagged

- [ ] Task 6: Supabase insertion (AC: 7)
  - [ ] 6.1 Map scraped fields to leads table columns
  - [ ] 6.2 Set source field: 'google_maps', 'oab_directory', 'linkedin'
  - [ ] 6.3 Set icp_id to escritorios_advocacia ICP
  - [ ] 6.4 Handle insert errors (duplicate email, missing required fields)

- [ ] Task 7: Logging and first batch (AC: 9, 11)
  - [ ] 7.1 Add logging node: total_found, duplicates_removed, valid_inserted, errors
  - [ ] 7.2 Send summary to notification channel (email or webhook)
  - [ ] 7.3 Execute first batch: scrape 3 regions, target 50+ valid leads
  - [ ] 7.4 Validate first batch data quality manually

---

## Dev Notes

### Available MCP Tools

| Tool | Use |
|---|---|
| **Exa MCP** | `linkedin_search`, `web_search` for finding decision-makers |
| **Browser MCP** | Scraping dynamic pages (Google Maps, OAB sites) |
| **Supabase MCP** | Database operations |

### N8N Configuration

N8N MCP config at `.aios-core/infrastructure/tools/mcp/n8n.yaml`. Key nodes:
- HTTP Request node for API calls
- Code node for data transformation
- Supabase node for database operations
- IF node for routing logic

### Rate Limiting Strategy

- Google Maps: 1 request/second (risk of IP ban if too fast)
- Exa/LinkedIn: 2 seconds between queries
- Implement using N8N Wait node between iterations

### LGPD Considerations

- Only scrape publicly available business data
- Do not scrape personal data from non-business profiles
- All data must be deletable on request (opt-out)

### Dependencies

- **Requires:** OB-LEV-1 (CRM tables must exist before insertion)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-09 | 1.0 | Story created from EPIC-OB-LEV | @po |

---

*Epic OB-LEV - Story OB-LEV-2 | Created 2026-02-09*
