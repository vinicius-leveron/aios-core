#!/usr/bin/env node

/**
 * n8n Workflow Validator
 *
 * CLI tool to validate n8n workflow JSON files.
 * Connects to n8n API or reads local JSON files.
 *
 * Usage:
 *   # Validate all workflows from n8n instance
 *   node scripts/n8n-validator/index.mjs --url https://n8n.example.com --api-key YOUR_KEY
 *
 *   # Validate a single local JSON file
 *   node scripts/n8n-validator/index.mjs --file workflow.json
 *
 *   # Validate all JSON files in a directory
 *   node scripts/n8n-validator/index.mjs --dir ./exported-workflows/
 *
 *   # Output as JSON
 *   node scripts/n8n-validator/index.mjs --url https://n8n.example.com --api-key KEY --json
 *
 *   # Only show errors (no warnings/info)
 *   node scripts/n8n-validator/index.mjs --file workflow.json --severity error
 *
 * Zero external dependencies. Requires Node.js 18+.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { validateWorkflow, SEVERITY } from './validators.mjs'

// ============================================================================
// CLI ARGUMENT PARSER
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2)
  const config = {
    url: null,
    apiKey: null,
    file: null,
    dir: null,
    json: false,
    severity: 'all', // all, error, warning
    output: null,
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
      case '-u':
        config.url = args[++i]
        break
      case '--api-key':
      case '-k':
        config.apiKey = args[++i]
        break
      case '--file':
      case '-f':
        config.file = args[++i]
        break
      case '--dir':
      case '-d':
        config.dir = args[++i]
        break
      case '--json':
      case '-j':
        config.json = true
        break
      case '--severity':
      case '-s':
        config.severity = (args[++i] || 'all').toLowerCase()
        break
      case '--output':
      case '-o':
        config.output = args[++i]
        break
      case '--help':
      case '-h':
        config.help = true
        break
      default:
        // If it looks like a file path, treat as --file
        if (args[i].endsWith('.json')) {
          config.file = args[i]
        }
        break
    }
  }

  return config
}

function printUsage() {
  console.log(`
n8n Workflow Validator
=====================

Validates n8n workflow JSON files for structure, expressions, connections,
credentials, and best practices.

USAGE:
  node scripts/n8n-validator/index.mjs [options]

OPTIONS:
  --url, -u <url>         n8n instance URL (e.g., https://n8n.example.com)
  --api-key, -k <key>     n8n API key for authentication
  --file, -f <path>       Path to a single workflow JSON file
  --dir, -d <path>        Path to directory with workflow JSON files
  --json, -j              Output results as JSON
  --severity, -s <level>  Filter: "all" (default), "error", "warning"
  --output, -o <path>     Write report to file
  --help, -h              Show this help message

EXAMPLES:
  # Validate all workflows from n8n instance
  node scripts/n8n-validator/index.mjs --url https://n8n.example.com --api-key YOUR_KEY

  # Validate a local file
  node scripts/n8n-validator/index.mjs --file my-workflow.json

  # Validate directory, errors only, JSON output
  node scripts/n8n-validator/index.mjs --dir ./exports/ --severity error --json

VALIDATION CATEGORIES:
  Structure    JSON format, required fields, node types, positions
  Expression   ={{ }} syntax, $json/$node references, Code node checks
  Connection   Orphan nodes, circular refs, webhook pairing
  Credential   Missing credentials, hardcoded secrets, webhook auth
  Best Practice  Error handling, deprecated nodes, workflow size
`)
}

// ============================================================================
// N8N API CLIENT
// ============================================================================

async function fetchWorkflows(url, apiKey) {
  const baseUrl = url.replace(/\/+$/, '')
  const allWorkflows = []
  let cursor = null
  let page = 0

  log(`\nConnecting to ${baseUrl}...`)

  while (true) {
    page++
    const params = new URLSearchParams({ limit: '100' })
    if (cursor) params.set('cursor', cursor)

    const endpoint = `${baseUrl}/api/v1/workflows?${params}`

    const response = await fetch(endpoint, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(
        `n8n API error ${response.status}: ${response.statusText}\n${text}`
      )
    }

    const data = await response.json()
    const workflows = data.data || data

    if (Array.isArray(workflows)) {
      allWorkflows.push(...workflows)
      log(`  Page ${page}: fetched ${workflows.length} workflows (total: ${allWorkflows.length})`)
    } else if (Array.isArray(data)) {
      allWorkflows.push(...data)
      log(`  Page ${page}: fetched ${data.length} workflows (total: ${allWorkflows.length})`)
      break
    }

    // Check for pagination
    cursor = data.nextCursor
    if (!cursor || (Array.isArray(workflows) && workflows.length === 0)) break
  }

  log(`  Total workflows fetched: ${allWorkflows.length}`)

  // Fetch full details for each workflow (the list endpoint may not include all data)
  const detailedWorkflows = []
  for (const wf of allWorkflows) {
    try {
      const detailResp = await fetch(`${baseUrl}/api/v1/workflows/${wf.id}`, {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      })

      if (detailResp.ok) {
        const detail = await detailResp.json()
        detailedWorkflows.push(detail)
      } else {
        // Fallback to summary data
        detailedWorkflows.push(wf)
        console.warn(`  Warning: Could not fetch details for workflow "${wf.name}" (${wf.id})`)
      }
    } catch (err) {
      detailedWorkflows.push(wf)
      console.warn(`  Warning: Error fetching details for "${wf.name}": ${err.message}`)
    }
  }

  return detailedWorkflows
}

// ============================================================================
// FILE LOADERS
// ============================================================================

function loadWorkflowFile(filePath) {
  const absPath = resolve(filePath)
  if (!existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`)
  }

  const content = readFileSync(absPath, 'utf-8')
  let parsed

  try {
    parsed = JSON.parse(content)
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`)
  }

  // Handle both single workflow and array of workflows
  if (Array.isArray(parsed)) {
    return parsed
  }

  // Handle n8n export format (may have workflows array)
  if (parsed.workflows && Array.isArray(parsed.workflows)) {
    return parsed.workflows
  }

  return [parsed]
}

function loadWorkflowDirectory(dirPath) {
  const absDir = resolve(dirPath)
  if (!existsSync(absDir)) {
    throw new Error(`Directory not found: ${absDir}`)
  }

  const files = readdirSync(absDir).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    throw new Error(`No .json files found in ${absDir}`)
  }

  const workflows = []
  for (const file of files) {
    try {
      const loaded = loadWorkflowFile(join(absDir, file))
      workflows.push(...loaded)
    } catch (err) {
      console.warn(`  Skipping ${file}: ${err.message}`)
    }
  }

  return workflows
}

// ============================================================================
// REPORT FORMATTER
// ============================================================================

const ICONS = {
  ERROR: '\x1b[31m[ERROR]\x1b[0m',
  WARNING: '\x1b[33m[WARN]\x1b[0m',
  INFO: '\x1b[36m[INFO]\x1b[0m',
  PASS: '\x1b[32m PASS\x1b[0m',
  FAIL: '\x1b[31m FAIL\x1b[0m',
  REVIEW: '\x1b[33m REVIEW\x1b[0m',
}

function formatReport(results, config) {
  if (config.json) {
    return JSON.stringify(results, null, 2)
  }

  const lines = []

  lines.push('')
  lines.push('\x1b[1m========================================================\x1b[0m')
  lines.push('\x1b[1m  n8n Workflow Validation Report\x1b[0m')
  lines.push('\x1b[1m========================================================\x1b[0m')
  lines.push('')

  // Global summary
  let totalErrors = 0
  let totalWarnings = 0
  let totalInfo = 0

  for (const result of results) {
    totalErrors += result.summary.errors
    totalWarnings += result.summary.warnings
    totalInfo += result.summary.info
  }

  lines.push(`  Workflows analyzed: ${results.length}`)
  lines.push(`  Total issues: ${totalErrors + totalWarnings + totalInfo}`)
  lines.push(`    ${ICONS.ERROR} Errors:   ${totalErrors}`)
  lines.push(`    ${ICONS.WARNING} Warnings: ${totalWarnings}`)
  lines.push(`    ${ICONS.INFO} Info:     ${totalInfo}`)
  lines.push('')

  // Per-workflow results
  for (const result of results) {
    const verdict = ICONS[result.summary.verdict] || result.summary.verdict
    const activeLabel = result.workflow.active ? '\x1b[32m[ACTIVE]\x1b[0m' : '\x1b[90m[inactive]\x1b[0m'

    lines.push('\x1b[1m--------------------------------------------------------\x1b[0m')
    lines.push(`\x1b[1m  ${result.workflow.name}\x1b[0m  ${activeLabel}  ${verdict}`)
    lines.push(`  ID: ${result.workflow.id} | Nodes: ${result.workflow.nodeCount}`)
    lines.push('\x1b[1m--------------------------------------------------------\x1b[0m')

    // Filter issues by severity
    let issues = result.issues
    if (config.severity === 'error') {
      issues = issues.filter(i => i.severity === SEVERITY.ERROR)
    } else if (config.severity === 'warning') {
      issues = issues.filter(i => i.severity !== SEVERITY.INFO)
    }

    if (issues.length === 0) {
      lines.push('  \x1b[32mNo issues found.\x1b[0m')
    } else {
      // Group by category
      const byCategory = {}
      for (const issue of issues) {
        if (!byCategory[issue.category]) byCategory[issue.category] = []
        byCategory[issue.category].push(issue)
      }

      for (const [category, catIssues] of Object.entries(byCategory)) {
        lines.push(`\n  \x1b[4m${category}\x1b[0m`)
        for (const issue of catIssues) {
          const icon = ICONS[issue.severity]
          lines.push(`    ${icon} ${issue.rule}: ${issue.message}`)
        }
      }
    }

    // Credential summary
    if (result.credentialSummary && result.credentialSummary.length > 0) {
      lines.push(`\n  \x1b[4mCredentials Required\x1b[0m`)
      const seen = new Set()
      for (const cred of result.credentialSummary) {
        const key = `${cred.credentialType}:${cred.credentialName}`
        if (seen.has(key)) continue
        seen.add(key)
        lines.push(`    - \x1b[36m${cred.credentialType}\x1b[0m: "${cred.credentialName}" (used by: ${cred.node})`)
      }
    }

    lines.push('')
  }

  // Final verdict
  const overallVerdict = totalErrors > 0 ? 'FAIL' : totalWarnings > 0 ? 'REVIEW' : 'PASS'
  lines.push('\x1b[1m========================================================\x1b[0m')
  lines.push(`\x1b[1m  Overall Verdict: ${ICONS[overallVerdict]}\x1b[0m`)

  if (overallVerdict === 'FAIL') {
    lines.push(`  \x1b[31m${totalErrors} error(s) must be fixed before deployment.\x1b[0m`)
  } else if (overallVerdict === 'REVIEW') {
    lines.push(`  \x1b[33m${totalWarnings} warning(s) should be reviewed.\x1b[0m`)
  } else {
    lines.push(`  \x1b[32mAll workflows passed validation.\x1b[0m`)
  }

  lines.push('\x1b[1m========================================================\x1b[0m')
  lines.push('')

  return lines.join('\n')
}

// ============================================================================
// LOGGING (stderr for --json mode, stdout otherwise)
// ============================================================================

let logToStderr = false

function log(...args) {
  if (logToStderr) {
    process.stderr.write(args.join(' ') + '\n')
  } else {
    console.log(...args)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs()
  logToStderr = config.json

  if (config.help) {
    printUsage()
    process.exit(0)
  }

  // Validate inputs
  if (!config.url && !config.file && !config.dir) {
    console.error('Error: Provide --url, --file, or --dir. Use --help for usage.')
    process.exit(1)
  }

  if (config.url && !config.apiKey) {
    console.error('Error: --api-key is required when using --url.')
    process.exit(1)
  }

  let workflows = []

  try {
    // Load workflows
    if (config.url) {
      workflows = await fetchWorkflows(config.url, config.apiKey)
    } else if (config.file) {
      log(`\nLoading workflow from: ${config.file}`)
      workflows = loadWorkflowFile(config.file)
    } else if (config.dir) {
      log(`\nLoading workflows from directory: ${config.dir}`)
      workflows = loadWorkflowDirectory(config.dir)
    }

    if (workflows.length === 0) {
      log('No workflows found to validate.')
      process.exit(0)
    }

    log(`\nValidating ${workflows.length} workflow(s)...\n`)

    // Validate all workflows
    const results = workflows.map(wf => validateWorkflow(wf))

    // Format and output report
    const report = formatReport(results, config)

    if (config.output) {
      const outputContent = config.json ? report : report.replace(/\x1b\[\d+m/g, '')
      writeFileSync(config.output, outputContent, 'utf-8')
      log(`Report saved to: ${config.output}`)
    }

    if (config.json) {
      process.stdout.write(report + '\n')
    } else {
      console.log(report)
    }

    // Exit code based on results
    const hasErrors = results.some(r => r.summary.errors > 0)
    process.exit(hasErrors ? 1 : 0)

  } catch (err) {
    console.error(`\nFatal error: ${err.message}`)
    if (process.env.DEBUG) console.error(err.stack)
    process.exit(2)
  }
}

main()
