import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { MOCK_ACTIVITY } from '@/lib/outbound-mock-data'

export async function GET() {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ data: MOCK_ACTIVITY, source: 'mock' })
  }

  const { data, error } = await supabase
    .from('interactions')
    .select('id, lead_id, type, channel, subject, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ data: MOCK_ACTIVITY, source: 'mock', error: error.message })
  }

  return NextResponse.json({ data: data || [], source: 'supabase' })
}
