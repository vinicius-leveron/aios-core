'use client'

import { DomainHealthCard } from '@/components/outbound/domain-health-card'
import { useOutboundDomains } from '@/hooks/use-outbound-domains'

export default function DomainsPage() {
  const { domains, isLoading } = useOutboundDomains()

  const healthyCt = domains.filter(d => d.health_status === 'healthy').length
  const warningCt = domains.filter(d => d.health_status === 'warning').length
  const criticalCt = domains.filter(d => d.health_status === 'critical').length
  const totalSent = domains.reduce((sum, d) => sum + d.sent_today, 0)
  const totalLimit = domains.reduce((sum, d) => sum + d.daily_limit, 0)

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
          Saude dos Dominios
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Status dos dominios de envio de email e progresso de warmup
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Total Dominios" value={domains.length.toString()} color="var(--text-primary)" />
        <SummaryCard label="Saudaveis" value={healthyCt.toString()} color="#4ADE80" />
        <SummaryCard label="Alerta" value={warningCt.toString()} color="#FBBF24" />
        <SummaryCard
          label="Capacidade Diaria"
          value={`${totalSent}/${totalLimit}`}
          color="var(--text-secondary)"
          subtitle={totalLimit > 0 ? `${Math.round((totalSent / totalLimit) * 100)}% utilizado` : ''}
        />
      </div>

      {criticalCt > 0 && (
        <div
          className="rounded-lg border px-4 py-3 text-xs"
          style={{
            backgroundColor: 'rgba(248, 113, 113, 0.08)',
            borderColor: 'rgba(248, 113, 113, 0.3)',
            color: '#F87171',
          }}
        >
          {criticalCt} dominio{criticalCt > 1 ? 's' : ''} em status critico. Verifique reputacao e taxas de bounce.
        </div>
      )}

      {/* Domain Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-lg" />
          ))}
        </div>
      ) : domains.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Nenhum dominio de email configurado ainda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {domains.map((domain) => (
            <DomainHealthCard key={domain.domain} domain={domain} />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color, subtitle }: {
  label: string
  value: string
  color: string
  subtitle?: string
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="text-2xl font-light tabular-nums" style={{ color }}>
        {value}
      </div>
      {subtitle && (
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
      )}
    </div>
  )
}
