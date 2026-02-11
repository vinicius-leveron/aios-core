'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import { LeadStatusBadge } from '@/components/outbound/lead-status-badge'
import { useOutboundLeads } from '@/hooks/use-outbound-leads'
import type { LeadStatus } from '@/lib/supabase-server'

const STATUS_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'new', label: 'Novo' },
  { value: 'enriched', label: 'Enriquecido' },
  { value: 'in_cadence', label: 'Em Cadencia' },
  { value: 'replied', label: 'Respondeu' },
  { value: 'meeting', label: 'Visita' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'won', label: 'Fechado' },
  { value: 'lost', label: 'Perdido' },
  { value: 'bounced', label: 'Bounce' },
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function LeadsPage() {
  const {
    leads, total, page, totalPages,
    statusFilter, search: searchValue,
    sortBy, sortOrder,
    isLoading,
    setPage, setSearch, setStatusFilter, handleSort,
  } = useOutboundLeads()

  const [searchInput, setSearchInput] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc'
      ? <ArrowUp className="ml-1 inline h-3 w-3" />
      : <ArrowDown className="ml-1 inline h-3 w-3" />
  }

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
            Leads
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {total} leads {statusFilter ? `(${statusFilter})` : ''}
            {searchValue ? ` buscando "${searchValue}"` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar leads..."
            className="w-full rounded-md border py-1.5 pl-8 pr-3 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </form>

        {/* Status Filter */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              onClick={() => setStatusFilter(opt.value)}
              className="rounded px-2 py-1 text-[10px] font-medium transition-luxury"
              style={{
                backgroundColor: statusFilter === opt.value ? 'var(--accent-gold-bg)' : 'transparent',
                color: statusFilter === opt.value ? 'var(--accent-gold)' : 'var(--text-muted)',
                borderColor: statusFilter === opt.value ? 'var(--border-gold)' : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderColor: 'var(--border-subtle)' }}>
              {[
                { key: 'first_name', label: 'Nome' },
                { key: 'company_name', label: 'Imobiliaria' },
                { key: 'status', label: 'Status' },
                { key: 'lead_score', label: 'Score' },
                { key: 'emails_sent', label: 'Enviados' },
                { key: 'emails_opened', label: 'Abertos' },
                { key: 'emails_replied', label: 'Respostas' },
                { key: 'source', label: 'Origem' },
                { key: 'last_contacted_at', label: 'Ultimo Contato' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer border-b px-3 py-2.5 text-left font-medium uppercase tracking-wider"
                  style={{
                    color: sortBy === col.key ? 'var(--accent-gold)' : 'var(--text-muted)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {col.label}
                  <SortIcon field={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="skeleton h-3 w-16 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  Nenhum lead encontrado
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="transition-luxury"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td className="border-b px-3 py-2.5" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
                    <div className="font-medium">{lead.first_name} {lead.last_name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{lead.email}</div>
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                    {lead.company_name || '-'}
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                    <LeadStatusBadge status={lead.status as LeadStatus} />
                  </td>
                  <td className="border-b px-3 py-2.5 tabular-nums" style={{ borderColor: 'var(--border-subtle)', color: lead.lead_score >= 50 ? '#FBBF24' : 'var(--text-secondary)' }}>
                    {lead.lead_score}
                  </td>
                  <td className="border-b px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                    {lead.emails_sent}
                  </td>
                  <td className="border-b px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                    {lead.emails_opened}
                  </td>
                  <td className="border-b px-3 py-2.5 tabular-nums" style={{ color: lead.emails_replied > 0 ? '#4ADE80' : 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                    {lead.emails_replied}
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
                    {lead.source}
                  </td>
                  <td className="border-b px-3 py-2.5 tabular-nums" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
                    {formatDate(lead.last_contacted_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Pagina {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded border p-1.5 transition-luxury disabled:opacity-30"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded border p-1.5 transition-luxury disabled:opacity-30"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
