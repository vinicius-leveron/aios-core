#!/usr/bin/env node
/**
 * Outbound CRM - N8N Workflow Importer
 *
 * Imports all workflow JSON files into N8N via REST API.
 * Replaces credential placeholders with configured IDs.
 *
 * Usage:
 *   node scripts/import-workflows.js           # Import all workflows
 *   node scripts/import-workflows.js --list    # List workflows without importing
 *   node scripts/import-workflows.js --dry-run # Show what would be imported
 *
 * Requires:
 *   - N8N_URL and N8N_API_KEY in .env
 *   - Supabase and Resend credentials created in N8N UI first
 *   - SUPABASE_CREDENTIAL_ID and RESEND_CREDENTIAL_ID in .env
 */

const fs = require('fs')
const path = require('path')

const PACKAGE_DIR = path.resolve(__dirname, '..')
const WORKFLOWS_DIR = path.join(PACKAGE_DIR, 'n8n-workflows')

function loadEnv() {
  const envPath = path.join(PACKAGE_DIR, '.env')
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found. Copy .env.example to .env first.')
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

function getWorkflowFiles() {
  return fs.readdirSync(WORKFLOWS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => ({
      name: f,
      path: path.join(WORKFLOWS_DIR, f)
    }))
}

function replacePlaceholders(json, env) {
  let str = JSON.stringify(json)

  const replacements = {
    'CONFIGURE_SUPABASE_CREDENTIAL_ID': env.SUPABASE_CREDENTIAL_ID || 'NEEDS_CONFIG',
    'CONFIGURE_RESEND_CREDENTIAL_ID': env.RESEND_CREDENTIAL_ID || 'NEEDS_CONFIG',
    'CONFIGURE_SUPABASE_URL': env.SUPABASE_URL || 'NEEDS_CONFIG',
    'CONFIGURE_HUNTER_API_KEY': env.HUNTER_API_KEY || 'NEEDS_CONFIG',
    'CONFIGURE_VALIDATION_API_KEY': env.VALIDATION_API_KEY || 'NEEDS_CONFIG',
    'CONFIGURE_NOTIFICATION_WEBHOOK_URL': env.NOTIFICATION_WEBHOOK_URL || 'NEEDS_CONFIG',
    'CONFIGURE_IMAP_SETTINGS': env.IMAP_SETTINGS || 'NEEDS_CONFIG'
  }

  for (const [placeholder, value] of Object.entries(replacements)) {
    str = str.replace(new RegExp(placeholder, 'g'), value)
  }

  return JSON.parse(str)
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options)
      return response
    } catch (err) {
      if (i === retries) throw err
      const delay = Math.pow(2, i + 1) * 1000
      console.log(`  Network error, retrying in ${delay / 1000}s...`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
}

async function importWorkflow(wfData, env) {
  const n8nUrl = env.N8N_URL.replace(/\/$/, '')
  const apiKey = env.N8N_API_KEY

  // Remove id if present to let N8N generate a new one
  const { id, ...workflowBody } = wfData

  const response = await fetchWithRetry(`${n8nUrl}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey
    },
    body: JSON.stringify(workflowBody)
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`)
  }

  return body
}

async function activateWorkflow(workflowId, env) {
  const n8nUrl = env.N8N_URL.replace(/\/$/, '')

  const response = await fetchWithRetry(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': env.N8N_API_KEY
    },
    body: JSON.stringify({ active: true })
  })

  return response.ok
}

async function main() {
  const args = process.argv.slice(2)
  const listOnly = args.includes('--list')
  const dryRun = args.includes('--dry-run')

  const env = loadEnv()
  const files = getWorkflowFiles()

  console.log(`Found ${files.length} workflow files\n`)

  if (listOnly) {
    for (const f of files) {
      const data = JSON.parse(fs.readFileSync(f.path, 'utf8'))
      console.log(`  ${f.name} -> "${data.name}"`)
    }
    return
  }

  if (!env.N8N_URL || !env.N8N_API_KEY) {
    console.error('N8N_URL and N8N_API_KEY required in .env')
    process.exit(1)
  }

  const results = { success: 0, failed: 0, skipped: 0 }

  for (const f of files) {
    const rawData = JSON.parse(fs.readFileSync(f.path, 'utf8'))
    const data = replacePlaceholders(rawData, env)

    process.stdout.write(`${f.name} ("${data.name}")... `)

    if (dryRun) {
      const needsConfig = JSON.stringify(data).includes('NEEDS_CONFIG')
      console.log(needsConfig ? 'READY (has unconfigured placeholders)' : 'READY')
      continue
    }

    try {
      const result = await importWorkflow(data, env)
      console.log(`OK (id: ${result.id})`)

      // Try to activate (some workflows like webhook-triggered may not auto-activate)
      try {
        const activated = await activateWorkflow(result.id, env)
        if (activated) {
          console.log(`  Activated: ${result.id}`)
        }
      } catch {
        console.log(`  Note: Could not auto-activate (activate manually in N8N UI)`)
      }

      results.success++
    } catch (err) {
      console.log(`FAILED`)
      console.error(`  Error: ${err.message}`)
      results.failed++
    }
  }

  console.log(`\nResults: ${results.success} imported, ${results.failed} failed`)

  if (results.failed > 0) {
    console.log('\nNote: Failed workflows may need manual import via N8N UI.')
    console.log('  1. Open N8N > Workflows > Import from file')
    console.log(`  2. Select JSON files from: ${WORKFLOWS_DIR}`)
  }

  if (!env.SUPABASE_CREDENTIAL_ID || !env.RESEND_CREDENTIAL_ID) {
    console.log('\nImportant: Credential IDs not configured.')
    console.log('  1. Create Supabase and Resend credentials in N8N UI')
    console.log('  2. Copy the credential IDs')
    console.log('  3. Add to .env: SUPABASE_CREDENTIAL_ID=... RESEND_CREDENTIAL_ID=...')
    console.log('  4. Re-run this script or update credentials in each workflow')
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
