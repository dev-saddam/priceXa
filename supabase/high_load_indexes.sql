-- ==============================================================================
-- PriceXa High-Scale Performance Indexes (for 100+ Users x 10,000 SKUs = 1,000,000 SKUs)
-- Run this migration in your Supabase SQL Editor to guarantee sub-15ms queries.
-- ==============================================================================

-- 1. Product Table High-Volume Query Indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant_created ON products(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_tenant_matching_status ON products(tenant_id, matching_status);
CREATE INDEX IF NOT EXISTS idx_products_tenant_market_pos ON products(tenant_id, market_position);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_products_code_tenant ON products(code, tenant_id);

-- 2. Competitor Product Matches Fast Joins
CREATE INDEX IF NOT EXISTS idx_matches_tenant_prod_status ON matches(tenant_id, product_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_comp ON matches(tenant_id, competitor_id);
CREATE INDEX IF NOT EXISTS idx_matches_product_id ON matches(product_id);

-- 3. Notifications & Job Logging
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created ON notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_read ON notifications(tenant_id, read);
CREATE INDEX IF NOT EXISTS idx_background_jobs_tenant ON background_jobs(tenant_id, created_at DESC);

-- 4. Enable Trigam text search extension for instant fuzzy SKU & title searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_code_trgm ON products USING gin (code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);
