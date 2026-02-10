'use client'

import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/lib/supabase-server'

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: 'rgba(96, 165, 250, 0.15)', text: '#60A5FA' },
  enriched: { label: 'Enriched', bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7' },
  unqualified: { label: 'Unqualified', bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' },
  incomplete: { label: 'Incomplete', bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' },
  in_cadence: { label: 'In Cadence', bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399' },
  cadence_complete: { label: 'Cadence Done', bg: 'rgba(52, 211, 153, 0.1)', text: '#6EE7B7' },
  replied: { label: 'Replied', bg: 'rgba(251, 191, 36, 0.15)', text: '#FBBF24' },
  meeting: { label: 'Meeting', bg: 'rgba(249, 115, 22, 0.15)', text: '#F97316' },
  proposal: { label: 'Proposal', bg: 'rgba(236, 72, 153, 0.15)', text: '#EC4899' },
  won: { label: 'Won', bg: 'rgba(74, 222, 128, 0.2)', text: '#4ADE80' },
  lost: { label: 'Lost', bg: 'rgba(248, 113, 113, 0.15)', text: '#F87171' },
  bounced: { label: 'Bounced', bg: 'rgba(248, 113, 113, 0.1)', text: '#FCA5A5' },
  unsubscribed: { label: 'Unsub', bg: 'rgba(107, 114, 128, 0.1)', text: '#9CA3AF' },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
  className?: string
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        className
      )}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  )
}
