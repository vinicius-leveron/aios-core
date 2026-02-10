// Supabase Edge Function: Unsubscribe / Opt-Out (LGPD Compliance)
// Deployed at: /functions/v1/unsubscribe
//
// Endpoints:
//   GET  /unsubscribe?lid={lead_id}&email={email}  → Confirmation page
//   POST /unsubscribe?lid={lead_id}&email={email}  → Process opt-out (One-Click)
//
// Supports:
//   - One-Click List-Unsubscribe (RFC 8058) via POST
//   - Manual opt-out via GET (shows confirmation, then redirects)
//   - LGPD compliant: removes lead from active cadences, logs opt-out

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const leadId = url.searchParams.get('lid')
  const email = url.searchParams.get('email')

  if (!leadId && !email) {
    return new Response(renderPage('error', 'Link invalido.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  // POST: One-Click Unsubscribe (from email client)
  if (req.method === 'POST') {
    await processOptOut(supabase, leadId, email)
    return new Response(renderPage('success'), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    })
  }

  // GET: Show confirmation page
  if (req.method === 'GET') {
    const confirmed = url.searchParams.get('confirmed')

    if (confirmed === 'true') {
      await processOptOut(supabase, leadId, email)
      return new Response(renderPage('success'), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
      })
    }

    // Show confirmation page
    const confirmUrl = `${url.origin}${url.pathname}?lid=${leadId}&email=${encodeURIComponent(email || '')}&confirmed=true`
    return new Response(renderPage('confirm', '', confirmUrl), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    })
  }

  return new Response('Method not allowed', { status: 405 })
})

async function processOptOut(
  supabase: ReturnType<typeof createClient>,
  leadId: string | null,
  email: string | null,
) {
  try {
    // Find lead by ID or email
    let query = supabase.from('leads').select('id, email, status')

    if (leadId) {
      query = query.eq('id', leadId)
    } else if (email) {
      query = query.eq('email', decodeURIComponent(email))
    }

    const { data: leads, error: findError } = await query.limit(1)

    if (findError) {
      console.error('Failed to find lead:', findError)
      return
    }

    if (!leads || leads.length === 0) {
      console.warn(`Opt-out requested but lead not found: lid=${leadId}, email=${email}`)
      return
    }

    const lead = leads[0]

    // Update lead status to opted_out
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'opted_out',
        cadence_paused: true,
        custom_fields: supabase.rpc ? undefined : {}, // Will merge via RPC if available
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('Failed to update lead:', updateError)
    }

    // Log opt-out interaction
    const { error: interactionError } = await supabase
      .from('interactions')
      .insert({
        lead_id: lead.id,
        type: 'opted_out',
        channel: 'email',
        metadata: {
          method: leadId ? 'link_click' : 'email_match',
          opted_out_at: new Date().toISOString(),
          previous_status: lead.status,
        },
      })

    if (interactionError) {
      console.error('Failed to log opt-out interaction:', interactionError)
    }

    console.log(`Lead ${lead.id} (${lead.email}) opted out successfully`)
  } catch (err) {
    console.error('Opt-out processing error:', err)
  }
}

function renderPage(type: 'confirm' | 'success' | 'error', message = '', actionUrl = ''): string {
  const baseStyle = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
    .container { max-width: 480px; margin: 60px auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { font-size: 16px; line-height: 1.5; color: #666; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500; cursor: pointer; border: none; }
    .btn-primary { background: #e53935; color: white; }
    .btn-primary:hover { background: #c62828; }
    .btn-secondary { background: #e0e0e0; color: #333; margin-left: 8px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
  `

  if (type === 'confirm') {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cancelar inscricao</title><style>${baseStyle}</style></head><body>
      <div class="container">
        <div class="icon">&#9993;</div>
        <h1>Cancelar recebimento de emails</h1>
        <p>Voce tem certeza que deseja parar de receber nossos emails? Respeitamos sua decisao.</p>
        <a href="${actionUrl}" class="btn btn-primary">Sim, cancelar</a>
      </div>
    </body></html>`
  }

  if (type === 'success') {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inscricao cancelada</title><style>${baseStyle}</style></head><body>
      <div class="container">
        <div class="icon">&#10003;</div>
        <h1>Inscricao cancelada</h1>
        <p>Voce nao recebera mais emails nossos. Se mudar de ideia, entre em contato conosco.</p>
        <p style="font-size:13px;color:#999;">Pode fechar esta pagina.</p>
      </div>
    </body></html>`
  }

  // error
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Erro</title><style>${baseStyle}</style></head><body>
    <div class="container">
      <div class="icon">&#9888;</div>
      <h1>Algo deu errado</h1>
      <p>${message || 'Nao foi possivel processar sua solicitacao. Tente novamente.'}</p>
    </div>
  </body></html>`
}
