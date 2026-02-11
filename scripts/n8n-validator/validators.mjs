/**
 * n8n Workflow Validators
 *
 * Comprehensive validation rules for n8n workflow JSON files.
 * Covers: structure, expressions, connections, credentials, and best practices.
 */

// ============================================================================
// SEVERITY LEVELS
// ============================================================================

export const SEVERITY = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
}

// ============================================================================
// KNOWN NODE TYPES & METADATA
// ============================================================================

const TRIGGER_NODE_TYPES = new Set([
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.formTrigger',
  'n8n-nodes-base.start',
  'n8n-nodes-base.emailTrigger',
  'n8n-nodes-base.emailReadImap',
  'n8n-nodes-base.cronTrigger',
  'n8n-nodes-base.pollingTrigger',
  'n8n-nodes-base.sseTriger',
  'n8n-nodes-base.chatTrigger',
  '@n8n/n8n-nodes-langchain.chatTrigger',
])

const NON_EXECUTABLE_NODES = new Set([
  'n8n-nodes-base.stickyNote',
])

const MULTI_OUTPUT_NODES = new Set([
  'n8n-nodes-base.if',
  'n8n-nodes-base.switch',
  'n8n-nodes-base.errorTrigger',
])

const NODES_REQUIRING_CREDENTIALS = new Set([
  'n8n-nodes-base.slack',
  'n8n-nodes-base.gmail',
  'n8n-nodes-base.googleSheets',
  'n8n-nodes-base.postgres',
  'n8n-nodes-base.mysql',
  'n8n-nodes-base.mongodb',
  'n8n-nodes-base.redis',
  'n8n-nodes-base.telegram',
  'n8n-nodes-base.discord',
  'n8n-nodes-base.notion',
  'n8n-nodes-base.airtable',
  'n8n-nodes-base.stripe',
  'n8n-nodes-base.twilio',
  'n8n-nodes-base.sendGrid',
  'n8n-nodes-base.mailchimp',
  'n8n-nodes-base.hubspot',
  'n8n-nodes-base.salesforce',
  'n8n-nodes-base.jira',
  'n8n-nodes-base.github',
  'n8n-nodes-base.gitlab',
  'n8n-nodes-base.bitbucket',
  'n8n-nodes-base.aws',
  'n8n-nodes-base.googleDrive',
  'n8n-nodes-base.dropbox',
  'n8n-nodes-base.microsoftOutlook',
  'n8n-nodes-base.microsoftTeams',
  'n8n-nodes-base.openAi',
  '@n8n/n8n-nodes-langchain.lmOpenAi',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  '@n8n/n8n-nodes-langchain.lmChatAnthropic',
  'n8n-nodes-base.supabase',
  'n8n-nodes-base.n8n',
])

// ============================================================================
// STRUCTURE VALIDATOR
// ============================================================================

export function validateStructure(workflow) {
  const issues = []
  const wfName = workflow.name || '(unnamed)'

  // Top-level required fields
  if (!workflow.name || typeof workflow.name !== 'string') {
    issues.push({
      severity: SEVERITY.ERROR,
      rule: 'STRUCT-001',
      message: 'Workflow missing or invalid "name" field',
      context: { field: 'name', value: workflow.name },
    })
  }

  if (!Array.isArray(workflow.nodes)) {
    issues.push({
      severity: SEVERITY.ERROR,
      rule: 'STRUCT-002',
      message: 'Workflow missing or invalid "nodes" array',
      context: { field: 'nodes' },
    })
    return issues // Can't continue without nodes
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    issues.push({
      severity: SEVERITY.ERROR,
      rule: 'STRUCT-003',
      message: 'Workflow missing or invalid "connections" object',
      context: { field: 'connections' },
    })
  }

  // Node-level validations
  const nodeNames = new Set()
  const nodeIds = new Set()
  let hasTrigger = false

  for (const node of workflow.nodes) {
    // Required fields
    if (!node.id) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'STRUCT-010',
        message: `Node "${node.name || '?'}" missing "id" field`,
        context: { node: node.name },
      })
    } else if (nodeIds.has(node.id)) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'STRUCT-011',
        message: `Duplicate node ID: "${node.id}"`,
        context: { nodeId: node.id, node: node.name },
      })
    } else {
      nodeIds.add(node.id)
    }

    if (!node.name || typeof node.name !== 'string') {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'STRUCT-012',
        message: `Node missing or invalid "name" field (id: ${node.id || '?'})`,
        context: { nodeId: node.id },
      })
    } else if (nodeNames.has(node.name)) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'STRUCT-013',
        message: `Duplicate node name: "${node.name}" - connections will be ambiguous`,
        context: { node: node.name },
      })
    } else {
      nodeNames.add(node.name)
    }

    if (!node.type || typeof node.type !== 'string') {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'STRUCT-014',
        message: `Node "${node.name || '?'}" missing or invalid "type" field`,
        context: { node: node.name },
      })
    } else {
      // Validate type pattern
      const validTypePattern = /^(n8n-nodes-base\.|@n8n\/|n8n-nodes-community\.|n8n-nodes-)/
      if (!validTypePattern.test(node.type)) {
        issues.push({
          severity: SEVERITY.WARNING,
          rule: 'STRUCT-015',
          message: `Node "${node.name}" has unusual type: "${node.type}" (expected n8n-nodes-base.* or @n8n/*)`,
          context: { node: node.name, type: node.type },
        })
      }

      // Check if trigger
      if (TRIGGER_NODE_TYPES.has(node.type) || node.type.toLowerCase().includes('trigger')) {
        hasTrigger = true
      }
    }

    // Position validation
    if (!Array.isArray(node.position) || node.position.length !== 2) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'STRUCT-016',
        message: `Node "${node.name}" has invalid position (expected [x, y])`,
        context: { node: node.name, position: node.position },
      })
    } else if (typeof node.position[0] !== 'number' || typeof node.position[1] !== 'number') {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'STRUCT-017',
        message: `Node "${node.name}" position contains non-numeric values`,
        context: { node: node.name, position: node.position },
      })
    }

    // TypeVersion validation
    if (node.typeVersion !== undefined && typeof node.typeVersion !== 'number') {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'STRUCT-018',
        message: `Node "${node.name}" has non-numeric typeVersion: ${node.typeVersion}`,
        context: { node: node.name, typeVersion: node.typeVersion },
      })
    }

    // Empty parameters on nodes that typically need config
    if (
      node.parameters &&
      Object.keys(node.parameters).length === 0 &&
      !NON_EXECUTABLE_NODES.has(node.type) &&
      node.type !== 'n8n-nodes-base.noOp' &&
      node.type !== 'n8n-nodes-base.manualTrigger' &&
      node.type !== 'n8n-nodes-base.start'
    ) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'STRUCT-019',
        message: `Node "${node.name}" (${node.type}) has empty parameters - may need configuration`,
        context: { node: node.name, type: node.type },
      })
    }
  }

  // Trigger check
  if (!hasTrigger) {
    issues.push({
      severity: SEVERITY.WARNING,
      rule: 'STRUCT-020',
      message: 'Workflow has no trigger node - cannot be activated automatically',
      context: {},
    })
  }

  // Meta/settings recommendations
  if (!workflow.settings || !workflow.settings.executionOrder) {
    issues.push({
      severity: SEVERITY.INFO,
      rule: 'STRUCT-030',
      message: 'Workflow missing settings.executionOrder (recommend "v1" for modern behavior)',
      context: {},
    })
  }

  if (!workflow.meta) {
    issues.push({
      severity: SEVERITY.INFO,
      rule: 'STRUCT-031',
      message: 'Workflow missing "meta" object (recommended for n8n 1.6+)',
      context: {},
    })
  }

  return issues
}

// ============================================================================
// EXPRESSION VALIDATOR
// ============================================================================

const EXPRESSION_PATTERN = /=\{\{([\s\S]*?)\}\}/g
const DOUBLE_BRACE_PATTERN = /\{\{([\s\S]*?)\}\}/g
const NODE_REF_PATTERNS = [
  /\$\('([^']+)'\)/g,         // $('Node Name')
  /\$\("([^"]+)"\)/g,         // $("Node Name")
  /\$node\["([^"]+)"\]/g,     // $node["Node Name"]
  /\$node\['([^']+)'\]/g,     // $node['Node Name']
  /\$node\.([a-zA-Z_]\w*)/g,  // $node.NodeName (no spaces)
]

const VALID_BUILTINS = new Set([
  '$json', '$binary', '$input', '$execution', '$workflow', '$prevNode',
  '$runIndex', '$itemIndex', '$env', '$vars', '$now', '$today', '$mode',
  '$fromAI', '$jmespath', '$node', '$items', '$parameter', '$position',
  '$evaluateExpression', '$ifEmpty', '$response', '$request', '$pageCount',
  '$resumeWebhookUrl',
])

export function validateExpressions(workflow) {
  const issues = []
  const nodeNames = new Set(workflow.nodes.map(n => n.name))
  const codeNodeTypes = new Set([
    'n8n-nodes-base.code',
    'n8n-nodes-base.function',
    'n8n-nodes-base.functionItem',
  ])

  for (const node of workflow.nodes) {
    if (NON_EXECUTABLE_NODES.has(node.type)) continue
    if (!node.parameters) continue

    const isCodeNode = codeNodeTypes.has(node.type)

    // Recursively scan all string parameters
    scanParameterExpressions(
      node.parameters,
      node.name,
      isCodeNode,
      nodeNames,
      issues,
      ''
    )
  }

  return issues
}

function scanParameterExpressions(obj, nodeName, isCodeNode, nodeNames, issues, path) {
  if (typeof obj === 'string') {
    validateExpressionString(obj, nodeName, isCodeNode, nodeNames, issues, path)
    return
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      scanParameterExpressions(item, nodeName, isCodeNode, nodeNames, issues, `${path}[${i}]`)
    })
    return
  }

  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      scanParameterExpressions(value, nodeName, isCodeNode, nodeNames, issues, `${path}.${key}`)
    }
  }
}

function validateExpressionString(str, nodeName, isCodeNode, nodeNames, issues, path) {
  // Check for expressions in code nodes (anti-pattern)
  if (isCodeNode && EXPRESSION_PATTERN.test(str)) {
    // Only flag if it's in jsCode/functionCode parameter
    if (path.includes('jsCode') || path.includes('functionCode') || path.includes('code')) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'EXPR-001',
        message: `Node "${nodeName}": Expression syntax ={{ }} found inside Code node at ${path}. Use variables directly ($json.field) instead.`,
        context: { node: nodeName, path, snippet: str.substring(0, 100) },
      })
    }
  }

  // Reset regex lastIndex
  EXPRESSION_PATTERN.lastIndex = 0

  // Find all ={{ }} expressions
  let match
  const expressionRegex = /=\{\{([\s\S]*?)\}\}/g
  while ((match = expressionRegex.exec(str)) !== null) {
    const exprContent = match[1].trim()

    // Empty expression
    if (!exprContent) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'EXPR-002',
        message: `Node "${nodeName}": Empty expression ={{ }} at ${path}`,
        context: { node: nodeName, path },
      })
      continue
    }

    // Check for trailing dot (common syntax error)
    if (/\.\s*$/.test(exprContent)) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'EXPR-003',
        message: `Node "${nodeName}": Expression ends with trailing dot at ${path}: "{{ ${exprContent} }}"`,
        context: { node: nodeName, path, expression: exprContent },
      })
    }

    // Check node references exist
    for (const pattern of NODE_REF_PATTERNS) {
      pattern.lastIndex = 0
      let refMatch
      while ((refMatch = pattern.exec(exprContent)) !== null) {
        const referencedNode = refMatch[1]
        if (!nodeNames.has(referencedNode)) {
          issues.push({
            severity: SEVERITY.ERROR,
            rule: 'EXPR-010',
            message: `Node "${nodeName}": Expression references non-existent node "${referencedNode}" at ${path}`,
            context: { node: nodeName, path, referencedNode, expression: exprContent },
          })
        }
      }
    }

    // Check for unbalanced braces within expression
    const openBraces = (exprContent.match(/\{/g) || []).length
    const closeBraces = (exprContent.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'EXPR-011',
        message: `Node "${nodeName}": Unbalanced braces in expression at ${path}: "{{ ${exprContent} }}"`,
        context: { node: nodeName, path, expression: exprContent },
      })
    }

    // Check for unclosed string literals
    const singleQuotes = (exprContent.match(/'/g) || []).length
    const doubleQuotes = (exprContent.match(/"/g) || []).length
    const backticks = (exprContent.match(/`/g) || []).length
    if (singleQuotes % 2 !== 0) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'EXPR-012',
        message: `Node "${nodeName}": Unclosed single quote in expression at ${path}`,
        context: { node: nodeName, path, expression: exprContent },
      })
    }
    if (doubleQuotes % 2 !== 0) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'EXPR-013',
        message: `Node "${nodeName}": Unclosed double quote in expression at ${path}`,
        context: { node: nodeName, path, expression: exprContent },
      })
    }
    if (backticks % 2 !== 0) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'EXPR-014',
        message: `Node "${nodeName}": Unclosed backtick in expression at ${path}`,
        context: { node: nodeName, path, expression: exprContent },
      })
    }

    // Check $node.Name without brackets when name has spaces
    const dotNodePattern = /\$node\.([^.[}\s]+)/g
    let dotMatch
    while ((dotMatch = dotNodePattern.exec(exprContent)) !== null) {
      const refName = dotMatch[1]
      // Check if there's a node whose name has spaces and starts with this
      for (const name of nodeNames) {
        if (name.includes(' ') && name.startsWith(refName) && refName !== name) {
          issues.push({
            severity: SEVERITY.ERROR,
            rule: 'EXPR-020',
            message: `Node "${nodeName}": Node name "${name}" has spaces but is accessed via dot notation ($node.${refName}). Use $node["${name}"] or $('${name}') instead.`,
            context: { node: nodeName, path, referencedNode: name },
          })
        }
      }
    }
  }

  // Detect common mistakes: single braces { } instead of {{ }}
  if (!isCodeNode && str.includes('={') && !str.includes('={{')) {
    const singleBracePattern = /=\{([^{][\s\S]*?)\}/
    if (singleBracePattern.test(str)) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'EXPR-030',
        message: `Node "${nodeName}": Possible single-brace expression at ${path}. n8n uses ={{ }} (double braces).`,
        context: { node: nodeName, path, snippet: str.substring(0, 100) },
      })
    }
  }

  // Detect $json without braces (in non-code nodes, not inside ={{ }})
  if (!isCodeNode) {
    // Remove all valid expressions first
    const withoutExpressions = str.replace(/=\{\{[\s\S]*?\}\}/g, '')
    if (/\$json\b/.test(withoutExpressions) || /\$input\b/.test(withoutExpressions)) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'EXPR-031',
        message: `Node "${nodeName}": Found $json/$input outside of expression braces at ${path}. Wrap in ={{ $json.field }} for dynamic values.`,
        context: { node: nodeName, path, snippet: withoutExpressions.substring(0, 100) },
      })
    }
  }
}

// ============================================================================
// CONNECTION VALIDATOR
// ============================================================================

export function validateConnections(workflow) {
  const issues = []

  if (!workflow.connections || !Array.isArray(workflow.nodes)) return issues

  const nodeNames = new Set(workflow.nodes.map(n => n.name))
  const nodesByName = Object.fromEntries(workflow.nodes.map(n => [n.name, n]))
  const incomingConnections = new Set()
  const outgoingConnections = new Set()

  // Validate each connection
  for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
    // Source node must exist
    if (!nodeNames.has(sourceName)) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'CONN-001',
        message: `Connection from non-existent source node: "${sourceName}"`,
        context: { sourceNode: sourceName },
      })
      continue
    }

    outgoingConnections.add(sourceName)

    if (!outputs.main || !Array.isArray(outputs.main)) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'CONN-002',
        message: `Connection for "${sourceName}" has no "main" output array`,
        context: { sourceNode: sourceName },
      })
      continue
    }

    // Validate each output branch
    for (let branchIdx = 0; branchIdx < outputs.main.length; branchIdx++) {
      const branch = outputs.main[branchIdx]
      if (!Array.isArray(branch)) continue

      for (const conn of branch) {
        if (!conn.node) {
          issues.push({
            severity: SEVERITY.ERROR,
            rule: 'CONN-010',
            message: `Connection from "${sourceName}" (branch ${branchIdx}) has empty target`,
            context: { sourceNode: sourceName, branch: branchIdx },
          })
          continue
        }

        // Target node must exist
        if (!nodeNames.has(conn.node)) {
          issues.push({
            severity: SEVERITY.ERROR,
            rule: 'CONN-011',
            message: `Connection from "${sourceName}" to non-existent target: "${conn.node}"`,
            context: { sourceNode: sourceName, targetNode: conn.node },
          })
        } else {
          incomingConnections.add(conn.node)
        }

        // Connection type validation
        if (conn.type && conn.type !== 'main' && conn.type !== 'ai_tool' && conn.type !== 'ai_outputParser' && conn.type !== 'ai_memory' && conn.type !== 'ai_languageModel') {
          issues.push({
            severity: SEVERITY.WARNING,
            rule: 'CONN-012',
            message: `Connection from "${sourceName}" to "${conn.node}" has unusual type: "${conn.type}"`,
            context: { sourceNode: sourceName, targetNode: conn.node, type: conn.type },
          })
        }
      }
    }
  }

  // Check for orphan nodes (no incoming AND no outgoing, not a trigger)
  for (const node of workflow.nodes) {
    if (NON_EXECUTABLE_NODES.has(node.type)) continue

    const isTrigger = TRIGGER_NODE_TYPES.has(node.type) || node.type.toLowerCase().includes('trigger')
    const hasIncoming = incomingConnections.has(node.name)
    const hasOutgoing = outgoingConnections.has(node.name)

    if (!hasIncoming && !hasOutgoing && !isTrigger) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'CONN-020',
        message: `Node "${node.name}" (${node.type}) is completely disconnected - will never execute`,
        context: { node: node.name, type: node.type },
      })
    } else if (!hasIncoming && !isTrigger) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'CONN-021',
        message: `Node "${node.name}" (${node.type}) has no incoming connections - may never receive data`,
        context: { node: node.name, type: node.type },
      })
    }
  }

  // Check for circular references (simple detection)
  const circularPaths = detectCircularConnections(workflow)
  for (const path of circularPaths) {
    issues.push({
      severity: SEVERITY.WARNING,
      rule: 'CONN-030',
      message: `Potential circular connection detected: ${path.join(' -> ')}`,
      context: { path },
    })
  }

  // Check webhook -> respondToWebhook pairing
  const webhookNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.webhook')
  const respondNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.respondToWebhook')
  for (const wh of webhookNodes) {
    const responseMode = wh.parameters?.responseMode
    if (responseMode === 'responseNode' && respondNodes.length === 0) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'CONN-040',
        message: `Webhook "${wh.name}" set to "Response Node" mode but no "Respond to Webhook" node found`,
        context: { node: wh.name },
      })
    }
  }

  return issues
}

function detectCircularConnections(workflow) {
  const graph = {}
  const circular = []

  if (!workflow.connections) return circular

  // Build adjacency list
  for (const [source, outputs] of Object.entries(workflow.connections)) {
    if (!graph[source]) graph[source] = []
    if (outputs.main) {
      for (const branch of outputs.main) {
        if (Array.isArray(branch)) {
          for (const conn of branch) {
            if (conn.node) graph[source].push(conn.node)
          }
        }
      }
    }
  }

  // DFS cycle detection
  const visited = new Set()
  const inStack = new Set()

  function dfs(node, path) {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node)
      circular.push([...path.slice(cycleStart), node])
      return
    }
    if (visited.has(node)) return

    visited.add(node)
    inStack.add(node)
    path.push(node)

    for (const neighbor of (graph[node] || [])) {
      dfs(neighbor, path)
    }

    path.pop()
    inStack.delete(node)
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, [])
    }
  }

  return circular
}

// ============================================================================
// CREDENTIAL VALIDATOR
// ============================================================================

export function validateCredentials(workflow) {
  const issues = []
  const credentialSummary = []

  for (const node of workflow.nodes) {
    if (NON_EXECUTABLE_NODES.has(node.type)) continue

    // Check if node type typically requires credentials
    const likelyNeedsCreds = NODES_REQUIRING_CREDENTIALS.has(node.type)

    // Check HTTP Request node for auth
    if (node.type === 'n8n-nodes-base.httpRequest') {
      const auth = node.parameters?.authentication
      if (auth && auth !== 'none') {
        if (!node.credentials || Object.keys(node.credentials).length === 0) {
          issues.push({
            severity: SEVERITY.ERROR,
            rule: 'CRED-001',
            message: `Node "${node.name}" (HTTP Request) has authentication="${auth}" but no credentials configured`,
            context: { node: node.name, auth },
          })
        }
      }

      // Check for hardcoded auth headers
      if (node.parameters?.headerParameters?.parameters) {
        for (const param of node.parameters.headerParameters.parameters) {
          const headerName = (param.name || '').toLowerCase()
          if (
            headerName === 'authorization' ||
            headerName === 'x-api-key' ||
            headerName === 'api-key'
          ) {
            const value = param.value || ''
            // Check if it's a static value (not an expression)
            if (value && !value.startsWith('={{')) {
              issues.push({
                severity: SEVERITY.ERROR,
                rule: 'CRED-010',
                message: `Node "${node.name}": Hardcoded "${param.name}" header found. Use n8n credentials instead for security.`,
                context: { node: node.name, header: param.name },
              })
            }
          }
        }
      }

      // Check for sensitive data in URL
      const url = node.parameters?.url || ''
      if (/[?&](api_key|apikey|api-key|token|secret|password|key)=/i.test(url) && !url.startsWith('={{')) {
        issues.push({
          severity: SEVERITY.WARNING,
          rule: 'CRED-011',
          message: `Node "${node.name}": URL may contain hardcoded API key/token. Consider using credentials or environment variables.`,
          context: { node: node.name },
        })
      }
    }

    // Check nodes that typically need credentials
    if (likelyNeedsCreds && (!node.credentials || Object.keys(node.credentials).length === 0)) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'CRED-002',
        message: `Node "${node.name}" (${node.type}) typically requires credentials but none configured`,
        context: { node: node.name, type: node.type },
      })
    }

    // Collect credential summary
    if (node.credentials) {
      for (const [credType, credRef] of Object.entries(node.credentials)) {
        credentialSummary.push({
          node: node.name,
          nodeType: node.type,
          credentialType: credType,
          credentialName: credRef.name || '(unnamed)',
          credentialId: credRef.id || '(no id)',
        })
      }
    }
  }

  // Check for webhook security
  for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-base.webhook') {
      const auth = node.parameters?.authentication
      if (!auth || auth === 'none') {
        issues.push({
          severity: SEVERITY.WARNING,
          rule: 'CRED-020',
          message: `Webhook "${node.name}" has no authentication - endpoint is publicly accessible`,
          context: { node: node.name, path: node.parameters?.path },
        })
      }
    }
  }

  // Check for sensitive data in Set/Edit Fields nodes
  for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-base.set') {
      scanForHardcodedSecrets(node, issues)
    }
  }

  return { issues, credentialSummary }
}

function scanForHardcodedSecrets(node, issues) {
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/,           // OpenAI keys
    /xoxb-[a-zA-Z0-9-]+/,            // Slack bot tokens
    /ghp_[a-zA-Z0-9]{36}/,           // GitHub tokens
    /gho_[a-zA-Z0-9]{36}/,           // GitHub OAuth tokens
    /AIza[a-zA-Z0-9_-]{35}/,         // Google API keys
    /AKIA[A-Z0-9]{16}/,              // AWS access keys
    /Bearer\s+[a-zA-Z0-9._-]{20,}/,  // Bearer tokens
    /Basic\s+[a-zA-Z0-9+/=]{20,}/,   // Basic auth
  ]

  const paramStr = JSON.stringify(node.parameters || {})
  for (const pattern of sensitivePatterns) {
    if (pattern.test(paramStr)) {
      issues.push({
        severity: SEVERITY.ERROR,
        rule: 'CRED-030',
        message: `Node "${node.name}" may contain hardcoded secrets/tokens. Use n8n credentials or $env variables.`,
        context: { node: node.name, pattern: pattern.source },
      })
      break // One warning per node is enough
    }
  }
}

// ============================================================================
// BEST PRACTICES VALIDATOR
// ============================================================================

export function validateBestPractices(workflow) {
  const issues = []

  // Check for error handling
  const hasErrorWorkflow = workflow.settings?.errorWorkflow
  const hasErrorTrigger = workflow.nodes.some(n => n.type === 'n8n-nodes-base.errorTrigger')

  if (!hasErrorWorkflow && !hasErrorTrigger) {
    issues.push({
      severity: SEVERITY.INFO,
      rule: 'BEST-001',
      message: 'No error handling configured. Consider setting an error workflow or adding error trigger nodes.',
      context: {},
    })
  }

  // Check for continueOnFail patterns
  const nodesWithContinueOnFail = workflow.nodes.filter(
    n => n.parameters?.options?.continueOnFail === true ||
         n.continueOnFail === true ||
         n.onError === 'continueRegularOutput'
  )
  if (nodesWithContinueOnFail.length > 3) {
    issues.push({
      severity: SEVERITY.WARNING,
      rule: 'BEST-002',
      message: `${nodesWithContinueOnFail.length} nodes have "Continue On Fail" enabled. This may silently swallow errors. Consider proper error handling instead.`,
      context: { nodes: nodesWithContinueOnFail.map(n => n.name) },
    })
  }

  // Check for very large workflows
  if (workflow.nodes.length > 50) {
    issues.push({
      severity: SEVERITY.WARNING,
      rule: 'BEST-003',
      message: `Workflow has ${workflow.nodes.length} nodes. Consider splitting into sub-workflows for maintainability.`,
      context: { nodeCount: workflow.nodes.length },
    })
  }

  // Check for deprecated node types
  const deprecatedTypes = {
    'n8n-nodes-base.function': 'Use "Code" node instead',
    'n8n-nodes-base.functionItem': 'Use "Code" node with "Run Once for Each Item" instead',
    'n8n-nodes-base.start': 'Use "Manual Trigger" node instead',
  }

  for (const node of workflow.nodes) {
    if (deprecatedTypes[node.type]) {
      issues.push({
        severity: SEVERITY.WARNING,
        rule: 'BEST-010',
        message: `Node "${node.name}" uses deprecated type "${node.type}". ${deprecatedTypes[node.type]}`,
        context: { node: node.name, type: node.type, replacement: deprecatedTypes[node.type] },
      })
    }
  }

  // Check for duplicate sticky notes (possible copy-paste)
  const stickyNotes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote')
  const stickyContents = stickyNotes.map(n => n.parameters?.content).filter(Boolean)
  const duplicateStickies = stickyContents.filter((c, i) => stickyContents.indexOf(c) !== i)
  if (duplicateStickies.length > 0) {
    issues.push({
      severity: SEVERITY.INFO,
      rule: 'BEST-011',
      message: `Found ${duplicateStickies.length} duplicate sticky notes - possible copy-paste artifacts`,
      context: {},
    })
  }

  // Check for Execute Workflow nodes referencing sub-workflows
  for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-base.executeWorkflow') {
      if (!node.parameters?.workflowId && !node.parameters?.workflowIdValue) {
        issues.push({
          severity: SEVERITY.ERROR,
          rule: 'BEST-020',
          message: `Node "${node.name}" (Execute Workflow) has no workflow ID configured`,
          context: { node: node.name },
        })
      }
    }
  }

  // Check SplitInBatches without proper loop back
  for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-base.splitInBatches') {
      // Check if there's a connection back to this node
      const hasLoopBack = Object.values(workflow.connections || {}).some(outputs => {
        if (!outputs.main) return false
        return outputs.main.some(branch =>
          Array.isArray(branch) && branch.some(conn => conn.node === node.name)
        )
      })
      if (!hasLoopBack) {
        issues.push({
          severity: SEVERITY.WARNING,
          rule: 'BEST-021',
          message: `Node "${node.name}" (SplitInBatches) has no loop-back connection. Batching may not work correctly.`,
          context: { node: node.name },
        })
      }
    }
  }

  return issues
}

// ============================================================================
// MAIN VALIDATOR (ORCHESTRATOR)
// ============================================================================

export function validateWorkflow(workflow) {
  const allIssues = []

  // Structure
  const structureIssues = validateStructure(workflow)
  allIssues.push(...structureIssues.map(i => ({ ...i, category: 'Structure' })))

  // Expressions (only if we have nodes)
  if (Array.isArray(workflow.nodes)) {
    const expressionIssues = validateExpressions(workflow)
    allIssues.push(...expressionIssues.map(i => ({ ...i, category: 'Expression' })))
  }

  // Connections
  const connectionIssues = validateConnections(workflow)
  allIssues.push(...connectionIssues.map(i => ({ ...i, category: 'Connection' })))

  // Credentials
  const { issues: credIssues, credentialSummary } = validateCredentials(workflow)
  allIssues.push(...credIssues.map(i => ({ ...i, category: 'Credential' })))

  // Best Practices
  const bestPracticeIssues = validateBestPractices(workflow)
  allIssues.push(...bestPracticeIssues.map(i => ({ ...i, category: 'Best Practice' })))

  // Summary
  const errorCount = allIssues.filter(i => i.severity === SEVERITY.ERROR).length
  const warningCount = allIssues.filter(i => i.severity === SEVERITY.WARNING).length
  const infoCount = allIssues.filter(i => i.severity === SEVERITY.INFO).length

  return {
    workflow: {
      name: workflow.name || '(unnamed)',
      id: workflow.id || '(no id)',
      nodeCount: (workflow.nodes || []).length,
      active: workflow.active || false,
    },
    issues: allIssues,
    credentialSummary,
    summary: {
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
      total: allIssues.length,
      verdict: errorCount > 0 ? 'FAIL' : warningCount > 0 ? 'REVIEW' : 'PASS',
    },
  }
}
