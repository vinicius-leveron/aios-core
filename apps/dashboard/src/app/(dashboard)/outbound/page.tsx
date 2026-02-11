'use client'

import { Users, Mail, MessageSquare, Building2 } from 'lucide-react'
import { MetricCard } from '@/components/outbound/metric-card'
import { PipelineFunnel } from '@/components/outbound/pipeline-funnel'
import { HotLeadsList } from '@/components/outbound/hot-leads-list'
import { ActivityFeed } from '@/components/outbound/activity-feed'
import { DomainHealthCard } from '@/components/outbound/domain-health-card'
import { useOutboundPipeline } from '@/hooks/use-outbound-pipeline'
import { useOutboundHotLeads } from '@/hooks/use-outbound-hot-leads'
import { useOutboundActivity } from '@/hooks/use-outbound-activity'
import { useOutboundDomains } from '@/hooks/use-outbound-domains'

export default function DashboardPage() {
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
            Dashboard
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Leveron CRM &rarr; Imobiliarias
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: 'var(--accent-gold)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Carregando...</span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          subtitle="no CRM"
          icon={Users}
        />
        <MetricCard
          title="Em Cadencia"
          value={inCadence}
          subtitle="sequencias ativas"
          icon={Mail}
        />
        <MetricCard
          title="Responderam (7d)"
          value={replied7d}
          subtitle="esta semana"
          icon={MessageSquare}
        />
        <MetricCard
          title="Visitas Agendadas"
          value={meetings}
          subtitle="agendadas"
          icon={Building2}
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
            Saude dos Dominios
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
              Nenhum dominio configurado
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
