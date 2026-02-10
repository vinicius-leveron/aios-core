'use client'

import { LeadStatusBadge } from '@/components/outbound/lead-status-badge'
import type { HotLead } from '@/lib/supabase-server'

interface HotLeadsListProps {
  leads: HotLead[]
  className?: string
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '-'
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function HotLeadsList({ leads, className }: HotLeadsListProps) {
  return (
    <div
      className={`rounded-lg border ${className || ''}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Hot Leads
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {leads.length === 0 ? (
          <div className="p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No hot leads yet
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center gap-3 px-4 py-3 transition-luxury"
              style={{ borderColor: 'var(--border-subtle)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {/* Score */}
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
                style={{
                  backgroundColor: lead.lead_score >= 80
                    ? 'rgba(74, 222, 128, 0.15)'
                    : lead.lead_score >= 50
                    ? 'rgba(251, 191, 36, 0.15)'
                    : 'rgba(96, 165, 250, 0.15)',
                  color: lead.lead_score >= 80
                    ? '#4ADE80'
                    : lead.lead_score >= 50
                    ? '#FBBF24'
                    : '#60A5FA',
                }}
              >
                {lead.lead_score}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {lead.first_name} {lead.last_name}
                  </span>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <div
                  className="truncate text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {lead.company_name} {lead.role ? `| ${lead.role}` : ''}
                </div>
              </div>

              {/* Activity */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {lead.emails_opened}/{lead.emails_sent} opened
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {formatTimeAgo(lead.last_replied_at || lead.last_contacted_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
