'use client'

import type { DomainHealth } from '@/lib/supabase-server'

interface DomainHealthCardProps {
  domain: DomainHealth
  className?: string
}

const HEALTH_COLORS = {
  healthy: { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ADE80', bar: '#4ADE80' },
  warning: { bg: 'rgba(251, 191, 36, 0.1)', text: '#FBBF24', bar: '#FBBF24' },
  critical: { bg: 'rgba(248, 113, 113, 0.1)', text: '#F87171', bar: '#F87171' },
}

export function DomainHealthCard({ domain, className }: DomainHealthCardProps) {
  const colors = HEALTH_COLORS[domain.health_status]
  const utilizationPct = Math.min(domain.utilization_pct, 100)

  return (
    <div
      className={`rounded-lg border p-4 transition-luxury ${className || ''}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {domain.domain}
          </span>
          {!domain.active && (
            <span
              className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#F87171' }}
            >
              PAUSED
            </span>
          )}
        </div>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {domain.health_status}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
            Reputation
          </span>
          <div className="text-lg font-light tabular-nums" style={{ color: colors.text }}>
            {domain.reputation_score}
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
            Warmup
          </span>
          <div className="text-lg font-light tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            Phase {domain.warmup_phase}
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
            Sent/Limit
          </span>
          <div className="text-lg font-light tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {domain.sent_today}/{domain.daily_limit}
          </div>
        </div>
      </div>

      {/* Utilization Bar */}
      <div>
        <div className="mb-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>Daily utilization</span>
          <span className="tabular-nums">{utilizationPct}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <div
            className="h-full rounded-full transition-luxury"
            style={{
              width: `${utilizationPct}%`,
              backgroundColor: utilizationPct > 90 ? '#F87171' : utilizationPct > 75 ? '#FBBF24' : colors.bar,
            }}
          />
        </div>
      </div>
    </div>
  )
}
