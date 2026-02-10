import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { MOCK_CADENCES } from '@/lib/outbound-mock-data'

export async function GET() {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ data: MOCK_CADENCES, source: 'mock' })
  }

  const { data, error } = await supabase
    .from('cadence_performance')
    .select('*')

  if (error) {
    return NextResponse.json({ data: MOCK_CADENCES, source: 'mock', error: error.message })
  }

  return NextResponse.json({ data: data || [], source: 'supabase' })
}
