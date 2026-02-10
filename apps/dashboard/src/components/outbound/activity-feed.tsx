'use client'

import { Mail, MousePointerClick, Reply, AlertTriangle, TrendingUp, FileText } from 'lucide-react'
import type { Interaction } from '@/lib/supabase-server'
import type { LucideIcon } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  email_sent: { icon: Mail, color: '#60A5FA', label: 'Email sent' },
  email_opened: { icon: Mail, color: '#34D399', label: 'Email opened' },
  email_clicked: { icon: MousePointerClick, color: '#A855F7', label: 'Link clicked' },
  email_replied: { icon: Reply, color: '#FBBF24', label: 'Reply received' },
  email_bounced: { icon: AlertTriangle, color: '#F87171', label: 'Email bounced' },
  score_updated: { icon: TrendingUp, color: '#EC4899', label: 'Score updated' },
  weekly_report: { icon: FileText, color: 'var(--accent-gold)', label: 'Weekly report' },
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getDescription(interaction: Interaction): string {
  const meta = interaction.metadata || {}
  switch (interaction.type) {
    case 'email_sent':
      return interaction.subject || `Step ${meta.step_number || '?'} via ${meta.domain || 'unknown'}`
    case 'email_opened':
      return interaction.subject || `Step ${meta.step_number || '?'}`
    case 'email_clicked':
      return `${meta.url || 'Link'} (step ${meta.step_number || '?'})`
    case 'email_replied':
      return (meta.snippet as string) || interaction.subject || 'Reply received'
    case 'email_bounced':
      return `${meta.bounce_type || 'unknown'}: ${meta.reason || ''}`
    case 'score_updated':
      return `${meta.lead_name || 'Lead'}: ${meta.previous_score} → ${meta.new_score}`
    case 'weekly_report':
      return `${meta.emails_sent || 0} sent, ${meta.open_rate || 0}% open rate`
    default:
      return interaction.subject || interaction.type
  }
}

interface ActivityFeedProps {
  activity: Interaction[]
  className?: string
}

export function ActivityFeed({ activity, className }: ActivityFeedProps) {
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
          Recent Activity
        </h3>
      </div>

      <div className="max-h-[400px] overflow-y-auto scrollbar-refined">
        {activity.length === 0 ? (
          <div className="p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No activity yet
          </div>
        ) : (
          activity.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.email_sent
            const Icon = config.icon

            return (
              <div
                key={item.id}
                className="flex gap-3 border-b px-4 py-3 last:border-b-0"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div
                  className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon className="h-3 w-3" style={{ color: config.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {config.label}
                    </span>
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(item.created_at)}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {getDescription(item)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
