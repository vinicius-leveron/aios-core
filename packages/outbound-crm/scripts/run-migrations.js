#!/usr/bin/env node
/**
 * Outbound CRM - Migration Runner
 *
 * Executes all SQL migrations against Supabase PostgreSQL.
 *
 * Usage:
 *   node scripts/run-migrations.js                    # Uses DATABASE_URL from .env
 *   node scripts/run-migrations.js --generate-sql     # Outputs combined SQL to stdout
 *   node scripts/run-migrations.js --output all.sql   # Saves combined SQL to file
 *
 * Requires:
 *   - DATABASE_URL in .env (from Supabase Dashboard > Settings > Database > Connection string)
 *   - OR: Use --generate-sql to get SQL for copy-paste into Supabase SQL Editor
 */

const fs = require('fs')
const path = require('path')

const PACKAGE_DIR = path.resolve(__dirname, '..')
const MIGRATIONS_DIR = path.join(PACKAGE_DIR, 'migrations')

function loadEnv() {
  const envPath = path.join(PACKAGE_DIR, '.env')
  if (!fs.existsSync(envPath)) {
    return {}
  }
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.substring(0, eqIdx).trim()
    const value = trimmed.substring(eqIdx + 1).trim()
    env[key] = value
  }
  return env
}

function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
  return files.map(f => ({
    name: f,
    path: path.join(MIGRATIONS_DIR, f),
    sql: fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8')
  }))
}

function generateCombinedSQL(migrations) {
  const parts = [
    '-- ============================================================',
    '-- Outbound CRM - Combined Migrations',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total migrations: ${migrations.length}`,
    '-- ============================================================',
    '-- Instructions:',
    '-- 1. Open Supabase Dashboard > SQL Editor',
    '-- 2. Create a new query',
    '-- 3. Paste this entire file',
    '-- 4. Click "Run"',
    '-- ============================================================',
    ''
  ]

  for (const m of migrations) {
    parts.push(`-- ====== ${m.name} ======`)
    parts.push(m.sql)
    parts.push('')
  }

  parts.push('-- ============================================================')
  parts.push('-- All migrations complete!')
  parts.push('-- ============================================================')

  return parts.join('\n')
}

async function runWithPg(migrations, databaseUrl) {
  let pg
  try {
    pg = require('pg')
  } catch {
    console.error('Error: pg module not installed.')
    console.error('Install with: npm install pg')
    console.error('')
    console.error('Or use --generate-sql to get SQL for the Supabase SQL Editor.')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: databaseUrl })

  try {
    console.log('Connecting to PostgreSQL...')
    await client.connect()
    console.log('Connected!\n')

    for (const m of migrations) {
      process.stdout.write(`Running: ${m.name}... `)
      try {
        await client.query(m.sql)
        console.log('OK')
      } catch (err) {
        console.log('FAILED')
        console.error(`  Error: ${err.message}`)
        if (err.message.includes('already exists')) {
          console.log('  (Skipping - already exists)')
          continue
        }
        throw err
      }
    }

    console.log(`\nAll ${migrations.length} migrations completed successfully!`)
  } finally {
    await client.end()
  }
}

async function main() {
  const args = process.argv.slice(2)
  const generateSQL = args.includes('--generate-sql')
  const outputIdx = args.indexOf('--output')
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null

  const migrations = getMigrationFiles()
  console.error(`Found ${migrations.length} migration files\n`)

  if (generateSQL) {
    const sql = generateCombinedSQL(migrations)
    process.stdout.write(sql)
    return
  }

  if (outputFile) {
    const sql = generateCombinedSQL(migrations)
    const outPath = path.resolve(outputFile)
    fs.writeFileSync(outPath, sql)
    console.log(`Combined SQL written to: ${outPath}`)
    console.log(`\nNext steps:`)
    console.log(`  1. Open Supabase Dashboard > SQL Editor`)
    console.log(`  2. Create new query`)
    console.log(`  3. Paste contents of ${outPath}`)
    console.log(`  4. Click "Run"`)
    return
  }

  // Try to run with pg
  const env = loadEnv()
  const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL

  if (!databaseUrl) {
    console.error('DATABASE_URL not found in .env or environment.')
    console.error('')
    console.error('Options:')
    console.error('  1. Add DATABASE_URL to .env (from Supabase > Settings > Database > Connection string)')
    console.error('  2. Run: DATABASE_URL="postgresql://..." node scripts/run-migrations.js')
    console.error('  3. Run: node scripts/run-migrations.js --generate-sql > all-migrations.sql')
    console.error('     Then paste into Supabase SQL Editor')
    console.error('')
    console.error('Generating combined SQL file instead...')
    const sql = generateCombinedSQL(migrations)
    const outPath = path.join(PACKAGE_DIR, 'all-migrations.sql')
    fs.writeFileSync(outPath, sql)
    console.log(`\nSaved to: ${outPath}`)
    console.log('Paste into Supabase Dashboard > SQL Editor > Run')
    return
  }

  await runWithPg(migrations, databaseUrl)
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
