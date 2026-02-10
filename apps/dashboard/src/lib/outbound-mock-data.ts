/**
 * Mock data for Outbound CRM dashboard
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
  { status: 'new', total: 45, contacted_7d: 0, replied_7d: 0, avg_score: 5, oldest_lead: '2026-01-15T00:00:00Z', newest_lead: '2026-02-09T00:00:00Z' },
  { status: 'enriched', total: 32, contacted_7d: 0, replied_7d: 0, avg_score: 15, oldest_lead: '2026-01-20T00:00:00Z', newest_lead: '2026-02-08T00:00:00Z' },
  { status: 'in_cadence', total: 78, contacted_7d: 42, replied_7d: 0, avg_score: 28, oldest_lead: '2026-01-25T00:00:00Z', newest_lead: '2026-02-07T00:00:00Z' },
  { status: 'replied', total: 24, contacted_7d: 12, replied_7d: 12, avg_score: 55, oldest_lead: '2026-01-28T00:00:00Z', newest_lead: '2026-02-09T00:00:00Z' },
  { status: 'meeting', total: 8, contacted_7d: 3, replied_7d: 3, avg_score: 72, oldest_lead: '2026-02-01T00:00:00Z', newest_lead: '2026-02-08T00:00:00Z' },
  { status: 'proposal', total: 5, contacted_7d: 2, replied_7d: 0, avg_score: 80, oldest_lead: '2026-02-03T00:00:00Z', newest_lead: '2026-02-07T00:00:00Z' },
  { status: 'won', total: 3, contacted_7d: 1, replied_7d: 0, avg_score: 90, oldest_lead: '2026-02-05T00:00:00Z', newest_lead: '2026-02-09T00:00:00Z' },
  { status: 'lost', total: 12, contacted_7d: 0, replied_7d: 0, avg_score: 20, oldest_lead: '2026-01-20T00:00:00Z', newest_lead: '2026-02-06T00:00:00Z' },
  { status: 'bounced', total: 4, contacted_7d: 0, replied_7d: 0, avg_score: 0, oldest_lead: '2026-02-01T00:00:00Z', newest_lead: '2026-02-08T00:00:00Z' },
  { status: 'unsubscribed', total: 2, contacted_7d: 0, replied_7d: 0, avg_score: 0, oldest_lead: '2026-02-04T00:00:00Z', newest_lead: '2026-02-07T00:00:00Z' },
]

export const MOCK_CADENCES: CadencePerformance[] = [
  { cadence_name: 'Escritorios Advocacia 4-Step', channel: 'email', icp_name: 'Escritorios de Advocacia', total_leads: 78, leads_contacted: 65, leads_opened: 29, leads_replied: 8, open_rate: 44.6, reply_rate: 12.3 },
]

export const MOCK_DOMAINS: DomainHealth[] = [
  { domain: 'leveron.com.br', active: true, warmup_phase: 3, daily_limit: 30, sent_today: 18, utilization_pct: 60, reputation_score: 92, health_status: 'healthy', last_activity: '2026-02-10T09:15:00Z' },
  { domain: 'leveron-tech.com', active: true, warmup_phase: 4, daily_limit: 50, sent_today: 35, utilization_pct: 70, reputation_score: 88, health_status: 'healthy', last_activity: '2026-02-10T09:10:00Z' },
  { domain: 'contato-leveron.com', active: true, warmup_phase: 2, daily_limit: 15, sent_today: 12, utilization_pct: 80, reputation_score: 75, health_status: 'warning', last_activity: '2026-02-10T08:45:00Z' },
]

export const MOCK_HOT_LEADS: HotLead[] = [
  { id: '1', first_name: 'Carlos', last_name: 'Mendes', email: 'carlos@mendeslegal.com.br', company_name: 'Mendes & Associados', role: 'Socio', lead_score: 85, status: 'meeting', emails_sent: 4, emails_opened: 3, emails_replied: 2, last_contacted_at: '2026-02-08T14:00:00Z', last_replied_at: '2026-02-08T16:30:00Z', icp_name: 'Escritorios de Advocacia' },
  { id: '2', first_name: 'Ana', last_name: 'Oliveira', email: 'ana@oliveiralaw.com.br', company_name: 'Oliveira Advogados', role: 'Diretora', lead_score: 72, status: 'replied', emails_sent: 3, emails_opened: 3, emails_replied: 1, last_contacted_at: '2026-02-09T10:00:00Z', last_replied_at: '2026-02-09T11:45:00Z', icp_name: 'Escritorios de Advocacia' },
  { id: '3', first_name: 'Roberto', last_name: 'Santos', email: 'roberto@santoslaw.com.br', company_name: 'Santos & Filho', role: 'Socio Fundador', lead_score: 68, status: 'replied', emails_sent: 4, emails_opened: 4, emails_replied: 1, last_contacted_at: '2026-02-07T09:00:00Z', last_replied_at: '2026-02-07T14:20:00Z', icp_name: 'Escritorios de Advocacia' },
  { id: '4', first_name: 'Patricia', last_name: 'Lima', email: 'patricia@limalegal.com.br', company_name: 'Lima Advocacia', role: 'Socia', lead_score: 62, status: 'in_cadence', emails_sent: 2, emails_opened: 2, emails_replied: 0, last_contacted_at: '2026-02-09T09:00:00Z', last_replied_at: null, icp_name: 'Escritorios de Advocacia' },
  { id: '5', first_name: 'Fernando', last_name: 'Costa', email: 'fernando@costadvogados.com.br', company_name: 'Costa Advogados', role: 'Diretor Geral', lead_score: 55, status: 'in_cadence', emails_sent: 3, emails_opened: 2, emails_replied: 0, last_contacted_at: '2026-02-08T09:00:00Z', last_replied_at: null, icp_name: 'Escritorios de Advocacia' },
]

export const MOCK_ACTIVITY: Interaction[] = [
  { id: '1', lead_id: '1', type: 'email_replied', channel: 'email', subject: 'Re: Automacao para Mendes & Associados', metadata: { snippet: 'Ola! Temos interesse em conhecer mais...' }, created_at: '2026-02-10T08:30:00Z' },
  { id: '2', lead_id: '2', type: 'email_opened', channel: 'email', subject: 'Proposta de tecnologia para Oliveira Advogados', metadata: { step_number: 2 }, created_at: '2026-02-10T08:15:00Z' },
  { id: '3', lead_id: '4', type: 'email_sent', channel: 'email', subject: 'Caso de sucesso: escritorio similar ao seu', metadata: { step_number: 3, domain: 'leveron.com.br' }, created_at: '2026-02-10T09:00:00Z' },
  { id: '4', lead_id: '3', type: 'email_clicked', channel: 'email', subject: null, metadata: { url: 'https://leveron.com/caso-escritorio', step_number: 2 }, created_at: '2026-02-10T07:45:00Z' },
  { id: '5', lead_id: '5', type: 'email_opened', channel: 'email', subject: 'Como escritorios estao economizando 40% do tempo', metadata: { step_number: 1 }, created_at: '2026-02-10T07:30:00Z' },
  { id: '6', lead_id: null, type: 'score_updated', channel: 'system', subject: null, metadata: { lead_name: 'Carlos Mendes', previous_score: 70, new_score: 85, reason: 'email_replied' }, created_at: '2026-02-10T08:31:00Z' },
  { id: '7', lead_id: null, type: 'weekly_report', channel: 'system', subject: 'Weekly Report 2026-W06', metadata: { emails_sent: 350, open_rate: 42 }, created_at: '2026-02-10T08:00:00Z' },
  { id: '8', lead_id: '2', type: 'email_sent', channel: 'email', subject: 'Automacao juridica: proximo passo', metadata: { step_number: 2, domain: 'leveron-tech.com' }, created_at: '2026-02-09T09:00:00Z' },
]

export const MOCK_LEADS: Lead[] = [
  { id: '1', first_name: 'Carlos', last_name: 'Mendes', email: 'carlos@mendeslegal.com.br', email_validated: true, phone: '11999001122', company_name: 'Mendes & Associados', company_website: 'mendeslegal.com.br', company_size: 'medium', role: 'Socio', icp_id: 'icp-1', source: 'linkedin', lead_score: 85, status: 'meeting', cadence_id: 'cad-1', cadence_step: 4, cadence_started_at: '2026-01-28T00:00:00Z', cadence_paused: true, emails_sent: 4, emails_opened: 3, emails_clicked: 1, emails_replied: 2, last_contacted_at: '2026-02-08T14:00:00Z', last_replied_at: '2026-02-08T16:30:00Z', tags: ['hot', 'decision-maker'], custom_fields: {}, created_at: '2026-01-20T00:00:00Z', updated_at: '2026-02-08T16:30:00Z' },
  { id: '2', first_name: 'Ana', last_name: 'Oliveira', email: 'ana@oliveiralaw.com.br', email_validated: true, phone: '11988776655', company_name: 'Oliveira Advogados', company_website: 'oliveiralaw.com.br', company_size: 'small', role: 'Diretora', icp_id: 'icp-1', source: 'google_maps', lead_score: 72, status: 'replied', cadence_id: 'cad-1', cadence_step: 3, cadence_started_at: '2026-01-30T00:00:00Z', cadence_paused: true, emails_sent: 3, emails_opened: 3, emails_clicked: 0, emails_replied: 1, last_contacted_at: '2026-02-09T10:00:00Z', last_replied_at: '2026-02-09T11:45:00Z', tags: ['warm'], custom_fields: {}, created_at: '2026-01-22T00:00:00Z', updated_at: '2026-02-09T11:45:00Z' },
  { id: '3', first_name: 'Roberto', last_name: 'Santos', email: 'roberto@santoslaw.com.br', email_validated: true, phone: null, company_name: 'Santos & Filho', company_website: 'santoslaw.com.br', company_size: 'medium', role: 'Socio Fundador', icp_id: 'icp-1', source: 'oab_directory', lead_score: 68, status: 'replied', cadence_id: 'cad-1', cadence_step: 4, cadence_started_at: '2026-01-25T00:00:00Z', cadence_paused: true, emails_sent: 4, emails_opened: 4, emails_clicked: 2, emails_replied: 1, last_contacted_at: '2026-02-07T09:00:00Z', last_replied_at: '2026-02-07T14:20:00Z', tags: ['warm'], custom_fields: {}, created_at: '2026-01-18T00:00:00Z', updated_at: '2026-02-07T14:20:00Z' },
  { id: '4', first_name: 'Patricia', last_name: 'Lima', email: 'patricia@limalegal.com.br', email_validated: true, phone: '11977665544', company_name: 'Lima Advocacia', company_website: null, company_size: 'small', role: 'Socia', icp_id: 'icp-1', source: 'linkedin', lead_score: 62, status: 'in_cadence', cadence_id: 'cad-1', cadence_step: 2, cadence_started_at: '2026-02-03T00:00:00Z', cadence_paused: false, emails_sent: 2, emails_opened: 2, emails_clicked: 0, emails_replied: 0, last_contacted_at: '2026-02-09T09:00:00Z', last_replied_at: null, tags: [], custom_fields: {}, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-09T09:00:00Z' },
  { id: '5', first_name: 'Fernando', last_name: 'Costa', email: 'fernando@costadvogados.com.br', email_validated: true, phone: null, company_name: 'Costa Advogados', company_website: 'costadvogados.com.br', company_size: 'large', role: 'Diretor Geral', icp_id: 'icp-1', source: 'google_maps', lead_score: 55, status: 'in_cadence', cadence_id: 'cad-1', cadence_step: 3, cadence_started_at: '2026-01-29T00:00:00Z', cadence_paused: false, emails_sent: 3, emails_opened: 2, emails_clicked: 1, emails_replied: 0, last_contacted_at: '2026-02-08T09:00:00Z', last_replied_at: null, tags: ['warm'], custom_fields: {}, created_at: '2026-01-19T00:00:00Z', updated_at: '2026-02-08T09:00:00Z' },
  { id: '6', first_name: 'Mariana', last_name: 'Ferreira', email: 'mariana@ferreiralegal.com.br', email_validated: true, phone: null, company_name: 'Ferreira & Associados', company_website: 'ferreiralegal.com.br', company_size: 'medium', role: 'Socia', icp_id: 'icp-1', source: 'oab_directory', lead_score: 28, status: 'in_cadence', cadence_id: 'cad-1', cadence_step: 1, cadence_started_at: '2026-02-07T00:00:00Z', cadence_paused: false, emails_sent: 1, emails_opened: 0, emails_clicked: 0, emails_replied: 0, last_contacted_at: '2026-02-07T09:00:00Z', last_replied_at: null, tags: [], custom_fields: {}, created_at: '2026-02-05T00:00:00Z', updated_at: '2026-02-07T09:00:00Z' },
  { id: '7', first_name: 'Ricardo', last_name: 'Almeida', email: 'ricardo@almeidalaw.com.br', email_validated: false, phone: null, company_name: 'Almeida Advocacia', company_website: null, company_size: 'micro', role: 'Advogado', icp_id: 'icp-1', source: 'google_maps', lead_score: 10, status: 'new', cadence_id: null, cadence_step: 0, cadence_started_at: null, cadence_paused: false, emails_sent: 0, emails_opened: 0, emails_clicked: 0, emails_replied: 0, last_contacted_at: null, last_replied_at: null, tags: [], custom_fields: {}, created_at: '2026-02-09T00:00:00Z', updated_at: '2026-02-09T00:00:00Z' },
  { id: '8', first_name: 'Lucia', last_name: 'Barbosa', email: 'lucia@barbosalaw.com.br', email_validated: true, phone: '11966554433', company_name: 'Barbosa e Filhos', company_website: 'barbosalaw.com.br', company_size: 'large', role: 'Socia Fundadora', icp_id: 'icp-1', source: 'linkedin', lead_score: 90, status: 'won', cadence_id: 'cad-1', cadence_step: 4, cadence_started_at: '2026-01-20T00:00:00Z', cadence_paused: true, emails_sent: 4, emails_opened: 4, emails_clicked: 2, emails_replied: 3, last_contacted_at: '2026-02-05T14:00:00Z', last_replied_at: '2026-02-05T15:30:00Z', tags: ['hot', 'decision-maker', 'closed'], custom_fields: {}, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-02-05T15:30:00Z' },
]
