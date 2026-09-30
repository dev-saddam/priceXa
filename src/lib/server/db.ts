import fs from 'fs';
import path from 'path';
import {
  Tenant,
  Product,
  Competitor,
  CompetitorProductMatch,
  AlertRule,
  AlertNotification,
  ScanJob,
  SubscriptionPlan,
} from '@/types';
import {
  INITIAL_TENANTS,
  INITIAL_PLANS,
  INITIAL_COMPETITORS,
  INITIAL_PRODUCTS,
  INITIAL_MATCHES,
  INITIAL_ALERT_RULES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SCAN_JOBS,
} from '@/data/mockData';

export interface DatabaseSchema {
  tenants: Tenant[];
  products: Product[];
  competitors: Competitor[];
  matches: CompetitorProductMatch[];
  alertRules: AlertRule[];
  notifications: AlertNotification[];
  scanJobs: ScanJob[];
  plans: SubscriptionPlan[];
  lastUpdated: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Write queue lock to prevent concurrent write corruptions
let writePromise = Promise.resolve();

function ensureDbFile(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      tenants: INITIAL_TENANTS,
      products: INITIAL_PRODUCTS,
      competitors: INITIAL_COMPETITORS,
      matches: INITIAL_MATCHES,
      alertRules: INITIAL_ALERT_RULES,
      notifications: INITIAL_NOTIFICATIONS,
      scanJobs: INITIAL_SCAN_JOBS,
      plans: INITIAL_PLANS,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, reinitializing default store:', err);
    const fallback: DatabaseSchema = {
      tenants: INITIAL_TENANTS,
      products: INITIAL_PRODUCTS,
      competitors: INITIAL_COMPETITORS,
      matches: INITIAL_MATCHES,
      alertRules: INITIAL_ALERT_RULES,
      notifications: INITIAL_NOTIFICATIONS,
      scanJobs: INITIAL_SCAN_JOBS,
      plans: INITIAL_PLANS,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

export async function getDb(): Promise<DatabaseSchema> {
  return ensureDbFile();
}

export async function saveDb(data: DatabaseSchema): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  writePromise = writePromise.then(async () => {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  });
  return writePromise;
}

// ----------------------------------------------------
// PRODUCT HELPERS
// ----------------------------------------------------

export async function getProducts(tenantId?: string): Promise<Product[]> {
  const db = await getDb();
  if (tenantId) {
    return db.products.filter((p) => p.tenantId === tenantId);
  }
  return db.products;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const db = await getDb();
  return db.products.find((p) => p.id === id);
}

export async function addProduct(
  productData: Omit<Product, 'id' | 'createdAt' | 'matchesCount' | 'marketPosition'>
): Promise<Product> {
  const db = await getDb();
  const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newProduct: Product = {
    ...productData,
    id,
    createdAt: new Date().toISOString().split('T')[0],
    matchesCount: 0,
    marketPosition: 'unmatched',
    matchingStatus: 'unmatched',
  };

  db.products.unshift(newProduct);
  await saveDb(db);
  await recalculateMarketPositions(newProduct.tenantId);
  return (await getProductById(id)) || newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const db = await getDb();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  db.products[index] = { ...db.products[index], ...updates };
  const tenantId = db.products[index].tenantId;
  await saveDb(db);
  await recalculateMarketPositions(tenantId);
  return db.products[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = await getDb();
  const prod = db.products.find((p) => p.id === id);
  if (!prod) return false;

  db.products = db.products.filter((p) => p.id !== id);
  db.matches = db.matches.filter((m) => m.productId !== id);
  db.notifications = db.notifications.filter((n) => n.productId !== id);
  await saveDb(db);
  await recalculateMarketPositions(prod.tenantId);
  return true;
}

export async function bulkImportProducts(
  tenantId: string,
  rows: Array<{
    name: string;
    brand?: string;
    code: string;
    mrp: number;
    currentPrice?: number;
    costPrice?: number;
    category?: string;
    productUrl?: string;
  }>
): Promise<Product[]> {
  const db = await getDb();
  const defaultImages = [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=150&auto=format&fit=crop&q=80',
  ];

  const newProducts: Product[] = rows.map((r, i) => {
    const curPrice = r.currentPrice || r.mrp * 0.95;
    const costPrice = r.costPrice || curPrice * 0.7;
    return {
      id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      name: r.name,
      brand: r.brand || 'Apex',
      code: r.code || `SKU-${Date.now()}-${i}`,
      category: r.category || 'General',
      mrp: Number(r.mrp),
      currentPrice: Number(curPrice),
      costPrice: Number(costPrice),
      minMarginPercent: 20,
      stockStatus: 'in_stock',
      stockCount: 150,
      imageUrl: defaultImages[i % defaultImages.length],
      productUrl: r.productUrl || '',
      createdAt: new Date().toISOString().split('T')[0],
      matchesCount: 0,
      marketPosition: 'unmatched',
      matchingStatus: 'unmatched',
    };
  });

  db.products = [...newProducts, ...db.products];
  await saveDb(db);
  return newProducts;
}

// ----------------------------------------------------
// COMPETITOR HELPERS
// ----------------------------------------------------

export async function getCompetitors(tenantId?: string): Promise<Competitor[]> {
  const db = await getDb();
  if (tenantId) {
    return db.competitors.filter((c) => c.tenantId === tenantId);
  }
  return db.competitors;
}

export async function addCompetitor(
  compData: Omit<Competitor, 'id' | 'monitoredProductsCount' | 'avgPriceDiffPercent' | 'lastScrapedAt'>
): Promise<Competitor> {
  const db = await getDb();
  const id = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newComp: Competitor = {
    ...compData,
    id,
    monitoredProductsCount: 0,
    avgPriceDiffPercent: 0,
    lastScrapedAt: 'Never',
  };

  db.competitors.push(newComp);
  await saveDb(db);
  return newComp;
}

export async function deleteCompetitor(id: string): Promise<boolean> {
  const db = await getDb();
  const comp = db.competitors.find((c) => c.id === id);
  if (!comp) return false;

  db.competitors = db.competitors.filter((c) => c.id !== id);
  db.matches = db.matches.filter((m) => m.competitorId !== id);
  await saveDb(db);
  await recalculateMarketPositions(comp.tenantId);
  return true;
}

// ----------------------------------------------------
// MATCHES HELPERS
// ----------------------------------------------------

export async function getMatches(tenantId?: string, productId?: string): Promise<CompetitorProductMatch[]> {
  const db = await getDb();
  let list = db.matches;
  if (tenantId) {
    list = list.filter((m) => m.tenantId === tenantId);
  }
  if (productId) {
    list = list.filter((m) => m.productId === productId);
  }
  return list;
}

export async function saveProductMatches(
  tenantId: string,
  productId: string,
  newMatches: CompetitorProductMatch[]
): Promise<CompetitorProductMatch[]> {
  const db = await getDb();
  // Remove existing matches for this product
  db.matches = db.matches.filter((m) => !(m.productId === productId && m.tenantId === tenantId));
  // Add newly chosen matches
  db.matches.push(...newMatches);
  await saveDb(db);
  await recalculateMarketPositions(tenantId);
  return db.matches.filter((m) => m.productId === productId);
}

// ----------------------------------------------------
// ALERTS & NOTIFICATIONS
// ----------------------------------------------------

export async function getNotifications(tenantId?: string): Promise<AlertNotification[]> {
  const db = await getDb();
  if (tenantId) {
    return db.notifications.filter((n) => n.tenantId === tenantId);
  }
  return db.notifications;
}

export async function addNotification(notification: AlertNotification): Promise<void> {
  const db = await getDb();
  db.notifications.unshift(notification);
  await saveDb(db);
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const db = await getDb();
  const notif = db.notifications.find((n) => n.id === id);
  if (!notif) return false;
  notif.read = true;
  await saveDb(db);
  return true;
}

export async function markAllNotificationsRead(tenantId: string): Promise<void> {
  const db = await getDb();
  db.notifications.forEach((n) => {
    if (n.tenantId === tenantId) n.read = true;
  });
  await saveDb(db);
}

// ----------------------------------------------------
// SCAN JOBS
// ----------------------------------------------------

export async function getScanJobs(tenantId?: string): Promise<ScanJob[]> {
  const db = await getDb();
  if (tenantId) {
    return db.scanJobs.filter((s) => s.tenantId === tenantId);
  }
  return db.scanJobs;
}

export async function addScanJob(job: ScanJob): Promise<void> {
  const db = await getDb();
  db.scanJobs.unshift(job);
  await saveDb(db);
}

// ----------------------------------------------------
// TENANTS
// ----------------------------------------------------

export async function getTenants(): Promise<Tenant[]> {
  const db = await getDb();
  return db.tenants;
}

export async function addTenant(tenant: Tenant): Promise<Tenant> {
  const db = await getDb();
  db.tenants.push(tenant);
  await saveDb(db);
  return tenant;
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const db = await getDb();
  const index = db.tenants.findIndex((t) => t.id === id);
  if (index === -1) return null;
  db.tenants[index] = { ...db.tenants[index], ...updates };
  await saveDb(db);
  return db.tenants[index];
}

// ----------------------------------------------------
// INTELLIGENCE & MARKET POSITION RECALCULATION
// ----------------------------------------------------

export async function recalculateMarketPositions(tenantId: string): Promise<void> {
  const db = await getDb();
  const tenantProducts = db.products.filter((p) => p.tenantId === tenantId);
  const tenantCompetitors = db.competitors.filter((c) => c.tenantId === tenantId && c.status === 'active');
  const totalActiveCompetitors = Math.max(1, tenantCompetitors.length);

  tenantProducts.forEach((product) => {
    const prodMatches = db.matches.filter(
      (m) => m.productId === product.id && m.tenantId === tenantId && m.status === 'confirmed'
    );

    product.matchesCount = prodMatches.length;

    if (prodMatches.length === 0) {
      product.marketPosition = 'unmatched';
      product.matchingStatus = 'unmatched';
      product.lowestCompetitorPrice = undefined;
      product.averageCompetitorPrice = undefined;
      return;
    }

    product.matchingStatus =
      prodMatches.length >= totalActiveCompetitors ? 'fully_matched' : 'partially_matched';

    const prices = prodMatches.map((m) => m.currentPrice);
    const minPrice = Math.min(...prices);
    const avgPrice = Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2));

    product.lowestCompetitorPrice = minPrice;
    product.averageCompetitorPrice = avgPrice;

    // Check position:
    // cheapest: product.currentPrice < minPrice
    // expensive (under-cut): product.currentPrice > minPrice
    // competitive: product.currentPrice == minPrice
    if (product.currentPrice < minPrice) {
      product.marketPosition = 'cheapest';
    } else if (product.currentPrice > minPrice) {
      product.marketPosition = 'expensive';
    } else {
      product.marketPosition = 'competitive';
    }
  });

  // Update competitor counts and average price differences
  tenantCompetitors.forEach((comp) => {
    const compMatches = db.matches.filter(
      (m) => m.competitorId === comp.id && m.tenantId === tenantId && m.status === 'confirmed'
    );
    comp.monitoredProductsCount = compMatches.length;
    if (compMatches.length > 0) {
      const avgDiff =
        compMatches.reduce((acc, cur) => acc + (cur.priceDiffPercent || 0), 0) / compMatches.length;
      comp.avgPriceDiffPercent = Number(avgDiff.toFixed(1));
    } else {
      comp.avgPriceDiffPercent = 0;
    }
  });

  await saveDb(db);
}
