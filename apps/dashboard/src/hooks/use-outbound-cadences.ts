import useSWR from 'swr'
import type { CadencePerformance } from '@/lib/supabase-server'

interface CadencesResponse {
  data: CadencePerformance[]
  source: string
  error?: string
}

const fetcher = async (url: string): Promise<CadencesResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export function useOutboundCadences() {
  const { data, error, isLoading, mutate } = useSWR<CadencesResponse>(
    '/api/outbound/cadences',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    cadences: data?.data || [],
    source: data?.source,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error,
    refresh: mutate,
  }
}
