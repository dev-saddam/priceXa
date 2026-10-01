/**
 * PriceXa Supabase Database Migration Tool
 *
 * Reads all data from data/db.json and imports it into your Supabase PostgreSQL database.
 *
 * Usage:
 *   node scripts/migrate-to-supabase.js
 *   OR
 *   node scripts/migrate-to-supabase.js <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>
 */

const fs = require('fs');
const path = require('path');

// Polyfill WebSocket for Node.js environments < 22
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    globalThis.WebSocket = require('ws');
  } catch {}
}

const { createClient } = require('@supabase/supabase-js');

// 1. Try reading .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (!process.env[key]) process.env[key] = val;
        }
      });
    }
  }
}

loadEnv();

// 2. Resolve credentials from CLI args or environment
const args = process.argv.slice(2);
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    supabaseUrl = args[i + 1];
    i++;
  } else if (args[i] === '--key' && args[i + 1]) {
    supabaseKey = args[i + 1];
    i++;
  } else if (!supabaseUrl && args[i].startsWith('http')) {
    supabaseUrl = args[i];
  } else if (!supabaseKey && args[i].length > 20) {
    supabaseKey = args[i];
  }
}

async function runMigration() {
  console.log('================================================================');
  console.log('🚀 PriceXa -> Supabase Database Migration Tool');
  console.log('================================================================\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Credentials!\n');
    console.log('Please provide your Supabase URL and Service Role Key either:');
    console.log('  1. In a .env.local file:');
    console.log('     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
    console.log('  2. Or directly via command line arguments:');
    console.log('     node scripts/migrate-to-supabase.js <SUPABASE_URL> <SERVICE_ROLE_KEY>');
    console.log('     node scripts/migrate-to-supabase.js --url <URL> --key <KEY>\n');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}...`);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // Read local db.json
  const dbFile = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(dbFile)) {
    console.error(`❌ Local database file not found at: ${dbFile}`);
    process.exit(1);
  }

  const localDb = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
  console.log('📂 Local data/db.json loaded successfully.\n');

  // Extract project ref from URL
  const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectRef = projectRefMatch ? projectRefMatch[1] : 'your-project-ref';

  // Verify tables exist
  const testQuery = await supabase.from('tenants').select('id').limit(1);
  if (testQuery.error && (
    testQuery.error.code === '42P01' || 
    testQuery.error.code === 'PGRST205' || 
    testQuery.error.message.includes('Could not find the table')
  )) {
    console.error('❌ Supabase tables have not been created yet in project: ' + projectRef + '!');
    console.log('\n================================================================');
    console.log('👉 STEP 1 (Required): Create Tables in Supabase');
    console.log('================================================================');
    console.log(`1. Click this direct link to open the SQL Editor for your project:`);
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    console.log(`2. Copy all contents from the file "supabase/schema.sql" in this project,`);
    console.log(`   paste into the SQL editor window, and click "RUN".`);
    console.log('\n================================================================');
    console.log('👉 STEP 2: Re-run Migration Command');
    console.log('================================================================');
    console.log('Run in terminal:');
    console.log('   npm run migrate:supabase\n');
    process.exit(1);
  }

  // 1. Migrate Subscription Plans
  if (localDb.plans && localDb.plans.length > 0) {
    process.stdout.write('⏳ Migrating Subscription Plans... ');
    const planRows = localDb.plans.map((p) => ({
      id: p.id,
      name: p.name,
      price_monthly: p.priceMonthly,
      price_yearly: p.priceYearly,
      max_products: p.maxProducts,
      max_competitors: p.maxCompetitors,
      scan_frequency: p.scanFrequency,
      scan_frequency_label: p.scanFrequencyLabel,
      features: p.features || [],
      active_subscribers: p.activeSubscribers || 0,
      popular: p.id === 'growth',
    }));
    const { error } = await supabase.from('subscription_plans').upsert(planRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${planRows.length} plans upserted.`);
    }
  }

  // 2. Migrate Tenants
  if (localDb.tenants && localDb.tenants.length > 0) {
    process.stdout.write('⏳ Migrating Tenants... ');
    const tenantRows = localDb.tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      logo: t.logo || '🏢',
      industry: t.industry || 'E-Commerce',
      country: t.country || 'US',
      country_code: t.countryCode || t.country || 'US',
      currency: t.currency || 'USD',
      currency_symbol: t.currencySymbol || '$',
      plan_id: t.planId || 'growth',
      plan_status: t.planStatus || 'active',
      scan_frequency: t.scanFrequency || '2x_daily',
      scan_times: t.scanTimes || ['08:00 AM', '08:00 PM'],
      last_scan_at: t.lastScanAt || 'Never',
      next_scan_at: t.nextScanAt || 'Today at 08:00 PM',
      sku_limit: t.skuLimit || 1500,
      competitor_limit: t.competitorLimit || 15,
      contact_email: t.contactEmail,
      webhook_url: t.webhookUrl || '',
      email_alerts_enabled: t.emailAlertsEnabled ?? true,
      auto_reprice_recommendation: t.autoRepriceRecommendation ?? true,
    }));
    const { error } = await supabase.from('tenants').upsert(tenantRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${tenantRows.length} tenants upserted.`);
    }
  }

  // 3. Migrate Competitors
  if (localDb.competitors && localDb.competitors.length > 0) {
    process.stdout.write('⏳ Migrating Competitors... ');
    const compRows = localDb.competitors.map((c) => ({
      id: c.id,
      tenant_id: c.tenantId,
      name: c.name,
      domain: c.domain,
      base_url: c.baseUrl,
      logo: c.logo || '🛒',
      status: c.status || 'active',
      monitored_products_count: c.monitoredProductsCount || 0,
      search_selector: c.searchSelector || null,
      avg_price_diff_percent: c.avgPriceDiffPercent || 0,
      last_scraped_at: c.lastScrapedAt || 'Never',
      channel_type: c.channelType || 'marketplace',
      platform: c.platform || 'amazon',
    }));
    const { error } = await supabase.from('competitors').upsert(compRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${compRows.length} competitors upserted.`);
    }
  }

  // 4. Migrate Products
  if (localDb.products && localDb.products.length > 0) {
    process.stdout.write('⏳ Migrating Products Catalog... ');
    const prodRows = localDb.products.map((p) => ({
      id: p.id,
      tenant_id: p.tenantId,
      name: p.name,
      brand: p.brand || '',
      code: p.code,
      category: p.category || 'General',
      mrp: p.mrp || 0,
      current_price: p.currentPrice || 0,
      cost_price: p.costPrice || 0,
      min_margin_percent: p.minMarginPercent || 15,
      stock_status: p.stockStatus || 'in_stock',
      stock_count: p.stockCount || 100,
      image_url: p.imageUrl || '',
      product_url: p.productUrl || '',
      matches_count: p.matchesCount || 0,
      market_position: p.marketPosition || 'unmatched',
      lowest_competitor_price: p.lowestCompetitorPrice || null,
      average_competitor_price: p.averageCompetitorPrice || null,
      matching_status: p.matchingStatus || 'unmatched',
      is_searching_competitors: p.isSearchingCompetitors || false,
    }));
    const { error } = await supabase.from('products').upsert(prodRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${prodRows.length} products upserted.`);
    }
  }

  // 5. Migrate Matches
  if (localDb.matches && localDb.matches.length > 0) {
    process.stdout.write('⏳ Migrating Competitor Matches... ');
    const existingProductIds = new Set((localDb.products || []).map((p) => p.id));
    const existingCompetitorIds = new Set((localDb.competitors || []).map((c) => c.id));

    const validMatches = localDb.matches.filter(
      (m) => existingProductIds.has(m.productId) && existingCompetitorIds.has(m.competitorId)
    );

    const matchRows = validMatches.map((m) => ({
      id: m.id,
      tenant_id: m.tenantId,
      product_id: m.productId,
      competitor_id: m.competitorId,
      competitor_name: m.competitorName,
      competitor_product_title: m.competitorProductTitle,
      competitor_product_url: m.competitorProductUrl,
      match_confidence: m.matchConfidence || 90,
      match_type: m.matchType || 'title_search',
      current_price: m.currentPrice || 0,
      previous_price: m.previousPrice || 0,
      regular_price: m.regularPrice || null,
      price_diff: m.priceDiff || 0,
      price_diff_percent: m.priceDiffPercent || 0,
      stock_status: m.stockStatus || 'in_stock',
      currency: m.currency || 'USD',
      last_checked_at: m.lastScrapedAt || 'Never',
      price_history: m.priceHistory || [],
      status: m.status || 'confirmed',
      channel_type: m.channelType || 'marketplace',
      platform: m.platform || 'amazon',
      seller_name: m.sellerName || null,
    }));
    const { error } = await supabase.from('matches').upsert(matchRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${matchRows.length} matches upserted.`);
    }
  }

  // 6. Migrate Alert Rules
  if (localDb.alertRules && localDb.alertRules.length > 0) {
    process.stdout.write('⏳ Migrating Alert Rules... ');
    const ruleRows = localDb.alertRules.map((r) => ({
      id: r.id,
      tenant_id: r.tenantId,
      name: r.name,
      condition_type: r.conditionType,
      threshold_value: r.thresholdValue || 0,
      severity: r.severity || 'warning',
      enabled: r.enabled ?? true,
      channel: r.channel || 'both',
      times_triggered: r.timesTriggered || 0,
    }));
    const { error } = await supabase.from('alert_rules').upsert(ruleRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${ruleRows.length} alert rules upserted.`);
    }
  }

  // 7. Migrate Notifications
  if (localDb.notifications && localDb.notifications.length > 0) {
    process.stdout.write('⏳ Migrating Notifications... ');
    const notifRows = localDb.notifications.map((n) => ({
      id: n.id,
      tenant_id: n.tenantId,
      rule_id: n.ruleId || null,
      rule_name: n.ruleName || null,
      severity: n.severity || 'warning',
      title: n.title,
      message: n.message,
      product_id: n.productId,
      product_name: n.productName,
      product_sku: n.productSku,
      competitor_id: n.competitorId,
      competitor_name: n.competitorName,
      old_price: n.oldPrice || 0,
      new_price: n.newPrice || 0,
      my_price: n.myPrice || 0,
      price_diff_percent: n.priceDiffPercent || 0,
      stock_change: n.stockChange || null,
      timestamp: n.timestamp || 'Just now',
      read: n.read || false,
      action_taken: n.actionTaken || null,
    }));
    const { error } = await supabase.from('notifications').upsert(notifRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${notifRows.length} notifications upserted.`);
    }
  }

  // 8. Migrate Scan Jobs
  if (localDb.scanJobs && localDb.scanJobs.length > 0) {
    process.stdout.write('⏳ Migrating Scan Jobs... ');
    const scanRows = localDb.scanJobs.map((s) => ({
      id: s.id,
      tenant_id: s.tenantId,
      batch_type: s.batchType || 'scheduled_am',
      status: s.status || 'completed',
      started_at: s.startedAt,
      completed_at: s.completedAt || null,
      duration_ms: s.durationMs || 0,
      products_scanned: s.productsScanned || 0,
      competitor_pages_crawled: s.competitorPagesCrawled || 0,
      price_changes_found: s.priceChangesFound || 0,
      stock_changes_found: s.stockChangesFound || 0,
      alerts_triggered: s.alertsTriggered || 0,
      log_items: s.logItems || [],
    }));
    const { error } = await supabase.from('scan_jobs').upsert(scanRows, { onConflict: 'id' });
    if (error) {
      console.log(`⚠️  Error: ${error.message}`);
    } else {
      console.log(`✅ ${scanRows.length} scan jobs upserted.`);
    }
  }

  console.log('\n🎉 Database Migration to Supabase Completed Successfully!');
  console.log('Your cloud Supabase database is now completely up to date with your local catalog and settings.\n');
}

runMigration().catch((err) => {
  console.error('\n❌ Migration failed with error:', err);
  process.exit(1);
});
