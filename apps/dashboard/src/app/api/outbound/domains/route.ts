import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { MOCK_DOMAINS } from '@/lib/outbound-mock-data'

export async function GET() {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ data: MOCK_DOMAINS, source: 'mock' })
  }

  const { data, error } = await supabase
    .from('domain_health')
    .select('*')

  if (error) {
    return NextResponse.json({ data: MOCK_DOMAINS, source: 'mock', error: error.message })
  }

  return NextResponse.json({ data: data || [], source: 'supabase' })
}
