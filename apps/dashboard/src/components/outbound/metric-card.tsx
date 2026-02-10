'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  icon: LucideIcon
  className?: string
}

export function MetricCard({ title, value, subtitle, trend, icon: Icon, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-4 transition-luxury',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {title}
        </span>
        <Icon
          className="h-4 w-4"
          style={{ color: 'var(--accent-gold)' }}
        />
      </div>

      <div className="flex items-end gap-2">
        <span
          className="text-2xl font-light tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
        {trend && (
          <span
            className="mb-1 text-xs font-medium"
            style={{
              color: trend.value >= 0 ? 'var(--status-success)' : 'var(--status-error)',
            }}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>

      {subtitle && (
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </span>
      )}
    </div>
  )
}
