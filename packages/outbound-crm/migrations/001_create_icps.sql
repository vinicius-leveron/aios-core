-- Migration 001: Create ICPs table
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 2
-- Must run FIRST - referenced by leads, cadences, experiments

CREATE TABLE IF NOT EXISTS icps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    criteria JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_icps_company ON icps(company);
CREATE INDEX idx_icps_active ON icps(active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_icps_updated_at
    BEFORE UPDATE ON icps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE icps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on icps"
    ON icps
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read access on icps"
    ON icps
    FOR SELECT
    USING (auth.role() = 'authenticated');
