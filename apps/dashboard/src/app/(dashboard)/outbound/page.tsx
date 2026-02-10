'use client'

import { Users, Mail, MessageSquare, Target } from 'lucide-react'
import { MetricCard } from '@/components/outbound/metric-card'
import { PipelineFunnel } from '@/components/outbound/pipeline-funnel'
import { HotLeadsList } from '@/components/outbound/hot-leads-list'
import { ActivityFeed } from '@/components/outbound/activity-feed'
import { DomainHealthCard } from '@/components/outbound/domain-health-card'
import { useOutboundPipeline } from '@/hooks/use-outbound-pipeline'
import { useOutboundHotLeads } from '@/hooks/use-outbound-hot-leads'
import { useOutboundActivity } from '@/hooks/use-outbound-activity'
import { useOutboundDomains } from '@/hooks/use-outbound-domains'

export default function OutboundPage() {
  const { pipeline, totalLeads, inCadence, replied7d, meetings, isLoading: pipelineLoading } = useOutboundPipeline()
  const { hotLeads, isLoading: hotLeadsLoading } = useOutboundHotLeads()
  const { activity, isLoading: activityLoading } = useOutboundActivity()
  const { domains, isLoading: domainsLoading } = useOutboundDomains()

  const isLoading = pipelineLoading || hotLeadsLoading || activityLoading || domainsLoading

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
            Outbound
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Leveron &rarr; Escritorios de Advocacia
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: 'var(--accent-gold)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Loading...</span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          subtitle="in CRM"
          icon={Users}
        />
        <MetricCard
          title="In Cadence"
          value={inCadence}
          subtitle="active sequences"
          icon={Mail}
        />
        <MetricCard
          title="Replied (7d)"
          value={replied7d}
          subtitle="this week"
          icon={MessageSquare}
        />
        <MetricCard
          title="Meetings"
          value={meetings}
          subtitle="booked"
          icon={Target}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: Pipeline Chart */}
        <div className="col-span-2">
          <PipelineFunnel data={pipeline} />
        </div>

        {/* Right: Hot Leads */}
        <div>
          <HotLeadsList leads={hotLeads} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="col-span-2">
          <ActivityFeed activity={activity} />
        </div>

        {/* Domain Health Summary */}
        <div className="space-y-3">
          <h3
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Domain Health
          </h3>
          {domains.map((domain) => (
            <DomainHealthCard key={domain.domain} domain={domain} />
          ))}
          {domains.length === 0 && (
            <div
              className="rounded-lg border p-4 text-center text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              No domains configured
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
