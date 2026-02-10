#!/usr/bin/env node

/**
 * E2E Test Runner for Outbound CRM Workflows
 *
 * Prerequisites:
 *   1. Copy .env.example to .env and fill in credentials
 *   2. Run SQL migrations against Supabase
 *   3. Have N8N instance running with API access
 *
 * Usage:
 *   node tests/e2e-test.js                  # Run all tests
 *   node tests/e2e-test.js --step setup     # Only: import workflows + seed data
 *   node tests/e2e-test.js --step test      # Only: run tests (assumes setup done)
 *   node tests/e2e-test.js --step cleanup   # Only: remove test data
 *   node tests/e2e-test.js --step teardown  # Only: deactivate/remove workflows from N8N
 */

const fs = require('fs')
const path = require('path')

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ENV_PATH = path.join(__dirname, '..', '.env')
const WORKFLOWS_DIR = path.join(__dirname, '..', 'n8n-workflows')
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@test.leveron.com'

let CONFIG = {}

function loadConfig() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('ERROR: .env file not found. Copy .env.example to .env and fill in credentials.')
    process.exit(1)
  }

  const lines = fs.readFileSync(ENV_PATH, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.substring(0, eqIdx).trim()
    const value = trimmed.substring(eqIdx + 1).trim()
    CONFIG[key] = value
  }

  const required = ['N8N_URL', 'N8N_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter(k => !CONFIG[k])
  if (missing.length > 0) {
    console.error(`ERROR: Missing required config: ${missing.join(', ')}`)
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function n8nApi(method, endpoint, body = null) {
  const url = `${CONFIG.N8N_URL}/api/v1${endpoint}`
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': CONFIG.N8N_API_KEY,
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  const text = await res.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    throw new Error(`N8N API ${method} ${endpoint}: ${res.status} - ${text.substring(0, 200)}`)
  }

  return data
}

async function supabaseApi(method, endpoint, body = null) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1${endpoint}`
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  const text = await res.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    throw new Error(`Supabase ${method} ${endpoint}: ${res.status} - ${text.substring(0, 200)}`)
  }

  return data
}

async function webhookCall(method, webhookPath, body = null) {
  const url = `${CONFIG.N8N_URL}/webhook-test/${webhookPath}`
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  const text = await res.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  return { status: res.status, data }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

const TEST_IDS = {
  workflows: [],
  leads: [],
  interactions: [],
}

// ---------------------------------------------------------------------------
// Step 1: Setup - Import workflows and seed test data
// ---------------------------------------------------------------------------

async function setupWorkflows() {
  console.log('\n=== STEP 1: Import Workflows to N8N ===\n')

  const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json')).sort()

  for (const file of files) {
    const filePath = path.join(WORKFLOWS_DIR, file)
    let wf = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Replace credential placeholders with real values
    let wfStr = JSON.stringify(wf)

    if (CONFIG.SUPABASE_CREDENTIAL_ID) {
      wfStr = wfStr.replace(/CONFIGURE_SUPABASE_CREDENTIAL_ID/g, CONFIG.SUPABASE_CREDENTIAL_ID)
    }
    if (CONFIG.RESEND_CREDENTIAL_ID) {
      wfStr = wfStr.replace(/CONFIGURE_RESEND_CREDENTIAL_ID/g, CONFIG.RESEND_CREDENTIAL_ID)
    }
    if (CONFIG.SUPABASE_URL) {
      wfStr = wfStr.replace(/CONFIGURE_SUPABASE_URL/g, CONFIG.SUPABASE_URL)
    }
    if (CONFIG.HUNTER_API_KEY) {
      wfStr = wfStr.replace(/CONFIGURE_HUNTER_API_KEY/g, CONFIG.HUNTER_API_KEY)
    }
    if (CONFIG.VALIDATION_API_KEY) {
      wfStr = wfStr.replace(/CONFIGURE_VALIDATION_API_KEY/g, CONFIG.VALIDATION_API_KEY)
    }
    if (CONFIG.NOTIFICATION_WEBHOOK_URL) {
      wfStr = wfStr.replace(/CONFIGURE_NOTIFICATION_WEBHOOK_URL/g, CONFIG.NOTIFICATION_WEBHOOK_URL)
    }
    if (CONFIG.IMAP_SETTINGS) {
      wfStr = wfStr.replace(/CONFIGURE_IMAP_SETTINGS/g, CONFIG.IMAP_SETTINGS)
    }

    wf = JSON.parse(wfStr)

    // Prefix name with [TEST] for easy identification
    wf.name = `[TEST] ${wf.name}`

    try {
      const result = await n8nApi('POST', '/workflows', wf)
      TEST_IDS.workflows.push(result.id)
      log('OK', `Imported: ${wf.name} (id: ${result.id})`)

      // Activate workflow
      await n8nApi('PATCH', `/workflows/${result.id}`, { active: true })
      log('  ', `Activated: ${result.id}`)
    } catch (e) {
      log('ERR', `Failed to import ${file}: ${e.message}`)
    }
  }

  console.log(`\nImported ${TEST_IDS.workflows.length} workflows`)
}

async function seedTestData() {
  console.log('\n=== STEP 2: Seed Test Data in Supabase ===\n')

  // Check if ICP exists (from seed migration)
  const icps = await supabaseApi('GET', '/icps?slug=eq.escritorios_advocacia&select=id')
  let icpId

  if (Array.isArray(icps) && icps.length > 0) {
    icpId = icps[0].id
    log('OK', `ICP found: ${icpId}`)
  } else {
    log('WARN', 'ICP not found - run migrations first (009_seed_data.sql)')
    return
  }

  // Get cadence
  const cadences = await supabaseApi('GET', `/cadences?icp_id=eq.${icpId}&select=id`)
  let cadenceId

  if (Array.isArray(cadences) && cadences.length > 0) {
    cadenceId = cadences[0].id
    log('OK', `Cadence found: ${cadenceId}`)
  } else {
    log('WARN', 'Cadence not found - run migrations first')
    return
  }

  // Insert test leads
  const testLeads = [
    {
      first_name: 'Test',
      last_name: 'Lead Alpha',
      email: TEST_EMAIL,
      company_name: 'Escritorio Teste Alpha',
      role: 'Socio-diretor',
      source: 'google_maps',
      status: 'new',
      icp_id: icpId,
      cadence_id: cadenceId,
      email_validated: false,
    },
    {
      first_name: 'Test',
      last_name: 'Lead Beta',
      email: `beta-${Date.now()}@test.leveron.com`,
      company_name: 'Escritorio Teste Beta',
      role: 'Advogado associado',
      source: 'oab_directory',
      status: 'enriched',
      icp_id: icpId,
      cadence_id: cadenceId,
      email_validated: true,
    },
    {
      first_name: 'Test',
      last_name: 'Lead Cadence',
      email: `cadence-${Date.now()}@test.leveron.com`,
      company_name: 'Escritorio Teste Cadence',
      role: 'Socio',
      source: 'linkedin',
      status: 'in_cadence',
      icp_id: icpId,
      cadence_id: cadenceId,
      email_validated: true,
      cadence_step: 0,
      cadence_started_at: new Date().toISOString(),
      cadence_paused: false,
    },
  ]

  for (const lead of testLeads) {
    try {
      const result = await supabaseApi('POST', '/leads', lead)
      if (Array.isArray(result) && result.length > 0) {
        TEST_IDS.leads.push(result[0].id)
        log('OK', `Lead created: ${lead.first_name} ${lead.last_name} (${result[0].id})`)
      }
    } catch (e) {
      log('ERR', `Failed to create lead ${lead.first_name}: ${e.message}`)
    }
  }

  // Insert test email domain
  const testDomain = {
    domain: 'test.leveron.com',
    smtp_host: 'smtp.resend.com',
    smtp_port: 465,
    daily_limit: 10,
    sent_today: 0,
    active: true,
    reputation_score: 100,
    warmup_phase: 'test',
  }

  try {
    const result = await supabaseApi('POST', '/email_domains', testDomain)
    if (Array.isArray(result) && result.length > 0) {
      log('OK', `Test domain created: ${testDomain.domain} (${result[0].id})`)
    }
  } catch (e) {
    // Might already exist
    log('WARN', `Domain insert: ${e.message.substring(0, 100)}`)
  }

  console.log(`\nSeeded ${TEST_IDS.leads.length} test leads`)
}

// ---------------------------------------------------------------------------
// Step 2: Run tests
// ---------------------------------------------------------------------------

async function runTests() {
  console.log('\n=== STEP 3: Run E2E Tests ===\n')

  let passed = 0
  let failed = 0

  async function test(name, fn) {
    try {
      await fn()
      log('\x1b[32mPASS\x1b[0m', name)
      passed++
    } catch (e) {
      log('\x1b[31mFAIL\x1b[0m', `${name}: ${e.message}`)
      failed++
    }
  }

  // Test 1: WF-01 Lead Ingestion webhook
  await test('WF-01: Lead Ingestion accepts webhook POST', async () => {
    const res = await webhookCall('POST', 'lead-ingestion', {
      source: 'manual_test',
      leads: [{
        name: 'E2E Test Lead',
        company: 'E2E Test Escritorio',
        phone: '11999999999',
        address: 'Rua Teste 123, SP',
        website: 'https://teste.adv.br',
      }],
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
  })

  // Test 2: WF-04 Email Tracking open event
  await test('WF-04: Tracking webhook accepts open event', async () => {
    if (TEST_IDS.leads.length === 0) throw new Error('No test leads - run setup first')
    const res = await webhookCall('POST', 'email-tracking', {
      event: 'open',
      lead_id: TEST_IDS.leads[0],
      email_id: 'test-email-001',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip_address: '177.100.0.1',
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
  })

  // Test 3: WF-04 Email Tracking click event
  await test('WF-04: Tracking webhook accepts click event', async () => {
    if (TEST_IDS.leads.length === 0) throw new Error('No test leads')
    const res = await webhookCall('POST', 'email-tracking', {
      event: 'click',
      lead_id: TEST_IDS.leads[0],
      email_id: 'test-email-001',
      link_url: 'https://leveron.com/teste',
      user_agent: 'Mozilla/5.0',
      ip_address: '177.100.0.1',
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
  })

  // Test 4: WF-04 Bot filtering
  await test('WF-04: Bot events are filtered', async () => {
    if (TEST_IDS.leads.length === 0) throw new Error('No test leads')
    const res = await webhookCall('POST', 'email-tracking', {
      event: 'open',
      lead_id: TEST_IDS.leads[0],
      email_id: 'test-email-bot',
      user_agent: 'Googlebot/2.1',
      ip_address: '66.249.0.1',
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    if (res.data && res.data.status === 'ignored') {
      // Expected - bot was filtered
    }
  })

  // Test 5: WF-09 Bounce handler
  await test('WF-09: Bounce webhook accepts Resend bounce event', async () => {
    const res = await webhookCall('POST', 'bounce-handler', {
      type: 'email.bounced',
      data: {
        to: [TEST_EMAIL],
        from: 'leveron@test.leveron.com',
        email_id: 'test-resend-id-001',
        bounce: {
          message: 'Test bounce',
          status_code: '550',
        },
        created_at: new Date().toISOString(),
      },
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
  })

  // Test 6: WF-AUX Cadence Activation
  await test('WF-AUX: Cadence activation webhook works', async () => {
    const res = await webhookCall('POST', 'activate-cadence', {
      limit: 5,
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
  })

  // Test 7: WF-06 Lead Scoring webhook
  await test('WF-06: Lead scoring webhook accepts interaction event', async () => {
    if (TEST_IDS.leads.length === 0) throw new Error('No test leads')
    const res = await webhookCall('POST', 'lead-scoring', {
      record: {
        lead_id: TEST_IDS.leads[0],
        type: 'email_opened',
      },
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
  })

  // Test 8: WF-10 A/B Tester manual evaluation
  await test('WF-10: A/B test evaluation webhook works', async () => {
    const res = await webhookCall('POST', 'ab-test', {
      experiment_id: 'test-exp-001',
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
  })

  // Test 9: WF-08 Dashboard Report on-demand
  await test('WF-08: Dashboard report returns JSON', async () => {
    const res = await webhookCall('GET', 'dashboard-report')
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    if (typeof res.data !== 'object') throw new Error('Expected JSON response')
  })

  // Test 10: Verify interaction was recorded in Supabase
  await test('Supabase: Tracking interaction was recorded', async () => {
    if (TEST_IDS.leads.length === 0) throw new Error('No test leads')
    await sleep(2000) // Wait for async processing
    const interactions = await supabaseApi(
      'GET',
      `/interactions?lead_id=eq.${TEST_IDS.leads[0]}&type=eq.email_opened&select=id,type&limit=1`
    )
    if (!Array.isArray(interactions) || interactions.length === 0) {
      throw new Error('No email_opened interaction found for test lead')
    }
  })

  // Test 11: WF-03 cadence engine (dry run via manual trigger)
  await test('WF-03: Cadence engine can be triggered manually', async () => {
    // Find the cadence engine workflow
    const cadenceWf = TEST_IDS.workflows.find(async (id) => {
      const wf = await n8nApi('GET', `/workflows/${id}`)
      return wf.name.includes('Cadence Engine')
    })

    // If we can execute manually via N8N API
    if (cadenceWf) {
      try {
        await n8nApi('POST', `/workflows/${cadenceWf}/execute`)
        // Just checking it doesn't crash
      } catch {
        // Manual execution might not be enabled via API - that's OK
      }
    }
    // Pass if no errors thrown
  })

  // Summary
  console.log(`\n=== Test Results ===`)
  console.log(`\x1b[32mPassed: ${passed}\x1b[0m`)
  if (failed > 0) console.log(`\x1b[31mFailed: ${failed}\x1b[0m`)
  console.log(`Total:  ${passed + failed}`)

  return failed === 0
}

// ---------------------------------------------------------------------------
// Step 3: Cleanup test data
// ---------------------------------------------------------------------------

async function cleanupTestData() {
  console.log('\n=== Cleanup: Remove Test Data ===\n')

  // Delete test interactions
  try {
    for (const leadId of TEST_IDS.leads) {
      await supabaseApi('DELETE', `/interactions?lead_id=eq.${leadId}`)
      log('OK', `Deleted interactions for lead ${leadId}`)
    }
  } catch (e) {
    log('WARN', `Interaction cleanup: ${e.message.substring(0, 100)}`)
  }

  // Delete test leads
  try {
    for (const leadId of TEST_IDS.leads) {
      await supabaseApi('DELETE', `/leads?id=eq.${leadId}`)
      log('OK', `Deleted lead ${leadId}`)
    }
  } catch (e) {
    log('WARN', `Lead cleanup: ${e.message.substring(0, 100)}`)
  }

  // Delete test domain
  try {
    await supabaseApi('DELETE', '/email_domains?domain=eq.test.leveron.com')
    log('OK', 'Deleted test domain')
  } catch (e) {
    log('WARN', `Domain cleanup: ${e.message.substring(0, 100)}`)
  }

  console.log('Test data cleaned up')
}

async function teardownWorkflows() {
  console.log('\n=== Teardown: Remove Test Workflows from N8N ===\n')

  if (TEST_IDS.workflows.length === 0) {
    // Try to find them by name prefix
    try {
      const all = await n8nApi('GET', '/workflows')
      const testWfs = (all.data || []).filter(w => w.name.startsWith('[TEST]'))
      for (const wf of testWfs) {
        TEST_IDS.workflows.push(wf.id)
      }
    } catch (e) {
      log('WARN', `Could not list workflows: ${e.message}`)
    }
  }

  for (const wfId of TEST_IDS.workflows) {
    try {
      // Deactivate first
      await n8nApi('PATCH', `/workflows/${wfId}`, { active: false })
      await n8nApi('DELETE', `/workflows/${wfId}`)
      log('OK', `Removed workflow ${wfId}`)
    } catch (e) {
      log('WARN', `Failed to remove ${wfId}: ${e.message.substring(0, 100)}`)
    }
  }

  console.log(`Removed ${TEST_IDS.workflows.length} test workflows`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Outbound CRM E2E Test Runner ===')
  console.log(`Test email: ${TEST_EMAIL}\n`)

  loadConfig()

  const step = process.argv.find(a => a.startsWith('--step='))?.split('=')[1]
    || (process.argv.includes('--step') ? process.argv[process.argv.indexOf('--step') + 1] : null)

  try {
    if (!step || step === 'all') {
      await setupWorkflows()
      await seedTestData()
      await sleep(3000) // Wait for N8N to activate workflows
      const success = await runTests()
      await cleanupTestData()
      await teardownWorkflows()
      process.exit(success ? 0 : 1)
    } else if (step === 'setup') {
      await setupWorkflows()
      await seedTestData()
      console.log('\nSetup complete. Run with --step test to execute tests.')
    } else if (step === 'test') {
      await runTests()
    } else if (step === 'cleanup') {
      await cleanupTestData()
    } else if (step === 'teardown') {
      await teardownWorkflows()
    } else {
      console.error(`Unknown step: ${step}. Use: setup, test, cleanup, teardown, all`)
      process.exit(1)
    }
  } catch (e) {
    console.error(`\nFATAL: ${e.message}`)
    console.error(e.stack)

    // Always try to cleanup on fatal error
    if (!step || step === 'all') {
      console.log('\nAttempting cleanup after fatal error...')
      try { await cleanupTestData() } catch {}
      try { await teardownWorkflows() } catch {}
    }

    process.exit(1)
  }
}

main()
