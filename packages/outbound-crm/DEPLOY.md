# Outbound CRM - Deploy Guide

## Pre-requisites

- Node.js 18+
- Supabase project created
- N8N cloud instance
- Resend account with API key

## Quick Deploy (3 Steps)

### Step 1: Run SQL Migrations

Open Supabase Dashboard > SQL Editor > New Query.

Paste the contents of `all-migrations.sql` and click **Run**.

```bash
# Or generate it fresh:
node scripts/run-migrations.js --output all-migrations.sql
```

**Alternative (with DATABASE_URL):**
```bash
# Add to .env: DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
# Find this URL in Supabase > Settings > Database > Connection string > URI
node scripts/run-migrations.js
```

**Verify:** After running, check that these exist in Supabase:
- Tables: `icps`, `cadences`, `leads`, `message_templates`, `interactions`, `experiments`, `email_domains`
- Views: `pipeline_view`, `cadence_performance`, `domain_health`, `hot_leads`
- Functions: `increment_lead_counter`, `increment_domain_sent`, `decrement_domain_reputation`, `decay_lead_scores`, `reset_domain_daily_counters`

### Step 2: Test Resend Email

```bash
node scripts/test-resend.js
```

Check the inbox for the test email.

### Step 3: Import N8N Workflows

**Before importing**, create credentials in N8N UI:
1. Open N8N > Credentials > Add Credential
2. Create "Supabase" credential (URL + service role key)
3. Create "Resend" credential (API key)
4. Copy both credential IDs and add to `.env`:
   ```
   SUPABASE_CREDENTIAL_ID=<id-from-n8n>
   RESEND_CREDENTIAL_ID=<id-from-n8n>
   ```

**Then import:**
```bash
node scripts/import-workflows.js
```

**Alternative (manual):**
1. Open N8N > Workflows > Import from file
2. Import each JSON from `n8n-workflows/` folder
3. Update credential references in each workflow

## Verification Checklist

- [ ] 12 SQL migrations executed (7 tables, 4 views, 5 RPC functions, seed data)
- [ ] Test email received via Resend
- [ ] 12 N8N workflows imported
- [ ] Supabase credentials configured in N8N
- [ ] Resend credentials configured in N8N

## Files

| File | Purpose |
|------|---------|
| `.env` | Credentials (never commit) |
| `all-migrations.sql` | Combined SQL for Supabase SQL Editor |
| `scripts/run-migrations.js` | Node.js migration runner |
| `scripts/import-workflows.js` | N8N workflow importer |
| `scripts/test-resend.js` | Resend API test |
| `scripts/deploy.sh` | Bash deploy script (requires psql or supabase CLI) |
| `migrations/*.sql` | Individual SQL migration files |
| `n8n-workflows/*.json` | N8N workflow definitions |
| `edge-functions/` | Supabase Edge Functions (track, unsubscribe) |

## Edge Functions (Optional)

Edge Functions require the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase functions deploy track --project-ref vqvsiremljdowczsmnpx
supabase functions deploy unsubscribe --project-ref vqvsiremljdowczsmnpx
```

## Troubleshooting

**Migration fails "already exists":** Safe to ignore - migrations use `IF NOT EXISTS`.

**N8N import fails:** Import manually via N8N UI (Workflows > Import from file).

**Resend 403:** Check API key is correct. Free tier sends from `onboarding@resend.dev` only.

**N8N credentials:** Workflows reference credentials by ID. After importing, update credential references in each workflow's node settings.
