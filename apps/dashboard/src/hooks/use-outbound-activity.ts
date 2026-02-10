import useSWR from 'swr'
import type { Interaction } from '@/lib/supabase-server'

interface ActivityResponse {
  data: Interaction[]
  source: string
  error?: string
}

const fetcher = async (url: string): Promise<ActivityResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export function useOutboundActivity() {
  const { data, error, isLoading, mutate } = useSWR<ActivityResponse>(
    '/api/outbound/activity',
    fetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    activity: data?.data || [],
    source: data?.source,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error,
    refresh: mutate,
  }
}
