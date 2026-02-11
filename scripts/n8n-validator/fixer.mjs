/**
 * n8n Workflow Auto-Fixer
 *
 * Applies safe automatic corrections to n8n workflow JSON.
 * Only fixes issues that are deterministic and won't break the workflow.
 *
 * Each fix is logged so the user knows exactly what changed.
 */

// ============================================================================
// FIX REGISTRY
// ============================================================================

/**
 * Apply all safe fixes to a workflow and return the fixed version + changelog.
 * The original workflow object is NOT mutated - a deep clone is returned.
 */
export function fixWorkflow(workflow, validationResult) {
  const fixed = structuredClone(workflow)
  const changelog = []

  // Build helper maps
  const nodeNames = new Set(fixed.nodes.map(n => n.name))

  // Fix 1: Add missing settings.executionOrder
  fixExecutionOrder(fixed, changelog)

  // Fix 2: Add missing meta object
  fixMeta(fixed, changelog)

  // Fix 3: Fix expressions in all nodes
  for (const node of fixed.nodes) {
    if (!node.parameters) continue

    const isCodeNode = isCodeNodeType(node.type)

    // Fix trailing dots in expressions
    node.parameters = fixTrailingDots(node.parameters, node.name, changelog)

    // Fix dot notation for node names with spaces
    node.parameters = fixDotNotationSpaces(node.parameters, node.name, nodeNames, changelog)

    // Fix ={{ }} inside Code nodes
    if (isCodeNode) {
      node.parameters = fixExpressionsInCodeNode(node.parameters, node.name, changelog)
    }

    // Fix single braces ={} → ={{}}
    node.parameters = fixSingleBraces(node.parameters, node.name, changelog)
  }

  // Fix 4: Upgrade deprecated node types
  fixDeprecatedNodes(fixed, changelog)

  // Fix 5: Remove ghost connections (references to non-existent nodes)
  fixGhostConnections(fixed, changelog)

  // Fix 6: Add webhook responseMode fix
  fixWebhookResponseMode(fixed, changelog)

  return { workflow: fixed, changelog }
}

// ============================================================================
// INDIVIDUAL FIXERS
// ============================================================================

function fixExecutionOrder(workflow, changelog) {
  if (!workflow.settings) {
    workflow.settings = {}
  }
  if (!workflow.settings.executionOrder) {
    workflow.settings.executionOrder = 'v1'
    changelog.push({
      rule: 'FIX-STRUCT-030',
      action: 'Added settings.executionOrder = "v1"',
      auto: true,
    })
  }
}

function fixMeta(workflow, changelog) {
  if (!workflow.meta) {
    workflow.meta = {
      templateCredsSetupCompleted: true,
    }
    changelog.push({
      rule: 'FIX-STRUCT-031',
      action: 'Added meta object with templateCredsSetupCompleted',
      auto: true,
    })
  }
}

function fixTrailingDots(params, nodeName, changelog) {
  return deepTransformStrings(params, (str, path) => {
    const regex = /=\{\{([\s\S]*?)\}\}/g
    let modified = false

    const result = str.replace(regex, (match, expr) => {
      const trimmed = expr.trim()
      if (/\.\s*$/.test(trimmed)) {
        const fixed = trimmed.replace(/\.\s*$/, '')
        modified = true
        changelog.push({
          rule: 'FIX-EXPR-003',
          action: `Node "${nodeName}" ${path}: Fixed trailing dot "{{ ${trimmed} }}" → "{{ ${fixed} }}"`,
          auto: true,
        })
        return `={{ ${fixed} }}`
      }
      return match
    })

    return result
  })
}

function fixDotNotationSpaces(params, nodeName, nodeNames, changelog) {
  return deepTransformStrings(params, (str, path) => {
    const regex = /=\{\{([\s\S]*?)\}\}/g

    const result = str.replace(regex, (match, expr) => {
      let fixedExpr = expr

      // Fix $node.Name where "Name With Spaces" exists
      const dotNodePattern = /\$node\.([a-zA-Z_]\w*)/g
      let dotMatch
      while ((dotMatch = dotNodePattern.exec(expr)) !== null) {
        const refName = dotMatch[1]
        for (const name of nodeNames) {
          if (name.includes(' ') && name.startsWith(refName)) {
            // Replace $node.PartialName... with $('Full Name')...
            const restOfExpr = expr.substring(dotMatch.index + dotMatch[0].length)
            const jsonSuffix = restOfExpr.match(/^\.json\.(.*)/) || restOfExpr.match(/^\.json/)

            if (jsonSuffix) {
              const oldPart = `$node.${refName}${jsonSuffix[0]}`
              const fieldPart = jsonSuffix[1] ? `.item.json.${jsonSuffix[1]}` : '.item.json'
              const newPart = `$('${name}')${fieldPart}`
              fixedExpr = fixedExpr.replace(oldPart, newPart)

              changelog.push({
                rule: 'FIX-EXPR-020',
                action: `Node "${nodeName}" ${path}: Fixed dot notation "${oldPart}" → "${newPart}"`,
                auto: true,
              })
            }
            break
          }
        }
      }

      if (fixedExpr !== expr) {
        return `={{ ${fixedExpr.trim()} }}`
      }
      return match
    })

    return result
  })
}

function fixExpressionsInCodeNode(params, nodeName, changelog) {
  const codeFields = ['jsCode', 'functionCode', 'code']

  for (const field of codeFields) {
    if (typeof params[field] === 'string') {
      const original = params[field]
      // Replace ={{ expr }} with just expr
      const fixed = original.replace(/=\{\{\s*([\s\S]*?)\s*\}\}/g, (match, expr) => {
        return expr.trim()
      })

      if (fixed !== original) {
        params[field] = fixed
        changelog.push({
          rule: 'FIX-EXPR-001',
          action: `Node "${nodeName}": Removed ={{ }} wrapper from ${field} (Code nodes use variables directly)`,
          auto: true,
        })
      }
    }
  }

  return params
}

function fixSingleBraces(params, nodeName, changelog) {
  return deepTransformStrings(params, (str, path) => {
    // Match ={something} but NOT ={{something}}
    const singleBracePattern = /=\{([^{][\s\S]*?)\}/g

    if (singleBracePattern.test(str) && !str.includes('={{')) {
      singleBracePattern.lastIndex = 0
      const result = str.replace(singleBracePattern, (match, content) => {
        // Only fix if content looks like an n8n expression
        if (content.includes('$json') || content.includes('$node') ||
            content.includes('$input') || content.includes('$execution') ||
            content.includes('$env') || content.includes('$vars')) {
          changelog.push({
            rule: 'FIX-EXPR-030',
            action: `Node "${nodeName}" ${path}: Fixed single braces "={${content}}" → "={{ ${content} }}"`,
            auto: true,
          })
          return `={{ ${content} }}`
        }
        return match
      })
      return result
    }
    return str
  })
}

function fixDeprecatedNodes(workflow, changelog) {
  const upgrades = {
    'n8n-nodes-base.function': {
      newType: 'n8n-nodes-base.code',
      newVersion: 2,
      paramMap: (params) => ({
        jsCode: params.functionCode || 'return items;',
        mode: 'runOnceForAllItems',
      }),
    },
    'n8n-nodes-base.functionItem': {
      newType: 'n8n-nodes-base.code',
      newVersion: 2,
      paramMap: (params) => ({
        jsCode: params.functionCode || 'return item;',
        mode: 'runOnceForEachItem',
      }),
    },
    'n8n-nodes-base.start': {
      newType: 'n8n-nodes-base.manualTrigger',
      newVersion: 1,
      paramMap: () => ({}),
    },
  }

  for (const node of workflow.nodes) {
    const upgrade = upgrades[node.type]
    if (!upgrade) continue

    const oldType = node.type
    node.type = upgrade.newType
    node.typeVersion = upgrade.newVersion
    node.parameters = upgrade.paramMap(node.parameters || {})

    changelog.push({
      rule: 'FIX-BEST-010',
      action: `Node "${node.name}": Upgraded deprecated "${oldType}" → "${upgrade.newType}"`,
      auto: true,
    })
  }
}

function fixGhostConnections(workflow, changelog) {
  if (!workflow.connections) return

  const nodeNames = new Set(workflow.nodes.map(n => n.name))
  const toDelete = []

  for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
    // Remove connections from non-existent source nodes
    if (!nodeNames.has(sourceName)) {
      toDelete.push(sourceName)
      changelog.push({
        rule: 'FIX-CONN-001',
        action: `Removed ghost connection from non-existent source "${sourceName}"`,
        auto: true,
      })
      continue
    }

    // Remove connections to non-existent target nodes
    if (outputs.main && Array.isArray(outputs.main)) {
      for (let i = 0; i < outputs.main.length; i++) {
        if (!Array.isArray(outputs.main[i])) continue

        const originalLength = outputs.main[i].length
        outputs.main[i] = outputs.main[i].filter(conn => {
          if (conn.node && !nodeNames.has(conn.node)) {
            changelog.push({
              rule: 'FIX-CONN-011',
              action: `Removed connection from "${sourceName}" to non-existent target "${conn.node}"`,
              auto: true,
            })
            return false
          }
          return true
        })
      }
    }
  }

  for (const key of toDelete) {
    delete workflow.connections[key]
  }
}

function fixWebhookResponseMode(workflow, changelog) {
  const hasRespondNode = workflow.nodes.some(
    n => n.type === 'n8n-nodes-base.respondToWebhook'
  )

  if (hasRespondNode) return

  for (const node of workflow.nodes) {
    if (node.type !== 'n8n-nodes-base.webhook') continue
    if (node.parameters?.responseMode !== 'responseNode') continue

    // Switch to lastNode mode since there's no Respond to Webhook node
    node.parameters.responseMode = 'lastNode'
    changelog.push({
      rule: 'FIX-CONN-040',
      action: `Webhook "${node.name}": Changed responseMode from "responseNode" to "lastNode" (no Respond to Webhook node found)`,
      auto: true,
    })
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function isCodeNodeType(type) {
  return type === 'n8n-nodes-base.code' ||
         type === 'n8n-nodes-base.function' ||
         type === 'n8n-nodes-base.functionItem'
}

/**
 * Recursively walk an object, applying a transform function to all string values.
 * Returns a new object (does not mutate).
 */
function deepTransformStrings(obj, transformFn, path = '') {
  if (typeof obj === 'string') {
    return transformFn(obj, path)
  }

  if (Array.isArray(obj)) {
    return obj.map((item, i) => deepTransformStrings(item, transformFn, `${path}[${i}]`))
  }

  if (obj && typeof obj === 'object') {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepTransformStrings(value, transformFn, `${path}.${key}`)
    }
    return result
  }

  return obj
}

// ============================================================================
// N8N API DEPLOYER
// ============================================================================

/**
 * Deploy a fixed workflow back to n8n via PUT API.
 * Returns { success, message, response? }
 */
export async function deployWorkflow(baseUrl, apiKey, workflow) {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/workflows/${workflow.id}`

  // Prepare the payload - only send fields that n8n accepts
  const payload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {},
    staticData: workflow.staticData || null,
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return {
      success: false,
      message: `API error ${response.status}: ${response.statusText} - ${text}`,
    }
  }

  const data = await response.json()
  return {
    success: true,
    message: `Workflow "${workflow.name}" (${workflow.id}) deployed successfully`,
    response: data,
  }
}
