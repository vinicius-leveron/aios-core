import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { MOCK_HOT_LEADS } from '@/lib/outbound-mock-data'

export async function GET() {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ data: MOCK_HOT_LEADS, source: 'mock' })
  }

  const { data, error } = await supabase
    .from('hot_leads')
    .select('*')

  if (error) {
    return NextResponse.json({ data: MOCK_HOT_LEADS, source: 'mock', error: error.message })
  }

  return NextResponse.json({ data: data || [], source: 'supabase' })
}
