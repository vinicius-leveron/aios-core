# Outbound Strategy Plan - Leveron & Cosmos

> **Status:** PLANEJAMENTO
> **Data:** 2026-02-09
> **Objetivo:** Estruturar operação de outbound para Leveron (tecnologia) e Cosmos (comunidade), usando N8N como motor de automação e Supabase como CRM.

---

## 1. Visão Geral

### 1.1 Empresas

| | Leveron | Cosmos |
|---|---|---|
| **Foco** | Tecnologia - desenvolvimento de software, desenvolvimento sob medida | Comunidade de desenvolvedores, estrutura de comunidade |
| **Posicionamento** | Braço de tecnologia da Cosmos | Hub de comunidade e educação |
| **Relação** | Leveron como integrador técnico | Cosmos como marca guarda-chuva |

### 1.2 Decisão: Começar pela Leveron

**Recomendação:** Iniciar pela **Leveron** primeiro.

**Motivos:**
- ICP mais definido (empresas que precisam de software/tecnologia)
- Ciclo de venda mais direto (problema -> solução técnica)
- Perfil do Balão Nicolas na academia da tecnologia já tem autoridade construída
- Mais fácil de medir ROI (contrato fechado vs. membro de comunidade)
- Cosmos se beneficia depois dos aprendizados e da lista construída

---

## 2. ICPs (Ideal Customer Profiles)

### 2.1 Leveron - ICP Primário: Escritórios de Advocacia

| Atributo | Detalhe |
|---|---|
| **Segmento** | Escritórios de advocacia (pequeno/médio porte) |
| **Dor principal** | Processos manuais, falta de sistemas, gestão ineficiente |
| **Tamanho** | 5-50 advogados |
| **Decisor** | Sócio-diretor / Sócio-administrativo |
| **Budget** | R$ 5k-30k/mês em tecnologia |
| **Sinais de compra** | Procurando software jurídico, postando sobre produtividade, contrataram estagiários de TI |
| **Canais onde está** | LinkedIn, email corporativo, Instagram (consumo passivo) |

### 2.2 Leveron - ICP Secundário: PMEs que precisam de software

| Atributo | Detalhe |
|---|---|
| **Segmento** | Empresas 10-100 funcionários sem time de tech |
| **Dor principal** | Dependência de planilhas, processos desconectados |
| **Decisor** | CEO / Diretor de operações |
| **Budget** | R$ 3k-20k/mês |
| **Canais onde está** | LinkedIn, email, Instagram |

### 2.3 Cosmos - ICP (Fase 2)

| Atributo | Detalhe |
|---|---|
| **Segmento** | Desenvolvedores em início/transição de carreira |
| **Dor principal** | Falta de direcionamento, networking, oportunidades |
| **Decisor** | O próprio desenvolvedor |
| **Canais onde está** | Instagram, YouTube, Discord, GitHub |

> **Nota:** Testar múltiplos ICPs simultaneamente é viável com N8N. Cada ICP roda como uma cadência separada com mensagens personalizadas.

---

## 3. Canais de Outbound

### 3.1 Stack de Canais (Prioridade)

```
PRIORIDADE 1 (Começar aqui)
├── Email frio (cold email)
│   ├── Custo: Baixo (~R$50-100/mês por domínio)
│   ├── Escalabilidade: Alta
│   ├── Ferramenta: Custom SMTP + N8N
│   └── Volume: 50-100 emails/dia por domínio
│
└── LinkedIn (conexão + mensagem)
    ├── Custo: Gratuito (orgânico) ou ~R$100/mês (ferramentas)
    ├── Escalabilidade: Média
    └── Volume: 20-30 conexões/dia

PRIORIDADE 2 (Adicionar após validar P1)
├── WhatsApp (follow-up de leads quentes)
│   ├── Custo: API Business ~R$100-300/mês
│   ├── Uso: Apenas leads que responderam email/LinkedIn
│   └── Ferramenta: N8N + WhatsApp Business API (Evolution API ou Z-API)
│
└── Instagram DM (Leveron - perfil do Balão Nicolas)
    ├── Custo: Gratuito (manual) ou ferramenta de automação
    ├── Complexidade: Alta (risco de ban)
    └── Uso: Nurturing, não prospecção fria

PRIORIDADE 3 (Suporte)
└── Landing Page
    ├── Página de captura para cada ICP
    ├── Usada como destino de emails e anúncios futuros
    └── Ferramenta: Qualquer builder ou custom page
```

### 3.2 Por que Email Primeiro?

1. **Menor custo** por lead contactado
2. **Maior volume** possível por dia
3. **Mais fácil de automatizar** com N8N
4. **Mensurável** (open rate, reply rate, bounce rate)
5. **Não depende de perfil social** nem risco de ban
6. **Escritórios de advocacia usam email** como canal principal

---

## 4. Fontes de Leads (Scraping & Listas)

### 4.1 Fontes Disponíveis

| Fonte | Método | ICP | Qualidade |
|---|---|---|---|
| **Perfil Balão Nicolas** (academia da tecnologia) | Scraping de seguidores/engajadores | Cosmos (devs) | Alta |
| **LinkedIn** | Exa MCP (linkedin_search) + scraping manual | Leveron (escritórios) | Alta |
| **Google Maps** | Scraping de escritórios de advocacia por região | Leveron | Média-Alta |
| **Sites da OAB** | Lista pública de escritórios | Leveron | Média |
| **Instagram** | Scraping de seguidores de perfis jurídicos | Leveron | Média |
| **Bases públicas** | CNPJ (Receita Federal), quadro de sócios | Leveron | Média |

### 4.2 Pipeline de Enriquecimento

```
Fonte bruta (nome, empresa)
    │
    ▼
Enriquecimento Nível 1 (N8N workflow)
    ├── Buscar email corporativo (Hunter.io / Snov.io / manual)
    ├── Validar email (NeverBounce / ZeroBounce)
    ├── Buscar LinkedIn do decisor
    └── Buscar site da empresa
    │
    ▼
Enriquecimento Nível 2
    ├── Tamanho da empresa (funcionários)
    ├── Tecnologias que usa (BuiltWith)
    ├── Presença digital (tem site? Instagram?)
    └── Score de qualificação
    │
    ▼
Lead qualificado → CRM (Supabase)
```

### 4.3 Ferramentas MCP Disponíveis para Scraping

| Ferramenta | Uso |
|---|---|
| **Exa MCP** | Pesquisa web semântica, busca LinkedIn, pesquisa de empresas |
| **Browser MCP** | Scraping de sites dinâmicos, extração de dados de páginas |
| **Google Workspace MCP** | Armazenar listas em Sheets, gerenciar emails |

---

## 5. Cadências de Outbound

### 5.1 Cadência Email Frio - Leveron (Escritórios de Advocacia)

```
Dia 0: Email 1 - Abertura
        Assunto: "{{nome_escritório}} - pergunta rápida sobre gestão"
        Conteúdo: Identificar dor + pergunta aberta

Dia 3: Email 2 - Follow-up com valor
        Assunto: RE: (mesmo thread)
        Conteúdo: Case de resultado ou dado relevante

Dia 7: Email 3 - Prova social
        Assunto: RE: (mesmo thread)
        Conteúdo: Resultado de outro escritório similar

Dia 12: Email 4 - Breakup
        Assunto: "Devo parar de escrever?"
        Conteúdo: Último contato, tom casual
```

**Regras:**
- Se respondeu → sai da cadência, entra em conversação manual
- Se abriu mas não respondeu → continua na cadência
- Se não abriu nenhum → testa assunto diferente no email 3
- Bounce → remove da lista, marca no CRM

### 5.2 Cadência LinkedIn - Leveron

```
Dia 0: Conexão com nota personalizada
        "Vi que o {{escritório}} atua em {{área}}..."

Dia 2: (Após aceitar) Mensagem 1 - Pergunta
        "Curiosidade: como vocês gerenciam {{processo}}?"

Dia 5: Mensagem 2 - Valor
        Compartilhar insight/conteúdo relevante

Dia 10: Mensagem 3 - CTA suave
        "Se fizer sentido, posso mostrar como..."
```

### 5.3 Cadência Multi-canal (após validação)

```
Dia 0:  Email 1
Dia 2:  LinkedIn conexão
Dia 3:  Email 2
Dia 5:  LinkedIn mensagem (se aceitou)
Dia 7:  Email 3
Dia 10: WhatsApp (se tem número e engajou)
Dia 12: Email 4 (breakup)
```

---

## 6. Workflows N8N

### 6.1 Workflows Necessários

| # | Workflow | Trigger | Ação |
|---|---|---|---|
| **WF-01** | Lead Ingestion | Webhook / Planilha | Receber leads brutos, validar, inserir no CRM |
| **WF-02** | Email Enrichment | Novo lead no CRM | Buscar email, validar, atualizar lead |
| **WF-03** | Email Cadence Engine | Cron (diário) | Verificar cadência de cada lead, enviar email programado |
| **WF-04** | Email Tracking | Webhook (pixel/link) | Registrar abertura/clique no CRM |
| **WF-05** | Reply Handler | IMAP / Webhook | Detectar respostas, pausar cadência, notificar |
| **WF-06** | Lead Scoring | Evento no CRM | Calcular score baseado em interações |
| **WF-07** | WhatsApp Sender | Trigger manual / score alto | Enviar mensagem WhatsApp para leads quentes |
| **WF-08** | Dashboard Reporter | Cron (semanal) | Gerar relatório de métricas e enviar |
| **WF-09** | Bounce Handler | Webhook SMTP | Marcar bounces, limpar lista |
| **WF-10** | ICP A/B Tester | Cron | Distribuir leads entre variações de copy |

### 6.2 Diagrama de Fluxo Principal

```
                    ┌──────────────┐
                    │  FONTES DE   │
                    │    LEADS     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   WF-01      │
                    │ Lead Ingestion│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   WF-02      │
                    │ Enrichment   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
              ┌─────┤    CRM       ├─────┐
              │     │  (Supabase)  │     │
              │     └──────┬───────┘     │
              │            │             │
       ┌──────▼──┐  ┌──────▼──┐  ┌──────▼──┐
       │ WF-03   │  │ WF-06   │  │ WF-10   │
       │ Email   │  │ Lead    │  │ A/B     │
       │ Cadence │  │ Scoring │  │ Tester  │
       └────┬────┘  └─────────┘  └─────────┘
            │
    ┌───────┼───────┐
    │       │       │
┌───▼──┐ ┌─▼────┐ ┌▼─────┐
│WF-04 │ │WF-05 │ │WF-09 │
│Track │ │Reply │ │Bounce│
└──────┘ └──────┘ └──────┘
            │
     ┌──────▼──────┐
     │ Lead quente  │
     │ Score > X    │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   WF-07     │
     │  WhatsApp   │
     └─────────────┘
```

---

## 7. CRM (Supabase)

### 7.1 Schema do CRM

```sql
-- Tabela principal de leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    email_validated BOOLEAN DEFAULT false,
    phone TEXT,
    whatsapp TEXT,
    linkedin_url TEXT,
    instagram_handle TEXT,

    -- Empresa
    company_name TEXT,
    company_website TEXT,
    company_size TEXT, -- 'micro', 'small', 'medium', 'large'
    industry TEXT,
    role TEXT, -- cargo do lead

    -- Qualificação
    icp_id UUID REFERENCES icps(id),
    source TEXT NOT NULL, -- 'scraping_instagram', 'linkedin', 'google_maps', etc
    lead_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new', -- 'new', 'enriched', 'in_cadence', 'replied', 'meeting', 'proposal', 'won', 'lost', 'unsubscribed'

    -- Cadência
    cadence_id UUID REFERENCES cadences(id),
    cadence_step INTEGER DEFAULT 0,
    cadence_started_at TIMESTAMPTZ,
    cadence_paused BOOLEAN DEFAULT false,

    -- Tracking
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    last_replied_at TIMESTAMPTZ,

    -- Meta
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ICPs
CREATE TABLE icps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- 'escritorios_advocacia', 'pmes_sem_tech', etc
    company TEXT NOT NULL, -- 'leveron' ou 'cosmos'
    description TEXT,
    criteria JSONB, -- critérios de qualificação
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Cadências
CREATE TABLE cadences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icp_id UUID REFERENCES icps(id),
    channel TEXT NOT NULL, -- 'email', 'linkedin', 'whatsapp', 'multi'
    steps JSONB NOT NULL, -- array de steps com delay, template, canal
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates de mensagem
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cadence_id UUID REFERENCES cadences(id),
    step_number INTEGER NOT NULL,
    channel TEXT NOT NULL,
    subject TEXT, -- para email
    body TEXT NOT NULL,
    variables TEXT[], -- ['first_name', 'company_name', etc]
    version TEXT DEFAULT 'A', -- para A/B testing
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Interações/Eventos
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) NOT NULL,
    type TEXT NOT NULL, -- 'email_sent', 'email_opened', 'email_clicked', 'email_replied', 'email_bounced', 'linkedin_sent', 'whatsapp_sent', etc
    channel TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- detalhes do evento
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Experimentos A/B
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icp_id UUID REFERENCES icps(id),
    variant_a JSONB NOT NULL, -- copy/assunto A
    variant_b JSONB NOT NULL, -- copy/assunto B
    status TEXT DEFAULT 'running', -- 'running', 'concluded'
    winner TEXT, -- 'A' ou 'B'
    results JSONB,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- Configuração de domínios de email
CREATE TABLE email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT NOT NULL,
    smtp_pass_encrypted TEXT NOT NULL,
    daily_limit INTEGER DEFAULT 50,
    sent_today INTEGER DEFAULT 0,
    warmup_phase BOOLEAN DEFAULT true,
    reputation_score FLOAT DEFAULT 100.0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 7.2 Views Úteis

```sql
-- Pipeline view
CREATE VIEW pipeline_view AS
SELECT
    status,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE last_contacted_at > now() - interval '7 days') as contacted_7d,
    AVG(lead_score) as avg_score
FROM leads
GROUP BY status;

-- Cadence performance
CREATE VIEW cadence_performance AS
SELECT
    c.name as cadence_name,
    i.name as icp_name,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'replied') as replies,
    ROUND(
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'replied')::numeric /
        NULLIF(COUNT(DISTINCT l.id), 0) * 100, 2
    ) as reply_rate
FROM cadences c
JOIN icps i ON c.icp_id = i.id
LEFT JOIN leads l ON l.cadence_id = c.id
GROUP BY c.name, i.name;
```

---

## 8. Infraestrutura de Email

### 8.1 Setup Recomendado

```
Domínios de envio (NÃO usar domínio principal):
├── leveron-tech.com (ou similar)
├── leveron-dev.com
└── (2-3 domínios para rotação)

Para cada domínio:
├── SPF configurado
├── DKIM configurado
├── DMARC configurado
├── MX records apontando para provider
└── Warmup de 2-4 semanas antes de volume
```

### 8.2 Estratégia de Warmup

```
Semana 1: 5 emails/dia (para contatos conhecidos)
Semana 2: 15 emails/dia
Semana 3: 30 emails/dia
Semana 4: 50 emails/dia (volume de cruzeiro)
```

### 8.3 Ferramentas de Email para N8N

| Opção | Custo | Integração N8N |
|---|---|---|
| **SMTP próprio** (via provider) | ~R$50/mês por domínio | Node SMTP nativo |
| **Amazon SES** | ~$0.10/1000 emails | Node HTTP |
| **Resend** | Free tier 100/dia | Node HTTP / Webhook |
| **Brevo (Sendinblue)** | Free tier 300/dia | Node nativo N8N |

**Recomendação:** Começar com **SMTP próprio** (controle total) ou **Amazon SES** (custo mínimo, boa reputação).

---

## 9. Métricas e Dados de Acompanhamento

### 9.1 KPIs Principais

| Métrica | Meta Inicial | Fórmula |
|---|---|---|
| **Emails enviados/dia** | 50-100 | contagem |
| **Open Rate** | > 40% | aberturas / enviados |
| **Reply Rate** | > 5% | respostas / enviados |
| **Positive Reply Rate** | > 2% | respostas positivas / enviados |
| **Bounce Rate** | < 3% | bounces / enviados |
| **Meeting Rate** | > 1% | reuniões / enviados |
| **Emails para 1 reunião** | < 100 | enviados / reuniões |
| **Custo por lead qualificado** | < R$5 | custo total / leads qualificados |

### 9.2 Dashboard de Dados (Supabase → N8N)

```
Relatório Semanal (WF-08):
├── Total de leads novos adicionados
├── Total de emails enviados
├── Open rate por cadência
├── Reply rate por cadência
├── Reply rate por ICP
├── Bounce rate por domínio
├── Top 5 leads mais engajados
├── Leads que avançaram no pipeline
├── Performance de A/B tests
└── Saúde dos domínios (reputation)
```

### 9.3 Alertas Automáticos

| Alerta | Condição | Ação |
|---|---|---|
| Bounce alto | > 5% em um dia | Pausar envio, verificar lista |
| Domínio com problema | Reputation < 80 | Pausar domínio, investigar |
| Lead quente | Score > threshold | Notificar para contato manual |
| Resposta recebida | Qualquer reply | Notificar + pausar cadência |
| Unsubscribe | Pedido de remoção | Remover de todas as cadências |

---

## 10. Funil Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        FUNIL OUTBOUND                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOPO (Awareness)                                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Scraping → Enriquecimento → Lista Qualificada        │       │
│  │ Volume: 1000+ leads/mês                              │       │
│  └──────────────────────────┬───────────────────────────┘       │
│                             │                                    │
│  MEIO (Engagement)          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Cadência Email/LinkedIn → Abertura → Resposta        │       │
│  │ Meta: 40% open, 5% reply                             │       │
│  └──────────────────────────┬───────────────────────────┘       │
│                             │                                    │
│  FUNDO (Conversion)         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ WhatsApp follow-up → Reunião → Proposta → Fechamento │       │
│  │ Meta: 1% dos leads vira reunião                      │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Plano de Execução (Fases)

### Fase 1: Fundação (Semana 1-2)
- [ ] Setup dos domínios de email (compra + DNS + warmup)
- [ ] Deploy do schema CRM no Supabase
- [ ] Configurar N8N com credenciais (SMTP, Supabase, etc)
- [ ] Criar WF-01 (Lead Ingestion)
- [ ] Criar WF-02 (Email Enrichment)
- [ ] Definir ICP "escritórios de advocacia" no CRM
- [ ] Primeiro batch de scraping (50-100 leads)

### Fase 2: Cadência v1 (Semana 3-4)
- [ ] Criar templates de email (4 emails da cadência)
- [ ] Criar WF-03 (Email Cadence Engine)
- [ ] Criar WF-04 (Email Tracking)
- [ ] Criar WF-05 (Reply Handler)
- [ ] Criar WF-09 (Bounce Handler)
- [ ] Iniciar envio para primeiros 50 leads (domínios em warmup)
- [ ] Monitorar métricas diariamente

### Fase 3: Otimização (Semana 5-6)
- [ ] Analisar resultados da Fase 2
- [ ] Criar WF-10 (A/B Tester)
- [ ] Testar variações de subject line e copy
- [ ] Adicionar segundo ICP (PMEs) se resultados bons
- [ ] Criar WF-06 (Lead Scoring)
- [ ] Escalar volume para 100 emails/dia
- [ ] Segundo batch de scraping (200-500 leads)

### Fase 4: Multi-canal (Semana 7-8)
- [ ] Adicionar LinkedIn à cadência
- [ ] Configurar WhatsApp Business API
- [ ] Criar WF-07 (WhatsApp Sender)
- [ ] Implementar cadência multi-canal
- [ ] Criar WF-08 (Dashboard Reporter)
- [ ] Landing page para cada ICP

### Fase 5: Cosmos (Semana 9+)
- [ ] Adaptar aprendizados para ICP Cosmos
- [ ] Scraping do perfil Balão Nicolas
- [ ] Cadência específica para desenvolvedores
- [ ] Canais: Instagram DM + Email + Landing Page com comunidade

---

## 12. Stack Técnica Consolidada

```
AUTOMAÇÃO
├── N8N (já configurado via MCP)
│   ├── Motor de cadências
│   ├── Enriquecimento
│   ├── Tracking
│   └── Reporting
│
DADOS / CRM
├── Supabase (já configurado via MCP)
│   ├── Banco PostgreSQL (schema acima)
│   ├── Auth (se precisar de dashboard)
│   ├── Real-time (updates ao vivo)
│   └── Edge Functions (webhooks)
│
PESQUISA / SCRAPING
├── Exa MCP (busca web, LinkedIn, empresas)
├── Browser MCP (scraping de sites dinâmicos)
└── Google Workspace MCP (Sheets como staging)
│
EMAIL
├── SMTP próprio ou Amazon SES
├── Validação: NeverBounce / ZeroBounce
└── Tracking: pixel + redirect links
│
MESSAGING
├── WhatsApp Business API (Evolution API / Z-API)
└── Instagram (manual inicialmente)
│
LANDING PAGES
└── A definir (Carrd, Framer, ou custom)
```

---

## 13. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Domínio bloqueado por spam | Alto | Warmup gradual, múltiplos domínios, monitorar reputation |
| Lista de baixa qualidade | Alto | Validação de email antes de enviar, enriquecimento |
| Baixo reply rate | Médio | A/B testing contínuo, iterar copy rapidamente |
| Ban no Instagram/LinkedIn | Médio | Volumes conservadores, delays humanizados, proxies |
| LGPD/compliance | Alto | Opt-out em todo email, base legal de legítimo interesse |
| N8N instabilidade | Médio | Retry automático, logs, monitoring |

---

## 14. Compliance (LGPD)

- Todo email deve ter link de opt-out/unsubscribe
- Base legal: legítimo interesse (B2B cold outreach)
- Armazenar consentimento/opt-out no CRM
- Não enviar para leads que pediram remoção
- Manter registro de todas as interações
- Dados sensíveis (senhas SMTP) devem ser encriptados

---

## 15. Próximos Passos Imediatos

1. **Validar este plano** - Revisar ICPs, canais e prioridades
2. **Decidir provedor de email** - SMTP próprio vs Amazon SES vs Resend
3. **Comprar domínios de envio** - 2-3 domínios similares ao Leveron
4. **Enviar documentação do N8N** - Para construir os workflows
5. **Primeiro scraping** - Montar lista de 50 escritórios de advocacia para teste
6. **Escrever os 4 emails da cadência** - Copy para ICP escritórios

---

*Documento de planejamento - Outbound Strategy v1.0*
*Leveron (tech) + Cosmos (comunidade)*
