// Supabase Edge Function: Email Tracking (Open Pixel + Click Redirect)
// Deployed at: /functions/v1/track
//
// Endpoints:
//   GET /track/open?lid={lead_id}&eid={email_id}   → 1x1 transparent pixel
//   GET /track/click?lid={lead_id}&eid={email_id}&url={encoded_url} → 302 redirect
//
// Usage in email HTML:
//   Open tracking:  <img src="https://{PROJECT}.supabase.co/functions/v1/track/open?lid=xxx&eid=yyy" width="1" height="1" />
//   Click tracking: <a href="https://{PROJECT}.supabase.co/functions/v1/track/click?lid=xxx&eid=yyy&url=https%3A%2F%2Fexample.com">Link</a>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
  0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
])

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  // Expected: /functions/v1/track/{action}
  const action = pathParts[pathParts.length - 1]

  const leadId = url.searchParams.get('lid')
  const emailId = url.searchParams.get('eid')

  if (!leadId) {
    // Return pixel anyway to not break email rendering
    if (action === 'open') {
      return new Response(TRANSPARENT_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          ...CORS_HEADERS,
        },
      })
    }
    return new Response('Missing lead_id', { status: 400 })
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Extract tracking metadata
  const userAgent = req.headers.get('user-agent') ?? ''
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? ''

  try {
    if (action === 'open') {
      // Record open event (fire and forget - don't block pixel response)
      const trackingPromise = recordEvent(supabase, {
        leadId,
        emailId,
        event: 'open',
        userAgent,
        ipAddress,
      })

      // Don't await - return pixel immediately
      trackingPromise.catch((err) =>
        console.error('Failed to record open event:', err)
      )

      return new Response(TRANSPARENT_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...CORS_HEADERS,
        },
      })
    }

    if (action === 'click') {
      const targetUrl = url.searchParams.get('url')

      if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 })
      }

      // Validate URL to prevent open redirect
      let parsedUrl: URL
      try {
        parsedUrl = new URL(decodeURIComponent(targetUrl))
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return new Response('Invalid URL protocol', { status: 400 })
        }
      } catch {
        return new Response('Invalid URL', { status: 400 })
      }

      // Record click event (fire and forget - don't block redirect)
      const trackingPromise = recordEvent(supabase, {
        leadId,
        emailId,
        event: 'click',
        linkUrl: parsedUrl.toString(),
        userAgent,
        ipAddress,
      })

      trackingPromise.catch((err) =>
        console.error('Failed to record click event:', err)
      )

      return new Response(null, {
        status: 302,
        headers: {
          'Location': parsedUrl.toString(),
          'Cache-Control': 'no-store, no-cache',
          ...CORS_HEADERS,
        },
      })
    }

    return new Response('Unknown action. Use /open or /click', { status: 404 })
  } catch (err) {
    console.error('Tracking error:', err)

    // Always return a valid response even on error
    if (action === 'open') {
      return new Response(TRANSPARENT_PIXEL, {
        status: 200,
        headers: { 'Content-Type': 'image/gif', ...CORS_HEADERS },
      })
    }

    return new Response('Internal error', { status: 500, headers: CORS_HEADERS })
  }
})

interface TrackingEvent {
  leadId: string
  emailId: string | null
  event: 'open' | 'click'
  linkUrl?: string
  userAgent: string
  ipAddress: string
}

async function recordEvent(
  supabase: ReturnType<typeof createClient>,
  event: TrackingEvent,
) {
  const now = new Date().toISOString()

  // 1. Insert interaction record
  const { error: interactionError } = await supabase
    .from('interactions')
    .insert({
      lead_id: event.leadId,
      type: event.event === 'open' ? 'email_opened' : 'email_clicked',
      channel: 'email',
      metadata: {
        email_id: event.emailId,
        link_url: event.linkUrl || null,
        user_agent: event.userAgent,
        ip_address: event.ipAddress,
        tracked_at: now,
      },
    })

  if (interactionError) {
    console.error('Failed to insert interaction:', interactionError)
  }

  // 2. Increment lead counter (atomic via RPC)
  // NOTE: Requires creating an RPC function in Supabase:
  //
  // CREATE OR REPLACE FUNCTION increment_lead_counter(
  //   p_lead_id UUID,
  //   p_field TEXT
  // ) RETURNS void AS $$
  // BEGIN
  //   EXECUTE format(
  //     'UPDATE leads SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
  //     p_field, p_field
  //   ) USING p_lead_id;
  // END;
  // $$ LANGUAGE plpgsql SECURITY DEFINER;
  //
  const counterField = event.event === 'open' ? 'emails_opened' : 'emails_clicked'

  const { error: rpcError } = await supabase
    .rpc('increment_lead_counter', {
      p_lead_id: event.leadId,
      p_field: counterField,
    })

  if (rpcError) {
    // Fallback: direct update (non-atomic, but works without RPC)
    console.warn('RPC failed, using fallback update:', rpcError)
    const { data: lead } = await supabase
      .from('leads')
      .select(counterField)
      .eq('id', event.leadId)
      .single()

    if (lead) {
      const currentValue = (lead as Record<string, number>)[counterField] || 0
      await supabase
        .from('leads')
        .update({ [counterField]: currentValue + 1 })
        .eq('id', event.leadId)
    }
  }

  // 3. Forward to N8N for further processing (scoring, etc.)
  const n8nWebhookUrl = Deno.env.get('N8N_TRACKING_WEBHOOK_URL')
  if (n8nWebhookUrl) {
    try {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: event.leadId,
          email_id: event.emailId,
          event: event.event,
          link_url: event.linkUrl,
          user_agent: event.userAgent,
          ip_address: event.ipAddress,
          timestamp: now,
        }),
      })
    } catch (err) {
      console.error('Failed to forward to N8N:', err)
    }
  }
}
