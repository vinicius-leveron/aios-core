#!/usr/bin/env node

/**
 * n8n Workflow Validator + Fixer + Deployer
 *
 * CLI tool to validate, auto-fix, and deploy n8n workflow JSON files.
 * Connects to n8n API or reads local JSON files.
 *
 * Usage:
 *   # Validate all workflows from n8n instance
 *   npx @synkra/n8n-validator --url https://n8n.example.com --api-key YOUR_KEY
 *
 *   # Validate + auto-fix (outputs corrected JSON files)
 *   npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY --fix
 *
 *   # Validate + auto-fix + deploy back to n8n
 *   npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY --fix --deploy
 *
 *   # Validate a local file, fix and save
 *   npx @synkra/n8n-validator --file workflow.json --fix --output-dir ./fixed/
 *
 * Zero external dependencies. Requires Node.js 18+.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { validateWorkflow, SEVERITY } from '../lib/validators.mjs'
import { fixWorkflow, deployWorkflow } from '../lib/fixer.mjs'

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
    severity: 'all',
    output: null,
    outputDir: null,
    fix: false,
    deploy: false,
    dryRun: false,
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
      case '--output-dir':
        config.outputDir = args[++i]
        break
      case '--fix':
        config.fix = true
        break
      case '--deploy':
        config.deploy = true
        break
      case '--dry-run':
        config.dryRun = true
        break
      case '--help':
      case '-h':
        config.help = true
        break
      default:
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
n8n Workflow Validator + Fixer + Deployer
==========================================

Validates, auto-fixes, and deploys n8n workflow JSON files.

USAGE:
  npx @synkra/n8n-validator [options]

OPTIONS:
  --url, -u <url>         n8n instance URL (e.g., https://n8n.example.com)
  --api-key, -k <key>     n8n API key for authentication
  --file, -f <path>       Path to a single workflow JSON file
  --dir, -d <path>        Path to directory with workflow JSON files
  --fix                   Auto-fix safe issues (expressions, structure, deprecated nodes)
  --deploy                Deploy fixed workflows back to n8n (requires --url + --fix)
  --dry-run               Show what --deploy would do without actually deploying
  --output-dir <path>     Save fixed workflow JSONs to directory
  --json, -j              Output results as JSON
  --severity, -s <level>  Filter: "all" (default), "error", "warning"
  --output, -o <path>     Write report to file
  --help, -h              Show this help message

MODES:
  Validate only (default):
    npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY

  Validate + Fix (save locally):
    npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY --fix --output-dir ./fixed/

  Validate + Fix + Deploy:
    npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY --fix --deploy

  Validate + Fix + Dry Run (preview deploy):
    npx @synkra/n8n-validator --url https://n8n.example.com --api-key KEY --fix --deploy --dry-run

AUTO-FIX RULES:
  FIX-EXPR-001   Remove ={{ }} inside Code nodes
  FIX-EXPR-003   Fix trailing dots in expressions
  FIX-EXPR-020   Fix $node.Name for names with spaces -> $('Name With Spaces')
  FIX-EXPR-030   Fix single braces ={expr} -> ={{ expr }}
  FIX-STRUCT-030 Add settings.executionOrder = "v1"
  FIX-STRUCT-031 Add missing meta object
  FIX-BEST-010   Upgrade deprecated nodes (function->code, start->manualTrigger)
  FIX-CONN-001   Remove ghost connections to non-existent nodes
  FIX-CONN-011   Remove connections to non-existent targets
  FIX-CONN-040   Fix webhook responseMode when no Respond node exists

MANUAL REVIEW REQUIRED (not auto-fixed):
  - Missing credentials (need to configure in n8n UI)
  - Hardcoded secrets (need manual replacement)
  - Orphan/disconnected nodes (may be intentional)
  - Non-existent node references in expressions (ambiguous correction)
  - Circular connections (may be intentional loops)
`)
}

// ============================================================================
// LOGGING
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

    cursor = data.nextCursor
    if (!cursor || (Array.isArray(workflows) && workflows.length === 0)) break
  }

  log(`  Total workflows fetched: ${allWorkflows.length}`)

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
        detailedWorkflows.push(wf)
        log(`  Warning: Could not fetch details for workflow "${wf.name}" (${wf.id})`)
      }
    } catch (err) {
      detailedWorkflows.push(wf)
      log(`  Warning: Error fetching details for "${wf.name}": ${err.message}`)
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

  if (Array.isArray(parsed)) {
    return parsed
  }

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
      log(`  Skipping ${file}: ${err.message}`)
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
  FIX: '\x1b[35m[FIXED]\x1b[0m',
  DEPLOY: '\x1b[32m[DEPLOYED]\x1b[0m',
  SKIP: '\x1b[90m[SKIPPED]\x1b[0m',
}

function formatReport(results, config) {
  if (config.json) {
    return JSON.stringify(results, null, 2)
  }

  const lines = []

  const mode = config.deploy ? 'Validate + Fix + Deploy' : config.fix ? 'Validate + Fix' : 'Validate'

  lines.push('')
  lines.push('\x1b[1m========================================================\x1b[0m')
  lines.push(`\x1b[1m  n8n Workflow ${mode} Report\x1b[0m`)
  lines.push('\x1b[1m========================================================\x1b[0m')
  lines.push('')

  let totalErrors = 0
  let totalWarnings = 0
  let totalInfo = 0
  let totalFixed = 0
  let totalDeployed = 0

  for (const result of results) {
    totalErrors += result.summary.errors
    totalWarnings += result.summary.warnings
    totalInfo += result.summary.info
    if (result.fixResult) totalFixed += result.fixResult.changelog.length
    if (result.deployResult?.success) totalDeployed++
  }

  lines.push(`  Workflows analyzed: ${results.length}`)
  lines.push(`  Total issues: ${totalErrors + totalWarnings + totalInfo}`)
  lines.push(`    ${ICONS.ERROR} Errors:   ${totalErrors}`)
  lines.push(`    ${ICONS.WARNING} Warnings: ${totalWarnings}`)
  lines.push(`    ${ICONS.INFO} Info:     ${totalInfo}`)
  if (config.fix) {
    lines.push(`    ${ICONS.FIX} Fixed:    ${totalFixed}`)
  }
  if (config.deploy) {
    lines.push(`    ${ICONS.DEPLOY} Deployed: ${totalDeployed}/${results.length}`)
  }
  lines.push('')

  for (const result of results) {
    const verdict = ICONS[result.summary.verdict] || result.summary.verdict
    const activeLabel = result.workflow.active ? '\x1b[32m[ACTIVE]\x1b[0m' : '\x1b[90m[inactive]\x1b[0m'

    lines.push('\x1b[1m--------------------------------------------------------\x1b[0m')
    lines.push(`\x1b[1m  ${result.workflow.name}\x1b[0m  ${activeLabel}  ${verdict}`)
    lines.push(`  ID: ${result.workflow.id} | Nodes: ${result.workflow.nodeCount}`)
    lines.push('\x1b[1m--------------------------------------------------------\x1b[0m')

    // Issues
    let issues = result.issues
    if (config.severity === 'error') {
      issues = issues.filter(i => i.severity === SEVERITY.ERROR)
    } else if (config.severity === 'warning') {
      issues = issues.filter(i => i.severity !== SEVERITY.INFO)
    }

    if (issues.length === 0) {
      lines.push('  \x1b[32mNo issues found.\x1b[0m')
    } else {
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

    // Fix changelog
    if (result.fixResult && result.fixResult.changelog.length > 0) {
      lines.push(`\n  \x1b[4mAuto-Fixes Applied\x1b[0m`)
      for (const fix of result.fixResult.changelog) {
        lines.push(`    ${ICONS.FIX} ${fix.rule}: ${fix.action}`)
      }
    }

    // Post-fix validation
    if (result.postFixSummary) {
      const pf = result.postFixSummary
      lines.push(`\n  \x1b[4mPost-Fix Validation\x1b[0m`)
      if (pf.errors === 0 && pf.warnings === 0) {
        lines.push(`    \x1b[32mAll fixable issues resolved.\x1b[0m`)
      } else {
        lines.push(`    Remaining: ${pf.errors} errors, ${pf.warnings} warnings (require manual fix)`)
      }
    }

    // Deploy result
    if (result.deployResult) {
      lines.push(`\n  \x1b[4mDeploy Status\x1b[0m`)
      if (result.deployResult.success) {
        lines.push(`    ${ICONS.DEPLOY} ${result.deployResult.message}`)
      } else {
        lines.push(`    \x1b[31m[FAILED]\x1b[0m ${result.deployResult.message}`)
      }
    }

    // Credentials
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

  if (config.fix && totalFixed > 0) {
    lines.push(`\x1b[1m  Auto-Fixed: ${totalFixed} issue(s) across ${results.length} workflow(s)\x1b[0m`)
  }
  if (config.deploy && totalDeployed > 0) {
    lines.push(`\x1b[1m  Deployed: ${totalDeployed}/${results.length} workflow(s)\x1b[0m`)
  }

  lines.push(`\x1b[1m  Overall Verdict: ${ICONS[overallVerdict]}\x1b[0m`)

  if (overallVerdict === 'FAIL') {
    lines.push(`  \x1b[31mSome issues require manual intervention.\x1b[0m`)
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
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs()
  logToStderr = config.json

  if (config.help) {
    printUsage()
    process.exit(0)
  }

  if (!config.url && !config.file && !config.dir) {
    console.error('Error: Provide --url, --file, or --dir. Use --help for usage.')
    process.exit(1)
  }

  if (config.url && !config.apiKey) {
    console.error('Error: --api-key is required when using --url.')
    process.exit(1)
  }

  if (config.deploy && !config.fix) {
    console.error('Error: --deploy requires --fix.')
    process.exit(1)
  }

  if (config.deploy && !config.url) {
    console.error('Error: --deploy requires --url (need API connection to deploy).')
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

    const mode = config.deploy ? 'Validating + Fixing + Deploying' : config.fix ? 'Validating + Fixing' : 'Validating'
    log(`\n${mode} ${workflows.length} workflow(s)...\n`)

    // Process each workflow
    const results = []

    for (const wf of workflows) {
      // Step 1: Validate
      const validation = validateWorkflow(wf)
      const result = { ...validation }

      // Step 2: Fix (if requested)
      if (config.fix) {
        const fixResult = fixWorkflow(wf, validation)
        result.fixResult = { changelog: fixResult.changelog }

        // Re-validate the fixed workflow to show remaining issues
        if (fixResult.changelog.length > 0) {
          const postFix = validateWorkflow(fixResult.workflow)
          result.postFixSummary = postFix.summary

          // Save fixed workflow to output dir
          if (config.outputDir) {
            const outDir = resolve(config.outputDir)
            if (!existsSync(outDir)) {
              mkdirSync(outDir, { recursive: true })
            }
            const safeName = (wf.name || 'workflow').replace(/[^a-zA-Z0-9_-]/g, '_')
            const outPath = join(outDir, `${safeName}_fixed.json`)
            writeFileSync(outPath, JSON.stringify(fixResult.workflow, null, 2), 'utf-8')
            log(`  Saved fixed workflow: ${outPath}`)
          }

          // Step 3: Deploy (if requested)
          if (config.deploy && wf.id) {
            if (config.dryRun) {
              result.deployResult = {
                success: true,
                message: `[DRY RUN] Would deploy "${wf.name}" (${wf.id}) with ${fixResult.changelog.length} fixes`,
              }
              log(`  [DRY RUN] Would deploy: ${wf.name} (${wf.id})`)
            } else {
              const baseUrl = config.url.replace(/\/+$/, '')
              log(`  Deploying: ${wf.name} (${wf.id})...`)
              result.deployResult = await deployWorkflow(baseUrl, config.apiKey, fixResult.workflow)
              if (result.deployResult.success) {
                log(`  Deployed: ${wf.name}`)
              } else {
                log(`  Deploy FAILED: ${wf.name} - ${result.deployResult.message}`)
              }
            }
          } else if (config.deploy && !wf.id) {
            result.deployResult = {
              success: false,
              message: `Cannot deploy "${wf.name}" - no workflow ID (loaded from file?)`,
            }
          }
        } else {
          result.fixResult = { changelog: [] }
          if (config.deploy) {
            result.deployResult = {
              success: true,
              message: `No fixes needed for "${wf.name}" - skipped deploy`,
            }
          }
        }
      }

      results.push(result)
    }

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

    // Exit code: 0 if all issues were fixed or no errors, 1 if errors remain
    const hasRemainingErrors = results.some(r => {
      if (r.postFixSummary) return r.postFixSummary.errors > 0
      return r.summary.errors > 0
    })
    process.exit(hasRemainingErrors ? 1 : 0)

  } catch (err) {
    console.error(`\nFatal error: ${err.message}`)
    if (process.env.DEBUG) console.error(err.stack)
    process.exit(2)
  }
}

main()
