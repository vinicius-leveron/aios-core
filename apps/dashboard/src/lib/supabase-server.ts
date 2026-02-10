/**
 * Server-side Supabase client
 * Used by API routes only - never import in client components
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  supabaseInstance = createClient(url, key, {
    auth: { persistSession: false }
  })

  return supabaseInstance
}

// ============ TypeScript Types for Outbound CRM ============

export interface Lead {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  email_validated: boolean
  phone: string | null
  company_name: string | null
  company_website: string | null
  company_size: string | null
  role: string | null
  icp_id: string | null
  source: string
  lead_score: number
  status: LeadStatus
  cadence_id: string | null
  cadence_step: number
  cadence_started_at: string | null
  cadence_paused: boolean
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  emails_replied: number
  last_contacted_at: string | null
  last_replied_at: string | null
  tags: string[]
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type LeadStatus =
  | 'new'
  | 'enriched'
  | 'unqualified'
  | 'incomplete'
  | 'in_cadence'
  | 'cadence_complete'
  | 'replied'
  | 'meeting'
  | 'proposal'
  | 'won'
  | 'lost'
  | 'bounced'
  | 'unsubscribed'

export interface PipelineView {
  status: LeadStatus
  total: number
  contacted_7d: number
  replied_7d: number
  avg_score: number
  oldest_lead: string
  newest_lead: string
}

export interface CadencePerformance {
  cadence_name: string
  channel: string
  icp_name: string
  total_leads: number
  leads_contacted: number
  leads_opened: number
  leads_replied: number
  open_rate: number
  reply_rate: number
}

export interface DomainHealth {
  domain: string
  active: boolean
  warmup_phase: number
  daily_limit: number
  sent_today: number
  utilization_pct: number
  reputation_score: number
  health_status: 'healthy' | 'warning' | 'critical'
  last_activity: string
}

export interface HotLead {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  company_name: string | null
  role: string | null
  lead_score: number
  status: LeadStatus
  emails_sent: number
  emails_opened: number
  emails_replied: number
  last_contacted_at: string | null
  last_replied_at: string | null
  icp_name: string | null
}

export interface Interaction {
  id: string
  lead_id: string | null
  type: string
  channel: string
  subject: string | null
  metadata: Record<string, unknown>
  created_at: string
}
