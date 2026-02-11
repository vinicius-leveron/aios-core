/**
 * Mock data for CRM Imobiliarias dashboard
 * Used when Supabase is not configured or in demo mode
 */
import type {
  PipelineView,
  CadencePerformance,
  DomainHealth,
  HotLead,
  Interaction,
  Lead,
} from '@/lib/supabase-server'

export const MOCK_PIPELINE: PipelineView[] = [
  { status: 'new', total: 52, contacted_7d: 0, replied_7d: 0, avg_score: 5, oldest_lead: '2026-01-15T00:00:00Z', newest_lead: '2026-02-09T00:00:00Z' },
  { status: 'enriched', total: 38, contacted_7d: 0, replied_7d: 0, avg_score: 18, oldest_lead: '2026-01-20T00:00:00Z', newest_lead: '2026-02-08T00:00:00Z' },
  { status: 'in_cadence', total: 85, contacted_7d: 48, replied_7d: 0, avg_score: 30, oldest_lead: '2026-01-25T00:00:00Z', newest_lead: '2026-02-07T00:00:00Z' },
  { status: 'replied', total: 28, contacted_7d: 15, replied_7d: 15, avg_score: 58, oldest_lead: '2026-01-28T00:00:00Z', newest_lead: '2026-02-09T00:00:00Z' },
  { status: 'meeting', total: 12, contacted_7d: 5, replied_7d: 5, avg_score: 75, oldest_lead: '2026-02-01T00:00:00Z', newest_lead: '2026-02-08T00:00:00Z' },
  { status: 'proposal', total: 6, contacted_7d: 3, replied_7d: 0, avg_score: 82, oldest_lead: '2026-02-03T00:00:00Z', newest_lead: '2026-02-07T00:00:00Z' },
  { status: 'won', total: 4, contacted_7d: 1, replied_7d: 0, avg_score: 92, oldest_lead: '2026-02-05T00:00:00Z', newest_lead: '2026-02-09T00:00:00Z' },
  { status: 'lost', total: 10, contacted_7d: 0, replied_7d: 0, avg_score: 18, oldest_lead: '2026-01-20T00:00:00Z', newest_lead: '2026-02-06T00:00:00Z' },
  { status: 'bounced', total: 3, contacted_7d: 0, replied_7d: 0, avg_score: 0, oldest_lead: '2026-02-01T00:00:00Z', newest_lead: '2026-02-08T00:00:00Z' },
  { status: 'unsubscribed', total: 2, contacted_7d: 0, replied_7d: 0, avg_score: 0, oldest_lead: '2026-02-04T00:00:00Z', newest_lead: '2026-02-07T00:00:00Z' },
]

export const MOCK_CADENCES: CadencePerformance[] = [
  { cadence_name: 'Imobiliarias SP 4-Step', channel: 'email', icp_name: 'Imobiliarias Grande SP', total_leads: 85, leads_contacted: 72, leads_opened: 35, leads_replied: 12, open_rate: 48.6, reply_rate: 16.7 },
  { cadence_name: 'Corretores Premium 3-Step', channel: 'email', icp_name: 'Corretores Top Performers', total_leads: 42, leads_contacted: 38, leads_opened: 20, leads_replied: 7, open_rate: 52.6, reply_rate: 18.4 },
]

export const MOCK_DOMAINS: DomainHealth[] = [
  { domain: 'leveron.com.br', active: true, warmup_phase: 3, daily_limit: 30, sent_today: 18, utilization_pct: 60, reputation_score: 92, health_status: 'healthy', last_activity: '2026-02-10T09:15:00Z' },
  { domain: 'leveron-imoveis.com', active: true, warmup_phase: 4, daily_limit: 50, sent_today: 35, utilization_pct: 70, reputation_score: 88, health_status: 'healthy', last_activity: '2026-02-10T09:10:00Z' },
  { domain: 'contato-leveron.com.br', active: true, warmup_phase: 2, daily_limit: 15, sent_today: 12, utilization_pct: 80, reputation_score: 75, health_status: 'warning', last_activity: '2026-02-10T08:45:00Z' },
]

export const MOCK_HOT_LEADS: HotLead[] = [
  { id: '1', first_name: 'Ricardo', last_name: 'Moreira', email: 'ricardo@moreiraimoveis.com.br', company_name: 'Moreira Imoveis', role: 'Diretor', lead_score: 88, status: 'meeting', emails_sent: 4, emails_opened: 4, emails_replied: 2, last_contacted_at: '2026-02-08T14:00:00Z', last_replied_at: '2026-02-08T16:30:00Z', icp_name: 'Imobiliarias Grande SP' },
  { id: '2', first_name: 'Camila', last_name: 'Rocha', email: 'camila@rochaempreendimentos.com.br', company_name: 'Rocha Empreendimentos', role: 'Socia', lead_score: 76, status: 'replied', emails_sent: 3, emails_opened: 3, emails_replied: 1, last_contacted_at: '2026-02-09T10:00:00Z', last_replied_at: '2026-02-09T11:45:00Z', icp_name: 'Imobiliarias Grande SP' },
  { id: '3', first_name: 'Marcos', last_name: 'Teixeira', email: 'marcos@teixeiraimob.com.br', company_name: 'Teixeira Imobiliaria', role: 'Proprietario', lead_score: 70, status: 'replied', emails_sent: 4, emails_opened: 4, emails_replied: 1, last_contacted_at: '2026-02-07T09:00:00Z', last_replied_at: '2026-02-07T14:20:00Z', icp_name: 'Imobiliarias Grande SP' },
  { id: '4', first_name: 'Juliana', last_name: 'Campos', email: 'juliana@camposimoveis.com.br', company_name: 'Campos Imoveis', role: 'Gerente Comercial', lead_score: 65, status: 'in_cadence', emails_sent: 2, emails_opened: 2, emails_replied: 0, last_contacted_at: '2026-02-09T09:00:00Z', last_replied_at: null, icp_name: 'Imobiliarias Grande SP' },
  { id: '5', first_name: 'Eduardo', last_name: 'Nascimento', email: 'eduardo@nascimentocorretor.com.br', company_name: 'Nascimento Corretora', role: 'Corretor Chefe', lead_score: 58, status: 'in_cadence', emails_sent: 3, emails_opened: 2, emails_replied: 0, last_contacted_at: '2026-02-08T09:00:00Z', last_replied_at: null, icp_name: 'Corretores Top Performers' },
]

export const MOCK_ACTIVITY: Interaction[] = [
  { id: '1', lead_id: '1', type: 'email_replied', channel: 'email', subject: 'Re: Solucao de gestao para Moreira Imoveis', metadata: { snippet: 'Ola! Gostamos da proposta, podemos agendar uma demonstracao...' }, created_at: '2026-02-10T08:30:00Z' },
  { id: '2', lead_id: '2', type: 'email_opened', channel: 'email', subject: 'Como imobiliarias estao aumentando vendas em 35%', metadata: { step_number: 2 }, created_at: '2026-02-10T08:15:00Z' },
  { id: '3', lead_id: '4', type: 'email_sent', channel: 'email', subject: 'Case de sucesso: imobiliaria similar a sua', metadata: { step_number: 3, domain: 'leveron.com.br' }, created_at: '2026-02-10T09:00:00Z' },
  { id: '4', lead_id: '3', type: 'email_clicked', channel: 'email', subject: null, metadata: { url: 'https://leveron.com/case-imobiliaria', step_number: 2 }, created_at: '2026-02-10T07:45:00Z' },
  { id: '5', lead_id: '5', type: 'email_opened', channel: 'email', subject: 'Como corretores estao fechando 40% mais negocios', metadata: { step_number: 1 }, created_at: '2026-02-10T07:30:00Z' },
  { id: '6', lead_id: null, type: 'score_updated', channel: 'system', subject: null, metadata: { lead_name: 'Ricardo Moreira', previous_score: 72, new_score: 88, reason: 'email_replied' }, created_at: '2026-02-10T08:31:00Z' },
  { id: '7', lead_id: null, type: 'weekly_report', channel: 'system', subject: 'Relatorio Semanal 2026-W06', metadata: { emails_sent: 420, open_rate: 46 }, created_at: '2026-02-10T08:00:00Z' },
  { id: '8', lead_id: '2', type: 'email_sent', channel: 'email', subject: 'Tecnologia para gestao de imoveis: proximo passo', metadata: { step_number: 2, domain: 'leveron-imoveis.com' }, created_at: '2026-02-09T09:00:00Z' },
]

export const MOCK_LEADS: Lead[] = [
  { id: '1', first_name: 'Ricardo', last_name: 'Moreira', email: 'ricardo@moreiraimoveis.com.br', email_validated: true, phone: '11999001122', company_name: 'Moreira Imoveis', company_website: 'moreiraimoveis.com.br', company_size: 'medium', role: 'Diretor', icp_id: 'icp-1', source: 'linkedin', lead_score: 88, status: 'meeting', cadence_id: 'cad-1', cadence_step: 4, cadence_started_at: '2026-01-28T00:00:00Z', cadence_paused: true, emails_sent: 4, emails_opened: 4, emails_clicked: 2, emails_replied: 2, last_contacted_at: '2026-02-08T14:00:00Z', last_replied_at: '2026-02-08T16:30:00Z', tags: ['hot', 'decision-maker'], custom_fields: {}, created_at: '2026-01-20T00:00:00Z', updated_at: '2026-02-08T16:30:00Z' },
  { id: '2', first_name: 'Camila', last_name: 'Rocha', email: 'camila@rochaempreendimentos.com.br', email_validated: true, phone: '11988776655', company_name: 'Rocha Empreendimentos', company_website: 'rochaempreendimentos.com.br', company_size: 'large', role: 'Socia', icp_id: 'icp-1', source: 'google_maps', lead_score: 76, status: 'replied', cadence_id: 'cad-1', cadence_step: 3, cadence_started_at: '2026-01-30T00:00:00Z', cadence_paused: true, emails_sent: 3, emails_opened: 3, emails_clicked: 1, emails_replied: 1, last_contacted_at: '2026-02-09T10:00:00Z', last_replied_at: '2026-02-09T11:45:00Z', tags: ['warm'], custom_fields: {}, created_at: '2026-01-22T00:00:00Z', updated_at: '2026-02-09T11:45:00Z' },
  { id: '3', first_name: 'Marcos', last_name: 'Teixeira', email: 'marcos@teixeiraimob.com.br', email_validated: true, phone: null, company_name: 'Teixeira Imobiliaria', company_website: 'teixeiraimob.com.br', company_size: 'medium', role: 'Proprietario', icp_id: 'icp-1', source: 'creci_directory', lead_score: 70, status: 'replied', cadence_id: 'cad-1', cadence_step: 4, cadence_started_at: '2026-01-25T00:00:00Z', cadence_paused: true, emails_sent: 4, emails_opened: 4, emails_clicked: 2, emails_replied: 1, last_contacted_at: '2026-02-07T09:00:00Z', last_replied_at: '2026-02-07T14:20:00Z', tags: ['warm'], custom_fields: {}, created_at: '2026-01-18T00:00:00Z', updated_at: '2026-02-07T14:20:00Z' },
  { id: '4', first_name: 'Juliana', last_name: 'Campos', email: 'juliana@camposimoveis.com.br', email_validated: true, phone: '11977665544', company_name: 'Campos Imoveis', company_website: null, company_size: 'small', role: 'Gerente Comercial', icp_id: 'icp-1', source: 'linkedin', lead_score: 65, status: 'in_cadence', cadence_id: 'cad-1', cadence_step: 2, cadence_started_at: '2026-02-03T00:00:00Z', cadence_paused: false, emails_sent: 2, emails_opened: 2, emails_clicked: 0, emails_replied: 0, last_contacted_at: '2026-02-09T09:00:00Z', last_replied_at: null, tags: [], custom_fields: {}, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-09T09:00:00Z' },
  { id: '5', first_name: 'Eduardo', last_name: 'Nascimento', email: 'eduardo@nascimentocorretor.com.br', email_validated: true, phone: null, company_name: 'Nascimento Corretora', company_website: 'nascimentocorretor.com.br', company_size: 'small', role: 'Corretor Chefe', icp_id: 'icp-2', source: 'google_maps', lead_score: 58, status: 'in_cadence', cadence_id: 'cad-2', cadence_step: 3, cadence_started_at: '2026-01-29T00:00:00Z', cadence_paused: false, emails_sent: 3, emails_opened: 2, emails_clicked: 1, emails_replied: 0, last_contacted_at: '2026-02-08T09:00:00Z', last_replied_at: null, tags: ['warm'], custom_fields: {}, created_at: '2026-01-19T00:00:00Z', updated_at: '2026-02-08T09:00:00Z' },
  { id: '6', first_name: 'Fernanda', last_name: 'Alves', email: 'fernanda@alvesimobiliaria.com.br', email_validated: true, phone: null, company_name: 'Alves Imobiliaria', company_website: 'alvesimobiliaria.com.br', company_size: 'medium', role: 'Diretora Comercial', icp_id: 'icp-1', source: 'creci_directory', lead_score: 32, status: 'in_cadence', cadence_id: 'cad-1', cadence_step: 1, cadence_started_at: '2026-02-07T00:00:00Z', cadence_paused: false, emails_sent: 1, emails_opened: 0, emails_clicked: 0, emails_replied: 0, last_contacted_at: '2026-02-07T09:00:00Z', last_replied_at: null, tags: [], custom_fields: {}, created_at: '2026-02-05T00:00:00Z', updated_at: '2026-02-07T09:00:00Z' },
  { id: '7', first_name: 'Bruno', last_name: 'Carvalho', email: 'bruno@carvalho.imob.br', email_validated: false, phone: null, company_name: 'Carvalho Imoveis', company_website: null, company_size: 'micro', role: 'Corretor', icp_id: 'icp-2', source: 'google_maps', lead_score: 12, status: 'new', cadence_id: null, cadence_step: 0, cadence_started_at: null, cadence_paused: false, emails_sent: 0, emails_opened: 0, emails_clicked: 0, emails_replied: 0, last_contacted_at: null, last_replied_at: null, tags: [], custom_fields: {}, created_at: '2026-02-09T00:00:00Z', updated_at: '2026-02-09T00:00:00Z' },
  { id: '8', first_name: 'Patricia', last_name: 'Duarte', email: 'patricia@duarteempreendimentos.com.br', email_validated: true, phone: '11966554433', company_name: 'Duarte Empreendimentos', company_website: 'duarteempreendimentos.com.br', company_size: 'large', role: 'CEO', icp_id: 'icp-1', source: 'linkedin', lead_score: 93, status: 'won', cadence_id: 'cad-1', cadence_step: 4, cadence_started_at: '2026-01-20T00:00:00Z', cadence_paused: true, emails_sent: 4, emails_opened: 4, emails_clicked: 3, emails_replied: 3, last_contacted_at: '2026-02-05T14:00:00Z', last_replied_at: '2026-02-05T15:30:00Z', tags: ['hot', 'decision-maker', 'closed'], custom_fields: {}, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-02-05T15:30:00Z' },
]
