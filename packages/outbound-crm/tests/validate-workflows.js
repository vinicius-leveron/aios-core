#!/usr/bin/env node

/**
 * Validates all N8N workflow JSON files for structural correctness.
 * Run: node tests/validate-workflows.js
 *
 * Checks:
 * - Valid JSON parsing
 * - Required top-level fields (name, nodes, connections, settings, tags)
 * - Node structure (id, name, type, position)
 * - Connection references point to existing nodes
 * - No orphan nodes (every non-trigger node should be connected)
 * - Credential placeholders are flagged
 */

const fs = require('fs')
const path = require('path')

const WORKFLOWS_DIR = path.join(__dirname, '..', 'n8n-workflows')

const REQUIRED_TOP_LEVEL = ['name', 'nodes', 'connections', 'settings', 'tags']
const REQUIRED_NODE_FIELDS = ['id', 'name', 'type', 'position']
const TRIGGER_TYPES = [
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.imapEmail',
]

let totalErrors = 0
let totalWarnings = 0
let totalWorkflows = 0

function log(prefix, msg) {
  const colors = { OK: '\x1b[32m', WARN: '\x1b[33m', ERR: '\x1b[31m', INFO: '\x1b[36m' }
  const reset = '\x1b[0m'
  console.log(`  ${colors[prefix] || ''}[${prefix}]${reset} ${msg}`)
}

function validateWorkflow(filePath) {
  const fileName = path.basename(filePath)
  console.log(`\n--- ${fileName} ---`)

  let wf
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    wf = JSON.parse(raw)
    log('OK', 'Valid JSON')
  } catch (e) {
    log('ERR', `Invalid JSON: ${e.message}`)
    totalErrors++
    return
  }

  // Top-level fields
  for (const field of REQUIRED_TOP_LEVEL) {
    if (wf[field] === undefined) {
      log('ERR', `Missing required field: ${field}`)
      totalErrors++
    }
  }

  if (!Array.isArray(wf.nodes) || wf.nodes.length === 0) {
    log('ERR', 'No nodes defined')
    totalErrors++
    return
  }

  log('OK', `${wf.nodes.length} nodes, "${wf.name}"`)

  // Node validation
  const nodeNames = new Set()
  const nodeIds = new Set()
  const triggerNodes = []

  for (const node of wf.nodes) {
    for (const field of REQUIRED_NODE_FIELDS) {
      if (node[field] === undefined) {
        log('ERR', `Node missing field "${field}": ${JSON.stringify(node).substring(0, 80)}`)
        totalErrors++
      }
    }

    if (node.name) {
      if (nodeNames.has(node.name)) {
        log('ERR', `Duplicate node name: "${node.name}"`)
        totalErrors++
      }
      nodeNames.add(node.name)
    }

    if (node.id) {
      if (nodeIds.has(node.id)) {
        log('ERR', `Duplicate node id: "${node.id}"`)
        totalErrors++
      }
      nodeIds.add(node.id)
    }

    if (TRIGGER_TYPES.includes(node.type)) {
      triggerNodes.push(node.name)
    }

    // Check for credential placeholders
    const nodeStr = JSON.stringify(node)
    const configMatches = nodeStr.match(/CONFIGURE_[A-Z_]+/g)
    if (configMatches) {
      const unique = [...new Set(configMatches)]
      unique.forEach(m => log('WARN', `Placeholder found in "${node.name}": ${m}`))
      totalWarnings += unique.length
    }
  }

  if (triggerNodes.length === 0) {
    log('WARN', 'No trigger node found')
    totalWarnings++
  } else {
    log('OK', `Trigger(s): ${triggerNodes.join(', ')}`)
  }

  // Connection validation
  if (wf.connections && typeof wf.connections === 'object') {
    const connectedTargets = new Set()

    for (const [sourceName, outputs] of Object.entries(wf.connections)) {
      if (!nodeNames.has(sourceName)) {
        log('ERR', `Connection source "${sourceName}" not found in nodes`)
        totalErrors++
        continue
      }

      if (outputs.main && Array.isArray(outputs.main)) {
        for (const outputGroup of outputs.main) {
          if (Array.isArray(outputGroup)) {
            for (const conn of outputGroup) {
              if (conn.node && !nodeNames.has(conn.node)) {
                log('ERR', `Connection target "${conn.node}" (from "${sourceName}") not found in nodes`)
                totalErrors++
              } else if (conn.node) {
                connectedTargets.add(conn.node)
              }
            }
          }
        }
      }
    }

    // Check for orphan nodes (non-trigger nodes not connected as targets)
    for (const node of wf.nodes) {
      if (!TRIGGER_TYPES.includes(node.type) && !connectedTargets.has(node.name)) {
        // Also check if it's a source in connections (some nodes only output)
        if (!wf.connections[node.name]) {
          log('WARN', `Potentially orphan node: "${node.name}"`)
          totalWarnings++
        }
      }
    }

    log('OK', `${Object.keys(wf.connections).length} connection groups validated`)
  }

  // Tags check
  if (Array.isArray(wf.tags)) {
    const tagNames = wf.tags.map(t => t.name).join(', ')
    log('OK', `Tags: ${tagNames}`)
  }

  totalWorkflows++
}

// Main
console.log('=== N8N Workflow Validator ===\n')
console.log(`Scanning: ${WORKFLOWS_DIR}`)

const files = fs.readdirSync(WORKFLOWS_DIR)
  .filter(f => f.endsWith('.json'))
  .sort()

if (files.length === 0) {
  console.log('No workflow JSON files found!')
  process.exit(1)
}

for (const file of files) {
  validateWorkflow(path.join(WORKFLOWS_DIR, file))
}

console.log('\n=== Summary ===')
console.log(`Workflows: ${totalWorkflows}`)
console.log(`Errors:    ${totalErrors}`)
console.log(`Warnings:  ${totalWarnings} (credential placeholders expected)`)

if (totalErrors > 0) {
  console.log('\n\x1b[31mFAILED\x1b[0m - Fix errors before importing to N8N')
  process.exit(1)
} else {
  console.log('\n\x1b[32mPASSED\x1b[0m - All workflows structurally valid')
  process.exit(0)
}
