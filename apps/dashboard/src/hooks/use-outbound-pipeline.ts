import useSWR from 'swr'
import type { PipelineView } from '@/lib/supabase-server'

interface PipelineResponse {
  data: PipelineView[]
  source: string
  error?: string
}

const fetcher = async (url: string): Promise<PipelineResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export function useOutboundPipeline() {
  const { data, error, isLoading, mutate } = useSWR<PipelineResponse>(
    '/api/outbound/pipeline',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  const pipeline = data?.data || []
  const totalLeads = pipeline.reduce((sum, p) => sum + p.total, 0)
  const inCadence = pipeline.find(p => p.status === 'in_cadence')?.total || 0
  const replied7d = pipeline.reduce((sum, p) => sum + p.replied_7d, 0)
  const meetings = (pipeline.find(p => p.status === 'meeting')?.total || 0)

  return {
    pipeline,
    totalLeads,
    inCadence,
    replied7d,
    meetings,
    source: data?.source,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error,
    refresh: mutate,
  }
}
