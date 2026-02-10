#!/usr/bin/env node
/**
 * Outbound CRM - Resend Email Test
 *
 * Sends a test email via Resend API to verify credentials and deliverability.
 *
 * Usage:
 *   node scripts/test-resend.js                          # Uses TEST_EMAIL from .env
 *   node scripts/test-resend.js viniciusoliveirap98@gmail.com  # Override recipient
 */

const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found')
    process.exit(1)
  }
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim()
  }
  return env
}

async function main() {
  const env = loadEnv()
  const recipient = process.argv[2] || env.TEST_EMAIL

  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not found in .env')
    process.exit(1)
  }

  if (!recipient) {
    console.error('No recipient email. Set TEST_EMAIL in .env or pass as argument.')
    process.exit(1)
  }

  console.log(`Testing Resend API...`)
  console.log(`  API Key: ${env.RESEND_API_KEY.substring(0, 10)}...`)
  console.log(`  Recipient: ${recipient}`)
  console.log('')

  // Step 1: Check domains
  console.log('Step 1: Checking configured domains...')
  const domainsRes = await fetch('https://api.resend.com/domains', {
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}` }
  })

  if (domainsRes.ok) {
    const domains = await domainsRes.json()
    if (domains.data && domains.data.length > 0) {
      for (const d of domains.data) {
        console.log(`  Domain: ${d.name} (status: ${d.status})`)
      }
    } else {
      console.log('  No custom domains configured. Using onboarding@resend.dev')
    }
  } else {
    console.log(`  Could not fetch domains (HTTP ${domainsRes.status})`)
  }

  // Step 2: Send test email
  console.log('\nStep 2: Sending test email...')

  const emailBody = {
    from: 'Outbound CRM Test <onboarding@resend.dev>',
    to: [recipient],
    subject: 'Outbound CRM - Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Outbound CRM - Email Test</h2>
        <p>Este email confirma que o Resend API esta configurado corretamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Timestamp</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toISOString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>API Key</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${env.RESEND_API_KEY.substring(0, 10)}...</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Recipient</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${recipient}</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 12px;">Leveron Outbound CRM | Deploy Test</p>
      </div>
    `
  }

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailBody)
  })

  const result = await sendRes.json()

  if (sendRes.ok) {
    console.log(`  Email sent successfully!`)
    console.log(`  ID: ${result.id}`)
    console.log(`\n  Check inbox: ${recipient}`)
  } else {
    console.error(`  Failed to send (HTTP ${sendRes.status})`)
    console.error(`  Error: ${JSON.stringify(result)}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
