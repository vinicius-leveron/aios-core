import { useCallback, useState } from 'react'
import useSWR from 'swr'
import type { Lead } from '@/lib/supabase-server'

interface LeadsResponse {
  data: Lead[]
  total: number
  page: number
  limit: number
  source: string
  error?: string
}

const fetcher = async (url: string): Promise<LeadsResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

interface UseOutboundLeadsOptions {
  initialPage?: number
  initialLimit?: number
}

export function useOutboundLeads(options: UseOutboundLeadsOptions = {}) {
  const { initialPage = 1, initialLimit = 20 } = options
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  })
  if (statusFilter) params.set('status', statusFilter)
  if (search) params.set('search', search)

  const { data, error, isLoading, mutate } = useSWR<LeadsResponse>(
    `/api/outbound/leads?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  const totalPages = Math.ceil((data?.total || 0) / limit)

  const handleSearch = useCallback((q: string) => {
    setSearch(q)
    setPage(1)
  }, [])

  const handleStatusFilter = useCallback((status: string | null) => {
    setStatusFilter(status)
    setPage(1)
  }, [])

  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }, [sortBy])

  return {
    leads: data?.data || [],
    total: data?.total || 0,
    page,
    totalPages,
    statusFilter,
    search,
    sortBy,
    sortOrder,
    source: data?.source,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error,
    setPage,
    setSearch: handleSearch,
    setStatusFilter: handleStatusFilter,
    handleSort,
    refresh: mutate,
  }
}
