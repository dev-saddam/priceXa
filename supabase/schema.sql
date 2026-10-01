-- ==============================================================================
-- PriceXa Enterprise PostgreSQL Database Schema for Supabase
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Tenants (Companies / Brands)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT DEFAULT '🏢',
  industry TEXT DEFAULT 'E-Commerce',
  country TEXT DEFAULT 'US',
  country_code TEXT DEFAULT 'US',
  currency TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  plan_id TEXT DEFAULT 'growth',
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'trial', 'past_due', 'suspended')),
  scan_frequency TEXT DEFAULT '2x_daily',
  scan_times JSONB DEFAULT '["08:00 AM", "08:00 PM"]'::jsonb,
  last_scan_at TEXT DEFAULT 'Never',
  next_scan_at TEXT DEFAULT 'Today at 08:00 PM',
  sku_limit INTEGER DEFAULT 1500,
  competitor_limit INTEGER DEFAULT 15,
  contact_email TEXT NOT NULL,
  webhook_url TEXT DEFAULT '',
  email_alerts_enabled BOOLEAN DEFAULT true,
  auto_reprice_recommendation BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_country ON tenants(country);

-- ------------------------------------------------------------------------------
-- 2. Subscription Plans
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL,
  price_yearly NUMERIC(10, 2) NOT NULL,
  max_products INTEGER NOT NULL,
  max_competitors INTEGER NOT NULL,
  scan_frequency TEXT NOT NULL,
  scan_frequency_label TEXT NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  active_subscribers INTEGER DEFAULT 0,
  popular BOOLEAN DEFAULT false
);

-- ------------------------------------------------------------------------------
-- 3. Products (Tenant Catalog SKUs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  code TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  mrp NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  min_margin_percent NUMERIC(5, 2) DEFAULT 15.0,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  stock_count INTEGER DEFAULT 100,
  image_url TEXT DEFAULT '',
  product_url TEXT DEFAULT '',
  matches_count INTEGER DEFAULT 0,
  market_position TEXT DEFAULT 'unmatched' CHECK (market_position IN ('cheapest', 'competitive', 'expensive', 'unmatched')),
  lowest_competitor_price NUMERIC(12, 2),
  average_competitor_price NUMERIC(12, 2),
  matching_status TEXT DEFAULT 'unmatched' CHECK (matching_status IN ('fully_matched', 'partially_matched', 'unmatched', 'searching')),
  is_searching_competitors BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_market_pos ON products(market_position);

-- ------------------------------------------------------------------------------
-- 4. Competitors (Tracked Stores per Tenant)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  base_url TEXT NOT NULL,
  logo TEXT DEFAULT '🛒',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  monitored_products_count INTEGER DEFAULT 0,
  search_selector TEXT,
  avg_price_diff_percent NUMERIC(5, 2) DEFAULT 0,
  last_scraped_at TEXT DEFAULT 'Never',
  channel_type TEXT DEFAULT 'marketplace',
  platform TEXT DEFAULT 'amazon',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitors_tenant_id ON competitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitors_domain ON competitors(domain);

-- ------------------------------------------------------------------------------
-- 5. Competitor Product Matches (Matched Candidate Listings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_product_title TEXT NOT NULL,
  competitor_product_url TEXT NOT NULL,
  match_confidence INTEGER DEFAULT 90,
  match_type TEXT DEFAULT 'title_search' CHECK (match_type IN ('title_search', 'sku_exact', 'manual_override')),
  current_price NUMERIC(12, 2) NOT NULL,
  previous_price NUMERIC(12, 2) NOT NULL,
  regular_price NUMERIC(12, 2),
  price_diff NUMERIC(12, 2) DEFAULT 0,
  price_diff_percent NUMERIC(5, 2) DEFAULT 0,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  currency TEXT DEFAULT 'USD',
  last_checked_at TEXT DEFAULT 'Never',
  price_history JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending_review', 'rejected')),
  channel_type TEXT DEFAULT 'marketplace',
  platform TEXT DEFAULT 'amazon',
  seller_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_tenant_id ON matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matches_product_id ON matches(product_id);
CREATE INDEX IF NOT EXISTS idx_matches_competitor_id ON matches(competitor_id);

-- ------------------------------------------------------------------------------
-- 6. Alert Rules
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  threshold_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('critical', 'warning', 'info')),
  enabled BOOLEAN DEFAULT true,
  channel TEXT DEFAULT 'both' CHECK (channel IN ('in_app', 'email', 'both')),
  times_triggered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant_id ON alert_rules(tenant_id);

-- ------------------------------------------------------------------------------
-- 7. Notifications (Pricing & Stock Alerts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_id TEXT,
  rule_name TEXT,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('critical', 'warning', 'info', 'success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  competitor_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  old_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  new_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  my_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price_diff_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  stock_change JSONB,
  timestamp TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ------------------------------------------------------------------------------
-- 8. Scan Jobs (Crawl Audit Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scan_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_type TEXT DEFAULT 'scheduled_am',
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'running', 'queued', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER DEFAULT 0,
  products_scanned INTEGER DEFAULT 0,
  competitor_pages_crawled INTEGER DEFAULT 0,
  price_changes_found INTEGER DEFAULT 0,
  stock_changes_found INTEGER DEFAULT 0,
  alerts_triggered INTEGER DEFAULT 0,
  log_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_jobs_tenant_id ON scan_jobs(tenant_id);

-- ------------------------------------------------------------------------------
-- 9. Background Jobs (Queue & Worker Status)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS background_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 1,
  processed_items INTEGER DEFAULT 0,
  current_task_description TEXT DEFAULT '',
  payload JSONB DEFAULT '{}'::jsonb,
  result_summary JSONB DEFAULT '{}'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  started_at TEXT,
  completed_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_tenant_id ON background_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);

-- ------------------------------------------------------------------------------
-- 10. Initial Seed Data (Plans & Default Tenant)
-- ------------------------------------------------------------------------------
INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, max_products, max_competitors, scan_frequency, scan_frequency_label, features, active_subscribers, popular)
VALUES
  ('starter', 'Starter Brand', 99.00, 990.00, 250, 5, '1x_daily', 'Daily Scan', '["Up to 250 Active SKUs", "Track 5 Marketplace Competitors", "Daily Price Refresh (08:00 AM)", "Email Alerts for Price Cuts", "Standard CSV Product Import"]'::jsonb, 42, false),
  ('growth', 'Growth Merchant', 299.00, 2990.00, 1500, 15, '2x_daily', '2x Daily (AM & PM)', '["Up to 1,500 Active SKUs", "Track 15 Multi-Store Competitors", "Automated Dual Scans (8 AM & 8 PM)", "Repricing Recommendations Engine", "Shopify & Slack Webhook Dispatch", "Live Stock Outage Detectors"]'::jsonb, 118, true),
  ('enterprise', 'Enterprise Retail', 799.00, 7990.00, 10000, 50, 'hourly', 'Hourly Turbo Crawl', '["Up to 10,000 Active SKUs", "Track 50 Global Competitors", "Hourly Anti-Bot Turbo Scans", "Direct Shopify ERP Two-Way Sync", "Custom Webhooks & REST API Access", "Dedicated Solutions Architect"]'::jsonb, 24, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenants (id, name, slug, logo, industry, country, country_code, currency, currency_symbol, plan_id, plan_status, scan_frequency, scan_times, last_scan_at, next_scan_at, sku_limit, competitor_limit, contact_email, webhook_url, email_alerts_enabled, auto_reprice_recommendation)
VALUES
  ('tenant-apex', 'Apex Athletics', 'apex-athletics', '⚡', 'Sportswear & Footwear', 'UK', 'UK', 'GBP', '£', 'enterprise', 'active', '2x_daily', '["08:00 AM", "08:00 PM"]'::jsonb, 'Today at 08:00 AM', 'Today at 08:00 PM', 10000, 50, 'pricing-ops@apexathletics.com', 'https://api.apexathletics.com/webhooks/pricing', true, true),
  ('tenant-aura', 'Aura Soundworks', 'aura-soundworks', '🎧', 'Consumer Audio & Tech', 'US', 'US', 'USD', '$', 'growth', 'active', '2x_daily', '["08:00 AM", "08:00 PM"]'::jsonb, 'Today at 08:00 AM', 'Today at 08:00 PM', 1500, 15, 'director@aurasoundworks.com', '', true, true),
  ('tenant-lumina', 'Lumina Skin Labs', 'lumina-skin', '✨', 'Cosmetics & Skincare', 'US', 'US', 'USD', '$', 'starter', 'active', '1x_daily', '["08:00 AM"]'::jsonb, 'Yesterday at 08:00 AM', 'Today at 08:00 AM', 250, 5, 'operations@luminaskin.co', '', true, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- RLS (Row Level Security) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (Next.js backend with SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role full access on tenants" ON tenants FOR ALL USING (true);
CREATE POLICY "Service role full access on products" ON products FOR ALL USING (true);
CREATE POLICY "Service role full access on competitors" ON competitors FOR ALL USING (true);
CREATE POLICY "Service role full access on matches" ON matches FOR ALL USING (true);
CREATE POLICY "Service role full access on alert_rules" ON alert_rules FOR ALL USING (true);
CREATE POLICY "Service role full access on notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Service role full access on scan_jobs" ON scan_jobs FOR ALL USING (true);
CREATE POLICY "Service role full access on background_jobs" ON background_jobs FOR ALL USING (true);
CREATE POLICY "Public read on subscription_plans" ON subscription_plans FOR SELECT USING (true);
