# Epic: Outbound Leveron - Escritorios de Advocacia (OB-LEV)

**Epic ID:** EPIC-OB-LEV
**Status:** Draft
**Priority:** High
**Target:** Sprint 1-6 (6 semanas)
**Effort Estimate:** 60-80 hours (across 10 stories)
**Source:** Outbound Strategy Plan v1.0 - Cenario C (Hibrido)

---

## Vision

Construir uma operacao completa de outbound sales para a Leveron, mirando escritorios de advocacia como ICP. A operacao roda 100% automatizada via N8N, com CRM no Supabase, cadencias de email frio e tracking de metricas em tempo real.

---

## Problem Statement

A Leveron precisa de um canal previsivel de geracao de demanda para vender servicos de desenvolvimento de software para escritorios de advocacia. Atualmente nao existe infraestrutura de prospeccao, CRM, nem automacao de outbound. Tudo precisa ser construido do zero.

**Resultado esperado:** Pipeline automatizado que gera reunioes com decisores de escritorios de advocacia a partir de email frio, com meta de 1% meeting rate sobre emails enviados.

---

## Stories

| Story | Title | Priority | Complexity | Executor | Quality Gate | Status |
|-------|-------|----------|------------|----------|--------------|--------|
| OB-LEV-1 | CRM Schema & Database Setup | Critical | Medium | @data-engineer | @architect | Draft |
| OB-LEV-2 | Lead Scraping Pipeline | High | High | @dev | @qa | Draft |
| OB-LEV-3 | Lead Enrichment Workflow | High | High | @dev | @qa | Draft |
| OB-LEV-4 | Email Infrastructure Setup | Critical | Medium | @devops | @architect | Draft |
| OB-LEV-5 | Email Cadence Engine | Critical | Very High | @dev | @architect | Draft |
| OB-LEV-6 | Email Tracking System | High | Medium | @dev | @qa | Draft |
| OB-LEV-7 | Reply & Bounce Handler | High | Medium | @dev | @qa | Draft |
| OB-LEV-8 | Lead Scoring System | Medium | Medium | @dev | @qa | Draft |
| OB-LEV-9 | A/B Testing Engine | Medium | Medium | @dev | @qa | Draft |
| OB-LEV-10 | Dashboard & Weekly Reporting | Medium | Medium | @dev | @qa | Draft |

### Story Files

| Story | File |
|-------|------|
| OB-LEV-1 | [story-ob-lev-1-crm-schema.md](story-ob-lev-1-crm-schema.md) |
| OB-LEV-2 | [story-ob-lev-2-lead-scraping.md](story-ob-lev-2-lead-scraping.md) |
| OB-LEV-3 | [story-ob-lev-3-lead-enrichment.md](story-ob-lev-3-lead-enrichment.md) |
| OB-LEV-4 | [story-ob-lev-4-email-infrastructure.md](story-ob-lev-4-email-infrastructure.md) |
| OB-LEV-5 | [story-ob-lev-5-email-cadence-engine.md](story-ob-lev-5-email-cadence-engine.md) |
| OB-LEV-6 | [story-ob-lev-6-email-tracking.md](story-ob-lev-6-email-tracking.md) |
| OB-LEV-7 | [story-ob-lev-7-reply-bounce-handler.md](story-ob-lev-7-reply-bounce-handler.md) |
| OB-LEV-8 | [story-ob-lev-8-lead-scoring.md](story-ob-lev-8-lead-scoring.md) |
| OB-LEV-9 | [story-ob-lev-9-ab-testing.md](story-ob-lev-9-ab-testing.md) |
| OB-LEV-10 | [story-ob-lev-10-dashboard-reporting.md](story-ob-lev-10-dashboard-reporting.md) |

---

## Implementation Waves

### Wave 1: Foundation (OB-LEV-1, OB-LEV-4) - PARALLEL, no dependencies

| Story | Branch | Complexity |
|-------|--------|------------|
| **OB-LEV-1**: CRM Schema & Database | `feat/ob-lev-1-crm-schema` | Medium |
| **OB-LEV-4**: Email Infrastructure | `feat/ob-lev-4-email-infra` | Medium |

### Gate 1: Infrastructure Validation

CRM operacional no Supabase. Dominios de email configurados com SPF/DKIM/DMARC.

### Wave 2: Data Pipeline (OB-LEV-2, OB-LEV-3) - SEQUENTIAL

| Story | Branch | Complexity | Depends on |
|-------|--------|------------|------------|
| **OB-LEV-2**: Lead Scraping | `feat/ob-lev-2-lead-scraping` | High | OB-LEV-1 |
| **OB-LEV-3**: Lead Enrichment | `feat/ob-lev-3-lead-enrichment` | High | OB-LEV-1, OB-LEV-2 |

### Gate 2: Data Validation

50+ leads qualificados no CRM com email validado.

### Wave 3: Core Engine (OB-LEV-5) - SEQUENTIAL, depends on Wave 1 + 2

| Story | Branch | Complexity | Depends on |
|-------|--------|------------|------------|
| **OB-LEV-5**: Email Cadence Engine | `feat/ob-lev-5-cadence-engine` | Very High | OB-LEV-1, OB-LEV-3, OB-LEV-4 |

### Gate 3: Cadence Validation

Cadencia de 4 emails envia corretamente com delays programados.

### Wave 4: Intelligence (OB-LEV-6, OB-LEV-7, OB-LEV-8, OB-LEV-9) - PARALLEL

| Story | Branch | Complexity | Depends on |
|-------|--------|------------|------------|
| **OB-LEV-6**: Email Tracking | `feat/ob-lev-6-email-tracking` | Medium | OB-LEV-5 |
| **OB-LEV-7**: Reply & Bounce Handler | `feat/ob-lev-7-reply-bounce` | Medium | OB-LEV-5 |
| **OB-LEV-8**: Lead Scoring | `feat/ob-lev-8-lead-scoring` | Medium | OB-LEV-1, OB-LEV-6 |
| **OB-LEV-9**: A/B Testing | `feat/ob-lev-9-ab-testing` | Medium | OB-LEV-5 |

### Gate 4: Intelligence Validation

Tracking registra aberturas. Replies pausam cadencia. Scoring calcula corretamente. A/B distribui variantes.

### Wave 5: Visibility (OB-LEV-10) - SEQUENTIAL, depends on Wave 4

| Story | Branch | Complexity | Depends on |
|-------|--------|------------|------------|
| **OB-LEV-10**: Dashboard & Reporting | `feat/ob-lev-10-dashboard` | Medium | All |

### Final Gate: Epic Validation

Operacao completa rodando: scraping → enriquecimento → cadencia → tracking → scoring → reporting.

---

## Dependency Graph

```
Wave 1 (Parallel - Foundation)
  OB-LEV-1 (CRM) ──────┐
  OB-LEV-4 (Email Infra)┼──→ [GATE 1]
                         │
Wave 2 (Sequential - Data)
  OB-LEV-2 (Scraping) ──┤
  OB-LEV-3 (Enrichment) ┼──→ [GATE 2]
                         │
Wave 3 (Sequential - Core)
  OB-LEV-5 (Cadence) ───┼──→ [GATE 3]
                         │
Wave 4 (Parallel - Intelligence)
  OB-LEV-6 (Tracking) ──┤
  OB-LEV-7 (Reply/Bounce)┤
  OB-LEV-8 (Scoring) ───┤
  OB-LEV-9 (A/B Test) ──┼──→ [GATE 4]
                         │
Wave 5 (Visibility)
  OB-LEV-10 (Dashboard) ─→ [FINAL GATE]
```

---

## Key Technologies

| Technology | Purpose |
|------------|---------|
| **Supabase** | CRM database (PostgreSQL), real-time, edge functions |
| **N8N** | Workflow automation (cadences, enrichment, tracking) |
| **Exa MCP** | Web search, LinkedIn search, company research |
| **Browser MCP** | Web scraping (Google Maps, sites) |
| **SMTP / Amazon SES** | Email sending |
| **NeverBounce / ZeroBounce** | Email validation |
| **Hunter.io / Snov.io** | Email finding |

---

## ICP: Escritorios de Advocacia

| Atributo | Detalhe |
|---|---|
| **Segmento** | Escritorios de advocacia (pequeno/medio porte) |
| **Tamanho** | 5-50 advogados |
| **Dor** | Processos manuais, falta de sistemas, gestao ineficiente |
| **Decisor** | Socio-diretor / Socio-administrativo |
| **Budget** | R$ 5k-30k/mes em tecnologia |
| **Canais** | Email corporativo, LinkedIn |

---

## KPIs

| Metrica | Meta |
|---|---|
| Emails enviados/dia | 50-100 |
| Open Rate | > 40% |
| Reply Rate | > 5% |
| Positive Reply Rate | > 2% |
| Bounce Rate | < 3% |
| Meeting Rate | > 1% |
| Custo por lead qualificado | < R$5 |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dominios bloqueados por spam | High | Warmup gradual, multiplos dominios |
| Lista de baixa qualidade | High | Validacao antes de enviar |
| Baixo reply rate | Medium | A/B testing continuo |
| N8N instabilidade | Medium | Retry automatico, logs |
| LGPD compliance | High | Opt-out em todo email |

---

## Cross-References

| Related | Relationship |
|---------|-------------|
| [Outbound Strategy Plan](../../outbound/OUTBOUND-STRATEGY-PLAN.md) | Source document |
| EPIC-OB-KOSMOS (futuro) | Operacao Kosmos - infoprodutores |
| EPIC-OB-LEV-INFO (futuro) | Operacao Leveron - infoprodutores IA |

---

*Created 2026-02-09 by @po | Based on Outbound Strategy Plan v1.0 - Cenario C*
