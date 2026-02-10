-- Migration 003: Create Leads table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 1
-- References: icps, cadences

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    email_validated BOOLEAN DEFAULT false,
    phone TEXT,
    whatsapp TEXT,
    linkedin_url TEXT,
    instagram_handle TEXT,

    -- Company
    company_name TEXT,
    company_website TEXT,
    company_size TEXT CHECK (company_size IN ('micro', 'small', 'medium', 'large') OR company_size IS NULL),
    industry TEXT,
    role TEXT,

    -- Qualification
    icp_id UUID REFERENCES icps(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    lead_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'enriched', 'unqualified', 'incomplete',
        'in_cadence', 'cadence_complete',
        'replied', 'meeting', 'proposal', 'won', 'lost',
        'bounced', 'unsubscribed'
    )),

    -- Cadence
    cadence_id UUID REFERENCES cadences(id) ON DELETE SET NULL,
    cadence_step INTEGER DEFAULT 0,
    cadence_started_at TIMESTAMPTZ,
    cadence_paused BOOLEAN DEFAULT false,

    -- Tracking
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    last_replied_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for frequent queries
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_icp_id ON leads(icp_id);
CREATE INDEX idx_leads_cadence_id ON leads(cadence_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_leads_last_contacted ON leads(last_contacted_at);

-- Composite index for cadence engine query
CREATE INDEX idx_leads_cadence_active ON leads(status, cadence_paused)
    WHERE status = 'in_cadence' AND cadence_paused = false;

-- Updated_at trigger
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on leads"
    ON leads
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on leads"
    ON leads
    FOR SELECT
    USING (auth.role() = 'authenticated');
