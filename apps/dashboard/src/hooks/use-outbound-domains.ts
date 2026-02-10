import useSWR from 'swr'
import type { DomainHealth } from '@/lib/supabase-server'

interface DomainsResponse {
  data: DomainHealth[]
  source: string
  error?: string
}

const fetcher = async (url: string): Promise<DomainsResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export function useOutboundDomains() {
  const { data, error, isLoading, mutate } = useSWR<DomainsResponse>(
    '/api/outbound/domains',
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  return {
    domains: data?.data || [],
    source: data?.source,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error,
    refresh: mutate,
  }
}
