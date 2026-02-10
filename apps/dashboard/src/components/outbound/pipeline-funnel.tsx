'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PipelineView } from '@/lib/supabase-server'

const STATUS_COLORS: Record<string, string> = {
  new: '#60A5FA',
  enriched: '#A855F7',
  in_cadence: '#34D399',
  cadence_complete: '#6EE7B7',
  replied: '#FBBF24',
  meeting: '#F97316',
  proposal: '#EC4899',
  won: '#4ADE80',
  lost: '#F87171',
  bounced: '#FCA5A5',
  unsubscribed: '#9CA3AF',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  enriched: 'Enriched',
  in_cadence: 'In Cadence',
  cadence_complete: 'Done',
  replied: 'Replied',
  meeting: 'Meeting',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
  bounced: 'Bounced',
  unsubscribed: 'Unsub',
}

interface PipelineFunnelProps {
  data: PipelineView[]
  className?: string
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PipelineView }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-medium">{STATUS_LABELS[item.status] || item.status}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{item.total} leads</p>
      {item.replied_7d > 0 && (
        <p style={{ color: 'var(--status-success)' }}>{item.replied_7d} replied (7d)</p>
      )}
      {item.avg_score > 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Avg score: {item.avg_score}</p>
      )}
    </div>
  )
}

export function PipelineFunnel({ data, className }: PipelineFunnelProps) {
  const chartData = data
    .filter(d => !['unqualified', 'incomplete'].includes(d.status))
    .map(d => ({
      ...d,
      label: STATUS_LABELS[d.status] || d.status,
    }))

  return (
    <div
      className={`rounded-lg border p-4 ${className || ''}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <h3
        className="mb-4 text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Pipeline
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201, 178, 152, 0.05)' }} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#60A5FA'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
