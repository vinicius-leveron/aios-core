#!/usr/bin/env node

/**
 * n8n Workflow Validator MCP Server
 *
 * Exposes n8n workflow validation, fixing, and deployment as MCP tools
 * for use with Claude.ai and other MCP-compatible clients.
 *
 * Environment variables:
 *   N8N_URL     - n8n instance URL (e.g., https://n8n.example.com)
 *   N8N_API_KEY - n8n API key for authentication
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// Import validator functions (relative path for monorepo, will work with npm too)
import { validateWorkflow, fixWorkflow, deployWorkflow } from '@vinicius-leveron/n8n-validator'

// ============================================================================
// SCHEMAS
// ============================================================================

const WorkflowJsonSchema = z.object({
  workflow: z.string()
    .describe('The n8n workflow as a JSON string')
})

const DeploySchema = z.object({
  workflow: z.string()
    .describe('The n8n workflow as a JSON string'),
  url: z.string()
    .optional()
    .describe('n8n instance URL (defaults to N8N_URL env var)'),
  apiKey: z.string()
    .optional()
    .describe('n8n API key (defaults to N8N_API_KEY env var)')
})

const ListWorkflowsSchema = z.object({
  url: z.string()
    .optional()
    .describe('n8n instance URL (defaults to N8N_URL env var)'),
  apiKey: z.string()
    .optional()
    .describe('n8n API key (defaults to N8N_API_KEY env var)')
})

const WorkflowIdSchema = z.object({
  workflowId: z.string()
    .describe('The workflow ID'),
  url: z.string()
    .optional()
    .describe('n8n instance URL (defaults to N8N_URL env var)'),
  apiKey: z.string()
    .optional()
    .describe('n8n API key (defaults to N8N_API_KEY env var)')
})

const ExecuteWorkflowSchema = z.object({
  workflowId: z.string()
    .describe('The workflow ID to execute'),
  inputData: z.string()
    .optional()
    .describe('Optional JSON input data for the workflow'),
  url: z.string()
    .optional()
    .describe('n8n instance URL (defaults to N8N_URL env var)'),
  apiKey: z.string()
    .optional()
    .describe('n8n API key (defaults to N8N_API_KEY env var)')
})

// ============================================================================
// HELPERS
// ============================================================================

function getN8nConfig(params) {
  const url = params.url || process.env.N8N_URL
  const apiKey = params.apiKey || process.env.N8N_API_KEY

  if (!url) {
    throw new Error('n8n URL not provided. Set N8N_URL environment variable or pass url parameter.')
  }
  if (!apiKey) {
    throw new Error('n8n API key not provided. Set N8N_API_KEY environment variable or pass apiKey parameter.')
  }

  return { url: url.replace(/\/+$/, ''), apiKey }
}

function parseWorkflowJson(workflowStr) {
  try {
    return JSON.parse(workflowStr)
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`)
  }
}

async function fetchWorkflows(url, apiKey) {
  const response = await fetch(`${url}/api/v1/workflows?limit=100`, {
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || data
}

// ============================================================================
// MCP SERVER
// ============================================================================

const server = new McpServer({
  name: 'n8n-validator-mcp',
  version: '1.0.0'
})

// Tool: Validate Workflow
server.tool(
  'n8n_validate_workflow',
  'Validates an n8n workflow JSON and returns any issues found. Use this to check if a workflow is valid before deploying.',
  WorkflowJsonSchema.shape,
  async (params) => {
    try {
      const workflow = parseWorkflowJson(params.workflow)
      const result = validateWorkflow(workflow)

      const response = {
        valid: result.summary.errors === 0,
        summary: result.summary,
        issues: result.issues.map(i => ({
          severity: i.severity,
          rule: i.rule,
          message: i.message,
          category: i.category
        })),
        credentialsRequired: result.credentialSummary || []
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: Fix Workflow
server.tool(
  'n8n_fix_workflow',
  'Automatically fixes common issues in an n8n workflow JSON. Returns the fixed workflow and a changelog of what was changed.',
  WorkflowJsonSchema.shape,
  async (params) => {
    try {
      const workflow = parseWorkflowJson(params.workflow)

      // First validate to get issues
      const validation = validateWorkflow(workflow)

      // Then fix
      const { workflow: fixed, changelog } = fixWorkflow(workflow, validation)

      // Re-validate to show remaining issues
      const postFix = validateWorkflow(fixed)

      const response = {
        fixed: changelog.length > 0,
        changelog: changelog.map(c => ({
          rule: c.rule,
          action: c.action
        })),
        remainingIssues: {
          errors: postFix.summary.errors,
          warnings: postFix.summary.warnings
        },
        fixedWorkflow: fixed
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: Deploy Workflow
server.tool(
  'n8n_deploy_workflow',
  'Deploys a workflow to an n8n instance. Creates a new workflow or updates existing one if workflow has an ID.',
  DeploySchema.shape,
  async (params) => {
    try {
      const { url, apiKey } = getN8nConfig(params)
      const workflow = parseWorkflowJson(params.workflow)

      const result = await deployWorkflow(url, apiKey, workflow)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: List Workflows
server.tool(
  'n8n_list_workflows',
  'Lists all workflows from an n8n instance. Returns workflow names, IDs, and active status.',
  ListWorkflowsSchema.shape,
  async (params) => {
    try {
      const { url, apiKey } = getN8nConfig(params)
      const workflows = await fetchWorkflows(url, apiKey)

      const response = {
        count: workflows.length,
        workflows: workflows.map(wf => ({
          id: wf.id,
          name: wf.name,
          active: wf.active,
          createdAt: wf.createdAt,
          updatedAt: wf.updatedAt
        }))
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: Get Workflow
server.tool(
  'n8n_get_workflow',
  'Gets a specific workflow by ID from n8n. Returns the full workflow JSON.',
  WorkflowIdSchema.shape,
  async (params) => {
    try {
      const { url, apiKey } = getN8nConfig(params)

      const response = await fetch(`${url}/api/v1/workflows/${params.workflowId}`, {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
      }

      const workflow = await response.json()

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(workflow, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: Activate Workflow
server.tool(
  'n8n_activate_workflow',
  'Activates a workflow in n8n so it starts running automatically based on its triggers.',
  WorkflowIdSchema.shape,
  async (params) => {
    try {
      const { url, apiKey } = getN8nConfig(params)

      const response = await fetch(`${url}/api/v1/workflows/${params.workflowId}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, active: result.active, workflowId: params.workflowId }, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: Deactivate Workflow
server.tool(
  'n8n_deactivate_workflow',
  'Deactivates a workflow in n8n so it stops running automatically.',
  WorkflowIdSchema.shape,
  async (params) => {
    try {
      const { url, apiKey } = getN8nConfig(params)

      const response = await fetch(`${url}/api/v1/workflows/${params.workflowId}/deactivate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, active: result.active, workflowId: params.workflowId }, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: Delete Workflow
server.tool(
  'n8n_delete_workflow',
  'Deletes a workflow from n8n. This action is irreversible.',
  WorkflowIdSchema.shape,
  async (params) => {
    try {
      const { url, apiKey } = getN8nConfig(params)

      const response = await fetch(`${url}/api/v1/workflows/${params.workflowId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, deleted: true, workflowId: params.workflowId }, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// Tool: Execute Workflow
server.tool(
  'n8n_execute_workflow',
  'Executes a workflow manually in n8n. Optionally accepts input data.',
  ExecuteWorkflowSchema.shape,
  async (params) => {
    try {
      const { url, apiKey } = getN8nConfig(params)

      const body = {}
      if (params.inputData) {
        try {
          body.data = JSON.parse(params.inputData)
        } catch {
          throw new Error('Invalid inputData JSON')
        }
      }

      const response = await fetch(`${url}/api/v1/workflows/${params.workflowId}/run`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`n8n API error: ${response.status} ${response.statusText} - ${text}`)
      }

      const result = await response.json()

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            executionId: result.data?.executionId || result.executionId,
            workflowId: params.workflowId,
            result: result.data || result
          }, null, 2)
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      }
    }
  }
)

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('n8n-validator MCP server running via stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
