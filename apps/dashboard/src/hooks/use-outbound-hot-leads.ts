import useSWR from 'swr'
import type { HotLead } from '@/lib/supabase-server'

interface HotLeadsResponse {
  data: HotLead[]
  source: string
  error?: string
}

const fetcher = async (url: string): Promise<HotLeadsResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export function useOutboundHotLeads() {
  const { data, error, isLoading, mutate } = useSWR<HotLeadsResponse>(
    '/api/outbound/hot-leads',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    hotLeads: data?.data || [],
    source: data?.source,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error,
    refresh: mutate,
  }
}
