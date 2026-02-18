/**
 * @synkra/n8n-validator
 *
 * Programmatic API for validating, fixing, and deploying n8n workflows.
 *
 * @example
 * import { validateWorkflow, fixWorkflow, deployWorkflow } from '@synkra/n8n-validator'
 *
 * const result = validateWorkflow(workflow)
 * if (result.summary.errors > 0) {
 *   const { workflow: fixed } = fixWorkflow(workflow, result)
 *   await deployWorkflow(url, apiKey, fixed)
 * }
 */

export { validateWorkflow, SEVERITY } from './validators.mjs'
export { fixWorkflow, deployWorkflow } from './fixer.mjs'
