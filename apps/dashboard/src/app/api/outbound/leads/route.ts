import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { MOCK_LEADS } from '@/lib/outbound-mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const supabase = getSupabase()

  if (!supabase) {
    let filtered = [...MOCK_LEADS]
    if (status) filtered = filtered.filter(l => l.status === status)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(l =>
        l.first_name.toLowerCase().includes(q) ||
        (l.last_name?.toLowerCase().includes(q)) ||
        (l.company_name?.toLowerCase().includes(q)) ||
        (l.email?.toLowerCase().includes(q))
      )
    }
    const total = filtered.length
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)
    return NextResponse.json({ data: paginated, total, page, limit, source: 'mock' })
  }

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const ascending = sortOrder === 'asc'
  query = query.order(sortBy, { ascending })
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ data: MOCK_LEADS, total: MOCK_LEADS.length, page, limit, source: 'mock', error: error.message })
  }

  return NextResponse.json({ data: data || [], total: count || 0, page, limit, source: 'supabase' })
}
