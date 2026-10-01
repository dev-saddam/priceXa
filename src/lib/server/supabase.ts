import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Polyfill WebSocket for Node.js environments < 22
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    globalThis.WebSocket = require('ws');
  } catch {}
}

import {
  Tenant,
  Product,
  Competitor,
  CompetitorProductMatch,
  AlertRule,
  AlertNotification,
  ScanJob,
  SubscriptionPlan,
  BackgroundJob,
} from '@/types';

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}

// -----------------------------------------------------------------------------
// Database Mappings & Converters (snake_case DB <-> camelCase TS)
// -----------------------------------------------------------------------------

function mapTenantFromDb(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo || '🏢',
    industry: row.industry || 'E-Commerce',
    country: row.country || 'US',
    countryCode: row.country_code || row.country || 'US',
    currency: row.currency || 'USD',
    currencySymbol: row.currency_symbol || '$',
    planId: row.plan_id || 'growth',
    planStatus: row.plan_status || 'active',
    scanFrequency: row.scan_frequency || '2x_daily',
    scanTimes: row.scan_times || ['08:00 AM', '08:00 PM'],
    lastScanAt: row.last_scan_at || 'Never',
    nextScanAt: row.next_scan_at || 'Today at 08:00 PM',
    skuLimit: row.sku_limit || 1500,
    competitorLimit: row.competitor_limit || 15,
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-01-01',
    contactEmail: row.contact_email,
    webhookUrl: row.webhook_url || '',
    emailAlertsEnabled: row.email_alerts_enabled ?? true,
    autoRepriceRecommendation: row.auto_reprice_recommendation ?? true,
  };
}

function mapProductFromDb(row: any): Product {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    brand: row.brand || '',
    code: row.code,
    category: row.category || 'General',
    mrp: Number(row.mrp) || 0,
    currentPrice: Number(row.current_price) || 0,
    costPrice: Number(row.cost_price) || 0,
    minMarginPercent: Number(row.min_margin_percent) || 15,
    stockStatus: row.stock_status || 'in_stock',
    stockCount: row.stock_count || 100,
    imageUrl: row.image_url || '',
    productUrl: row.product_url || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-01-01',
    matchesCount: row.matches_count || 0,
    marketPosition: row.market_position || 'unmatched',
    lowestCompetitorPrice: row.lowest_competitor_price ? Number(row.lowest_competitor_price) : undefined,
    averageCompetitorPrice: row.average_competitor_price ? Number(row.average_competitor_price) : undefined,
    matchingStatus: row.matching_status || 'unmatched',
    isSearchingCompetitors: row.is_searching_competitors || false,
  };
}

function mapCompetitorFromDb(row: any): Competitor {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    domain: row.domain,
    baseUrl: row.base_url,
    logo: row.logo || '🛒',
    status: row.status || 'active',
    monitoredProductsCount: row.monitored_products_count || 0,
    searchSelector: row.search_selector,
    avgPriceDiffPercent: Number(row.avg_price_diff_percent) || 0,
    lastScrapedAt: row.last_scraped_at || 'Never',
    channelType: row.channel_type || 'marketplace',
    platform: row.platform || 'amazon',
  };
}

function mapMatchFromDb(row: any): CompetitorProductMatch {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    productId: row.product_id,
    competitorId: row.competitor_id,
    competitorName: row.competitor_name,
    competitorProductTitle: row.competitor_product_title,
    competitorProductUrl: row.competitor_product_url,
    matchConfidence: row.match_confidence || 90,
    matchType: row.match_type || 'title_search',
    currentPrice: Number(row.current_price) || 0,
    previousPrice: Number(row.previous_price) || 0,
    regularPrice: row.regular_price ? Number(row.regular_price) : undefined,
    priceDiff: Number(row.price_diff) || 0,
    priceDiffPercent: Number(row.price_diff_percent) || 0,
    stockStatus: row.stock_status || 'in_stock',
    currency: row.currency || 'USD',
    lastScrapedAt: row.last_checked_at || 'Never',
    priceHistory: row.price_history || [],
    status: row.status || 'confirmed',
    channelType: row.channel_type || 'marketplace',
    platform: row.platform || 'amazon',
    sellerName: row.seller_name,
  };
}

function mapAlertRuleFromDb(row: any): AlertRule {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    conditionType: row.condition_type,
    thresholdValue: Number(row.threshold_value) || 0,
    severity: row.severity || 'warning',
    enabled: row.enabled ?? true,
    channel: row.channel || 'both',
    timesTriggered: row.times_triggered || 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-01-01',
  };
}

function mapNotificationFromDb(row: any): AlertNotification {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    ruleId: row.rule_id,
    ruleName: row.rule_name,
    severity: row.severity || 'warning',
    title: row.title,
    message: row.message,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    competitorId: row.competitor_id,
    competitorName: row.competitor_name,
    oldPrice: Number(row.old_price) || 0,
    newPrice: Number(row.new_price) || 0,
    myPrice: Number(row.my_price) || 0,
    priceDiffPercent: Number(row.price_diff_percent) || 0,
    stockChange: row.stock_change,
    timestamp: row.timestamp || 'Just now',
    read: row.read || false,
    actionTaken: row.action_taken,
  };
}

function mapScanJobFromDb(row: any): ScanJob {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    batchType: row.batch_type || 'scheduled_am',
    status: row.status || 'completed',
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms || 0,
    productsScanned: row.products_scanned || 0,
    competitorPagesCrawled: row.competitor_pages_crawled || 0,
    priceChangesFound: row.price_changes_found || 0,
    stockChangesFound: row.stock_changes_found || 0,
    alertsTriggered: row.alerts_triggered || 0,
    logItems: row.log_items || [],
  };
}

function mapPlanFromDb(row: any): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    priceMonthly: Number(row.price_monthly) || 0,
    priceYearly: Number(row.price_yearly) || 0,
    maxProducts: row.max_products || 1000,
    maxCompetitors: row.max_competitors || 10,
    scanFrequency: row.scan_frequency || '2x_daily',
    scanFrequencyLabel: row.scan_frequency_label || '2x Daily',
    features: row.features || [],
    activeSubscribers: row.active_subscribers || 0,
  };
}

// -----------------------------------------------------------------------------
// Supabase CRUD Operations
// -----------------------------------------------------------------------------

export async function fetchSupabaseTenants(): Promise<Tenant[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('tenants').select('*').order('name');
  if (error) {
    console.error('[Supabase] Error fetching tenants:', error.message);
    return [];
  }
  return (data || []).map(mapTenantFromDb);
}

export async function updateSupabaseTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const dbRow: any = {};
  if (updates.name !== undefined) dbRow.name = updates.name;
  if (updates.industry !== undefined) dbRow.industry = updates.industry;
  if (updates.country !== undefined) {
    dbRow.country = updates.country;
    dbRow.country_code = updates.countryCode || updates.country;
  }
  if (updates.currency !== undefined) dbRow.currency = updates.currency;
  if (updates.currencySymbol !== undefined) dbRow.currency_symbol = updates.currencySymbol;
  if (updates.contactEmail !== undefined) dbRow.contact_email = updates.contactEmail;
  if (updates.webhookUrl !== undefined) dbRow.webhook_url = updates.webhookUrl;
  if (updates.emailAlertsEnabled !== undefined) dbRow.email_alerts_enabled = updates.emailAlertsEnabled;
  if (updates.planId !== undefined) dbRow.plan_id = updates.planId;
  if (updates.planStatus !== undefined) dbRow.plan_status = updates.planStatus;
  if (updates.skuLimit !== undefined) dbRow.sku_limit = updates.skuLimit;
  if (updates.competitorLimit !== undefined) dbRow.competitor_limit = updates.competitorLimit;
  dbRow.updated_at = new Date().toISOString();

  const { data, error } = await sb.from('tenants').update(dbRow).eq('id', id).select().single();
  if (error) {
    console.error('[Supabase] Error updating tenant:', error.message);
    return null;
  }
  return mapTenantFromDb(data);
}

export async function insertSupabaseTenant(tenant: Tenant): Promise<Tenant | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const dbRow = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logo: tenant.logo,
    industry: tenant.industry,
    country: tenant.country || 'US',
    country_code: tenant.countryCode || tenant.country || 'US',
    currency: tenant.currency,
    currency_symbol: tenant.currencySymbol,
    plan_id: tenant.planId,
    plan_status: tenant.planStatus,
    scan_frequency: tenant.scanFrequency,
    scan_times: tenant.scanTimes,
    last_scan_at: tenant.lastScanAt,
    next_scan_at: tenant.nextScanAt,
    sku_limit: tenant.skuLimit,
    competitor_limit: tenant.competitorLimit,
    contact_email: tenant.contactEmail,
    webhook_url: tenant.webhookUrl || '',
    email_alerts_enabled: tenant.emailAlertsEnabled,
    auto_reprice_recommendation: tenant.autoRepriceRecommendation,
  };

  const { data, error } = await sb.from('tenants').insert(dbRow).select().single();
  if (error) {
    console.error('[Supabase] Error inserting tenant:', error.message);
    return null;
  }
  return mapTenantFromDb(data);
}

export async function fetchSupabaseProducts(tenantId?: string): Promise<Product[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb.from('products').select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] Error fetching products:', error.message);
    return [];
  }
  return (data || []).map(mapProductFromDb);
}

export async function insertSupabaseProduct(product: Product): Promise<Product | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const dbRow = {
    id: product.id,
    tenant_id: product.tenantId,
    name: product.name,
    brand: product.brand || '',
    code: product.code,
    category: product.category,
    mrp: product.mrp,
    current_price: product.currentPrice,
    cost_price: product.costPrice,
    min_margin_percent: product.minMarginPercent,
    stock_status: product.stockStatus,
    stock_count: product.stockCount,
    image_url: product.imageUrl,
    product_url: product.productUrl || '',
    matches_count: product.matchesCount || 0,
    market_position: product.marketPosition || 'unmatched',
    lowest_competitor_price: product.lowestCompetitorPrice,
    average_competitor_price: product.averageCompetitorPrice,
    matching_status: product.matchingStatus || 'unmatched',
    is_searching_competitors: product.isSearchingCompetitors || false,
  };

  const { data, error } = await sb.from('products').insert(dbRow).select().single();
  if (error) {
    console.error('[Supabase] Error inserting product:', error.message);
    return null;
  }
  return mapProductFromDb(data);
}

export async function updateSupabaseProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const dbRow: any = {};
  if (updates.name !== undefined) dbRow.name = updates.name;
  if (updates.brand !== undefined) dbRow.brand = updates.brand;
  if (updates.code !== undefined) dbRow.code = updates.code;
  if (updates.category !== undefined) dbRow.category = updates.category;
  if (updates.mrp !== undefined) dbRow.mrp = updates.mrp;
  if (updates.currentPrice !== undefined) dbRow.current_price = updates.currentPrice;
  if (updates.costPrice !== undefined) dbRow.cost_price = updates.costPrice;
  if (updates.minMarginPercent !== undefined) dbRow.min_margin_percent = updates.minMarginPercent;
  if (updates.stockStatus !== undefined) dbRow.stock_status = updates.stockStatus;
  if (updates.stockCount !== undefined) dbRow.stock_count = updates.stockCount;
  if (updates.imageUrl !== undefined) dbRow.image_url = updates.imageUrl;
  if (updates.productUrl !== undefined) dbRow.product_url = updates.productUrl;
  if (updates.matchesCount !== undefined) dbRow.matches_count = updates.matchesCount;
  if (updates.marketPosition !== undefined) dbRow.market_position = updates.marketPosition;
  if (updates.lowestCompetitorPrice !== undefined) dbRow.lowest_competitor_price = updates.lowestCompetitorPrice;
  if (updates.averageCompetitorPrice !== undefined) dbRow.average_competitor_price = updates.averageCompetitorPrice;
  if (updates.matchingStatus !== undefined) dbRow.matching_status = updates.matchingStatus;
  if (updates.isSearchingCompetitors !== undefined) dbRow.is_searching_competitors = updates.isSearchingCompetitors;
  dbRow.updated_at = new Date().toISOString();

  const { data, error } = await sb.from('products').update(dbRow).eq('id', id).select().single();
  if (error) {
    console.error('[Supabase] Error updating product:', error.message);
    return null;
  }
  return mapProductFromDb(data);
}

export async function deleteSupabaseProduct(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('products').delete().eq('id', id);
  return !error;
}

export async function fetchSupabaseCompetitors(tenantId?: string): Promise<Competitor[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from('competitors').select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] Error fetching competitors:', error.message);
    return [];
  }
  return (data || []).map(mapCompetitorFromDb);
}

export async function insertSupabaseCompetitor(comp: Competitor): Promise<Competitor | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const dbRow = {
    id: comp.id,
    tenant_id: comp.tenantId,
    name: comp.name,
    domain: comp.domain,
    base_url: comp.baseUrl,
    logo: comp.logo || '🛒',
    status: comp.status || 'active',
    monitored_products_count: comp.monitoredProductsCount || 0,
    search_selector: comp.searchSelector,
    avg_price_diff_percent: comp.avgPriceDiffPercent || 0,
    last_scraped_at: comp.lastScrapedAt || 'Never',
    channel_type: comp.channelType || 'marketplace',
    platform: comp.platform || 'amazon',
  };
  const { data, error } = await sb.from('competitors').insert(dbRow).select().single();
  if (error) {
    console.error('[Supabase] Error inserting competitor:', error.message);
    return null;
  }
  return mapCompetitorFromDb(data);
}

export async function updateSupabaseCompetitor(id: string, updates: Partial<Competitor>): Promise<Competitor | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const dbRow: any = {};
  if (updates.name !== undefined) dbRow.name = updates.name;
  if (updates.domain !== undefined) dbRow.domain = updates.domain;
  if (updates.baseUrl !== undefined) dbRow.base_url = updates.baseUrl;
  if (updates.logo !== undefined) dbRow.logo = updates.logo;
  if (updates.status !== undefined) dbRow.status = updates.status;
  if (updates.monitoredProductsCount !== undefined) dbRow.monitored_products_count = updates.monitoredProductsCount;
  if (updates.avgPriceDiffPercent !== undefined) dbRow.avg_price_diff_percent = updates.avgPriceDiffPercent;
  if (updates.lastScrapedAt !== undefined) dbRow.last_scraped_at = updates.lastScrapedAt;
  dbRow.updated_at = new Date().toISOString();

  const { data, error } = await sb.from('competitors').update(dbRow).eq('id', id).select().single();
  if (error) {
    console.error('[Supabase] Error updating competitor:', error.message);
    return null;
  }
  return mapCompetitorFromDb(data);
}

export async function deleteSupabaseCompetitor(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('competitors').delete().eq('id', id);
  return !error;
}

export async function fetchSupabaseMatches(tenantId?: string): Promise<CompetitorProductMatch[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from('matches').select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] Error fetching matches:', error.message);
    return [];
  }
  return (data || []).map(mapMatchFromDb);
}

export async function saveSupabaseMatches(
  tenantId: string,
  productId: string,
  newMatches: CompetitorProductMatch[]
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  // Remove existing matches for this product
  await sb.from('matches').delete().eq('tenant_id', tenantId).eq('product_id', productId);

  if (newMatches.length === 0) return;

  const rows = newMatches.map((m) => ({
    id: m.id,
    tenant_id: tenantId,
    product_id: productId,
    competitor_id: m.competitorId,
    competitor_name: m.competitorName,
    competitor_product_title: m.competitorProductTitle,
    competitor_product_url: m.competitorProductUrl,
    match_confidence: m.matchConfidence,
    match_type: m.matchType,
    current_price: m.currentPrice,
    previous_price: m.previousPrice,
    regular_price: m.regularPrice,
    price_diff: m.priceDiff,
    price_diff_percent: m.priceDiffPercent,
    stock_status: m.stockStatus,
    currency: m.currency,
    last_checked_at: m.lastScrapedAt,
    price_history: m.priceHistory || [],
    status: m.status || 'confirmed',
    channel_type: m.channelType || 'marketplace',
    platform: m.platform || 'amazon',
    seller_name: m.sellerName,
  }));

  const { error } = await sb.from('matches').insert(rows);
  if (error) {
    console.error('[Supabase] Error saving matches:', error.message);
  }
}

export async function fetchSupabaseAlertRules(tenantId?: string): Promise<AlertRule[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from('alert_rules').select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) return [];
  return (data || []).map(mapAlertRuleFromDb);
}

export async function fetchSupabaseNotifications(tenantId?: string): Promise<AlertNotification[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from('notifications').select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapNotificationFromDb);
}

export async function insertSupabaseNotification(notif: AlertNotification): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const row = {
    id: notif.id,
    tenant_id: notif.tenantId,
    rule_id: notif.ruleId,
    rule_name: notif.ruleName,
    severity: notif.severity,
    title: notif.title,
    message: notif.message,
    product_id: notif.productId,
    product_name: notif.productName,
    product_sku: notif.productSku,
    competitor_id: notif.competitorId,
    competitor_name: notif.competitorName,
    old_price: notif.oldPrice,
    new_price: notif.newPrice,
    my_price: notif.myPrice,
    price_diff_percent: notif.priceDiffPercent,
    stock_change: notif.stockChange,
    timestamp: notif.timestamp,
    read: notif.read,
    action_taken: notif.actionTaken,
  };
  await sb.from('notifications').insert(row);
}

export async function fetchSupabaseScanJobs(tenantId?: string): Promise<ScanJob[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from('scan_jobs').select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query.order('started_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapScanJobFromDb);
}

export async function insertSupabaseScanJob(job: ScanJob): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const row = {
    id: job.id,
    tenant_id: job.tenantId,
    batch_type: job.batchType,
    status: job.status,
    started_at: job.startedAt,
    completed_at: job.completedAt,
    duration_ms: job.durationMs,
    products_scanned: job.productsScanned,
    competitor_pages_crawled: job.competitorPagesCrawled,
    price_changes_found: job.priceChangesFound,
    stock_changes_found: job.stockChangesFound,
    alerts_triggered: job.alertsTriggered,
    log_items: job.logItems,
  };
  await sb.from('scan_jobs').insert(row);
}

export async function fetchSupabasePlans(): Promise<SubscriptionPlan[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('subscription_plans').select('*');
  if (error) return [];
  return (data || []).map(mapPlanFromDb);
}
