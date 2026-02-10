'use client'

import { useOutboundCadences } from '@/hooks/use-outbound-cadences'

export default function CadencesPage() {
  const { cadences, isLoading } = useOutboundCadences()

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
          Cadence Performance
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Email sequence performance by cadence
        </p>
      </div>

      {/* Cadence Cards */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-lg" />
          ))}
        </div>
      ) : cadences.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No cadences configured yet
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cadences.map((cadence) => (
            <div
              key={cadence.cadence_name}
              className="rounded-lg border p-5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Title */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {cadence.cadence_name}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {cadence.icp_name} &middot; {cadence.channel}
                  </p>
                </div>
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
                  style={{
                    backgroundColor: 'var(--accent-gold-bg)',
                    color: 'var(--accent-gold)',
                  }}
                >
                  {cadence.total_leads} leads
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-5 gap-4">
                <MetricBlock
                  label="Total Leads"
                  value={cadence.total_leads.toString()}
                  color="var(--text-primary)"
                />
                <MetricBlock
                  label="Contacted"
                  value={cadence.leads_contacted.toString()}
                  color="var(--text-secondary)"
                />
                <MetricBlock
                  label="Opened"
                  value={cadence.leads_opened.toString()}
                  subvalue={cadence.open_rate > 0 ? `${cadence.open_rate}%` : '-'}
                  color="#34D399"
                />
                <MetricBlock
                  label="Replied"
                  value={cadence.leads_replied.toString()}
                  subvalue={cadence.reply_rate > 0 ? `${cadence.reply_rate}%` : '-'}
                  color="#FBBF24"
                />
                <MetricBlock
                  label="Conversion"
                  value={cadence.total_leads > 0
                    ? `${((cadence.leads_replied / cadence.total_leads) * 100).toFixed(1)}%`
                    : '0%'}
                  color="#EC4899"
                />
              </div>

              {/* Funnel Progress Bar */}
              <div className="mt-4">
                <div className="flex gap-0.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  {cadence.total_leads > 0 && (
                    <>
                      <div
                        className="h-2 transition-luxury"
                        style={{
                          width: `${(cadence.leads_contacted / cadence.total_leads) * 100}%`,
                          backgroundColor: '#60A5FA',
                        }}
                        title={`${cadence.leads_contacted} contacted`}
                      />
                      <div
                        className="h-2 transition-luxury"
                        style={{
                          width: `${(cadence.leads_opened / cadence.total_leads) * 100}%`,
                          backgroundColor: '#34D399',
                        }}
                        title={`${cadence.leads_opened} opened`}
                      />
                      <div
                        className="h-2 transition-luxury"
                        style={{
                          width: `${(cadence.leads_replied / cadence.total_leads) * 100}%`,
                          backgroundColor: '#FBBF24',
                        }}
                        title={`${cadence.leads_replied} replied`}
                      />
                    </>
                  )}
                </div>
                <div className="mt-1.5 flex gap-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#60A5FA' }} />
                    Contacted
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#34D399' }} />
                    Opened
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#FBBF24' }} />
                    Replied
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricBlock({ label, value, subvalue, color }: {
  label: string
  value: string
  subvalue?: string
  color: string
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="text-xl font-light tabular-nums" style={{ color }}>
        {value}
      </div>
      {subvalue && (
        <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {subvalue}
        </span>
      )}
    </div>
  )
}
