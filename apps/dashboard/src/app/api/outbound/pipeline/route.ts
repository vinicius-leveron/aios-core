import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { MOCK_PIPELINE } from '@/lib/outbound-mock-data'

export async function GET() {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ data: MOCK_PIPELINE, source: 'mock' })
  }

  const { data, error } = await supabase
    .from('pipeline_view')
    .select('*')

  if (error) {
    return NextResponse.json({ data: MOCK_PIPELINE, source: 'mock', error: error.message })
  }

  return NextResponse.json({ data: data || [], source: 'supabase' })
}
