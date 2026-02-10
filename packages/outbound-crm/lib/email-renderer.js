/**
 * Email Template Renderer
 *
 * Renders email templates with:
 * - Variable interpolation ({{first_name}}, {{company_name}}, etc.)
 * - Open tracking pixel (1x1 GIF via Edge Function)
 * - Click tracking (wraps all <a> hrefs through Edge Function)
 * - List-Unsubscribe header generation
 * - HTML wrapper with responsive design for email clients
 * - Plain-text fallback generation
 *
 * Usage (Node.js / N8N Code node):
 *
 *   const { renderEmail } = require('./email-renderer')
 *
 *   const result = renderEmail({
 *     template: {
 *       subject: '{{company_name}} - pergunta rapida',
 *       body: 'Ola {{first_name}}, vi que o {{company_name}}...',
 *     },
 *     lead: {
 *       id: 'uuid-123',
 *       first_name: 'Carlos',
 *       last_name: 'Silva',
 *       company_name: 'Silva & Associados',
 *       email: 'carlos@silva.adv.br',
 *     },
 *     config: {
 *       trackingBaseUrl: 'https://project.supabase.co/functions/v1/track',
 *       unsubscribeBaseUrl: 'https://project.supabase.co/functions/v1/unsubscribe',
 *       senderName: 'Equipe Leveron',
 *       senderEmail: 'contato@leveron-tech.com',
 *     },
 *     emailId: 'email-uuid-456',
 *   })
 *
 *   // result.subject -> 'Silva & Associados - pergunta rapida'
 *   // result.html    -> Full HTML email with tracking
 *   // result.text    -> Plain-text version
 *   // result.headers -> { 'List-Unsubscribe': '...', 'List-Unsubscribe-Post': '...' }
 */

/**
 * Interpolate {{variables}} in template string
 */
function interpolateVariables(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match
  })
}

/**
 * Wrap all URLs in body text with click tracking
 * Matches http/https URLs not already wrapped
 */
function wrapLinksForTracking(htmlBody, trackingBaseUrl, leadId, emailId) {
  const urlRegex = /href="(https?:\/\/[^"]+)"/g

  return htmlBody.replace(urlRegex, (match, url) => {
    // Don't wrap tracking/unsubscribe URLs (prevent infinite loops)
    if (url.includes('/track/') || url.includes('/unsubscribe')) {
      return match
    }

    const trackedUrl = `${trackingBaseUrl}/click?lid=${leadId}&eid=${emailId}&url=${encodeURIComponent(url)}`
    return `href="${trackedUrl}"`
  })
}

/**
 * Convert plain-text body to simple HTML paragraphs
 */
function textToHtml(text) {
  return text
    .split('\n\n')
    .map(para => {
      const lines = para.split('\n').map(line => {
        // Convert markdown-style bullets
        if (line.trim().startsWith('- ')) {
          return `<li>${line.trim().substring(2)}</li>`
        }
        return line
      })

      // If paragraph contains list items, wrap in <ul>
      if (lines.some(l => l.startsWith('<li>'))) {
        return `<ul>${lines.join('\n')}</ul>`
      }

      return `<p>${lines.join('<br>\n')}</p>`
    })
    .join('\n')
}

/**
 * Strip HTML for plain-text version
 */
function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Generate full HTML email wrapper
 */
function wrapInHtmlEmail(bodyHtml, config) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title></title>
  <!--[if mso]>
  <style>body{font-family:Arial,sans-serif !important;}</style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    .email-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .email-body p { margin: 0 0 16px 0; }
    .email-body ul { margin: 0 0 16px 0; padding-left: 20px; }
    .email-body li { margin-bottom: 6px; }
    .email-body a { color: #1a73e8; text-decoration: none; }
    .email-body a:hover { text-decoration: underline; }
    .email-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
    .email-footer a { color: #666; }
  </style>
</head>
<body>
  <div class="email-body">
    ${bodyHtml}
    <div class="email-footer">
      <p>
        ${config.senderName}<br>
        <a href="mailto:${config.senderEmail}">${config.senderEmail}</a>
      </p>
      <p>
        <a href="${config.unsubscribeUrl}">Nao desejo receber mais emails</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Main render function
 */
function renderEmail({ template, lead, config, emailId }) {
  // Build variables map from lead data
  const variables = {
    first_name: lead.first_name || '',
    last_name: lead.last_name || '',
    full_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
    company_name: lead.company_name || '',
    role: lead.role || '',
    email: lead.email || '',
    city: lead.city || '',
    industry: lead.industry || 'juridica',
    ...(lead.custom_fields || {}),
  }

  // Interpolate subject
  const subject = interpolateVariables(template.subject, variables)

  // Interpolate body
  const bodyText = interpolateVariables(template.body, variables)

  // Build tracking URLs
  const trackingBaseUrl = config.trackingBaseUrl.replace(/\/$/, '')
  const openPixelUrl = `${trackingBaseUrl}/open?lid=${lead.id}&eid=${emailId}`
  const unsubscribeUrl = `${config.unsubscribeBaseUrl}?lid=${lead.id}&email=${encodeURIComponent(lead.email)}`

  // Convert text body to HTML
  let bodyHtml = textToHtml(bodyText)

  // Wrap links with click tracking
  bodyHtml = wrapLinksForTracking(bodyHtml, trackingBaseUrl, lead.id, emailId)

  // Add open tracking pixel (invisible 1x1)
  const trackingPixel = `<img src="${openPixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`

  // Build full HTML email
  const fullConfig = { ...config, unsubscribeUrl }
  const html = wrapInHtmlEmail(bodyHtml + trackingPixel, fullConfig)

  // Generate plain-text version
  const text = `${bodyText}\n\n---\n${config.senderName}\n${config.senderEmail}\n\nPara nao receber mais emails: ${unsubscribeUrl}`

  // Generate email headers
  const headers = {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'X-Entity-Ref-ID': emailId,
  }

  return {
    subject,
    html,
    text,
    headers,
    metadata: {
      lead_id: lead.id,
      email_id: emailId,
      template_step: template.step_number,
      template_version: template.version,
      rendered_at: new Date().toISOString(),
    },
  }
}

/**
 * Render for Resend API payload format
 */
function renderForResend({ template, lead, config, emailId, fromEmail, fromName }) {
  const rendered = renderEmail({ template, lead, config, emailId })

  return {
    from: `${fromName || config.senderName} <${fromEmail || config.senderEmail}>`,
    to: [lead.email],
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    headers: rendered.headers,
    tags: [
      { name: 'lead_id', value: lead.id },
      { name: 'email_id', value: emailId },
      { name: 'cadence_step', value: String(template.step_number) },
    ],
  }
}

module.exports = { renderEmail, renderForResend, interpolateVariables, textToHtml, htmlToPlainText }
