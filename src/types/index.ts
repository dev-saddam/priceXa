export type PlanTier = 'starter' | 'growth' | 'enterprise';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'company_owner';
  tenantId: string;
  companyName: string;
}

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxProducts: number;
  maxCompetitors: number;
  scanFrequency: '1x_daily' | '2x_daily' | 'hourly';
  scanFrequencyLabel: string;
  features: string[];
  activeSubscribers: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  industry: string;
  currency: string;
  currencySymbol: string;
  planId: PlanTier;
  planStatus: 'active' | 'trial' | 'past_due' | 'suspended';
  scanFrequency: '2x_daily' | 'hourly';
  scanTimes: string[]; // e.g. ["08:00 AM", "08:00 PM"]
  lastScanAt: string;
  nextScanAt: string;
  skuLimit: number;
  competitorLimit: number;
  createdAt: string;
  contactEmail: string;
  webhookUrl?: string;
  emailAlertsEnabled: boolean;
  autoRepriceRecommendation: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  brand: string;
  code: string; // SKU / EAN
  category: string;
  mrp: number; // Maximum Retail Price / Catalog Price
  currentPrice: number; // Current selling price
  costPrice: number; // Base cost to calculate margin
  minMarginPercent: number; // Floor margin limit
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockCount: number;
  imageUrl: string;
  productUrl?: string;
  createdAt: string;
  matchesCount: number;
  marketPosition: 'cheapest' | 'competitive' | 'expensive' | 'unmatched';
  lowestCompetitorPrice?: number;
  averageCompetitorPrice?: number;
  matchingStatus?: 'fully_matched' | 'partially_matched' | 'unmatched';
}

export type ChannelType = 'marketplace' | 'brand_official';
export type StorePlatform =
  | 'amazon'
  | 'walmart'
  | 'bestbuy'
  | 'target'
  | 'ebay'
  | 'flipkart'
  | 'shopify'
  | 'woocommerce'
  | 'magento'
  | 'bigcommerce'
  | 'custom_brand';

export interface Competitor {
  id: string;
  tenantId: string;
  name: string;
  domain: string;
  baseUrl: string;
  logo: string;
  status: 'active' | 'paused' | 'error';
  monitoredProductsCount: number;
  searchSelector?: string;
  avgPriceDiffPercent: number;
  lastScrapedAt: string;
  channelType?: ChannelType;
  platform?: StorePlatform;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface CompetitorProductMatch {
  id: string;
  tenantId: string;
  productId: string;
  competitorId: string;
  competitorName: string;
  competitorProductTitle: string;
  competitorProductUrl: string;
  matchConfidence: number; // 0 - 100
  matchType: 'title_search' | 'sku_exact' | 'manual_override';
  currentPrice: number;
  previousPrice: number;
  regularPrice?: number;
  priceDiff: number; // competitorPrice - myPrice
  priceDiffPercent: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  currency: string;
  lastScrapedAt: string;
  priceHistory: PricePoint[];
  status: 'confirmed' | 'pending_review' | 'rejected';
  channelType?: ChannelType;
  platform?: StorePlatform;
  sellerName?: string;
}

export interface CandidateMatchOption {
  id: string;
  competitorId: string;
  competitorName: string;
  competitorDomain: string;
  competitorLogo: string;
  title: string;
  url: string;
  matchPercent: number; // e.g. 98, 92, 85
  price: number;
  regularPrice?: number;
  discountPercent?: number;
  currency: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  channelType?: ChannelType;
  platform?: StorePlatform;
  sellerName?: string;
  isRecommended?: boolean;
}

export interface CompetitorCandidateGroup {
  competitorId: string;
  competitorName: string;
  competitorDomain: string;
  competitorLogo: string;
  channelType?: ChannelType;
  platform?: StorePlatform;
  selectedCandidateId: string | null; // id of CandidateMatchOption or 'custom' or null
  customUrl?: string;
  candidates: CandidateMatchOption[];
}

export interface AlertRule {
  id: string;
  tenantId: string;
  name: string;
  conditionType: 'price_drop' | 'cheaper_than_mrp' | 'competitor_cheaper_by_pct' | 'stock_out' | 'stock_restocked';
  thresholdValue: number; // percentage or fixed amount
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  channel: 'in_app' | 'email' | 'both';
  timesTriggered: number;
  createdAt: string;
}

export interface AlertNotification {
  id: string;
  tenantId: string;
  ruleId?: string;
  ruleName?: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  productId: string;
  productName: string;
  productSku: string;
  competitorId: string;
  competitorName: string;
  oldPrice: number;
  newPrice: number;
  myPrice: number;
  priceDiffPercent: number;
  stockChange?: { from: string; to: string };
  timestamp: string;
  read: boolean;
  actionTaken?: 'repriced' | 'dismissed' | null;
}

export interface ScanJob {
  id: string;
  tenantId: string;
  batchType: 'scheduled_am' | 'scheduled_pm' | 'manual_instant';
  status: 'completed' | 'running' | 'queued' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  productsScanned: number;
  competitorPagesCrawled: number;
  priceChangesFound: number;
  stockChangesFound: number;
  alertsTriggered: number;
  logItems: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'success' | 'error';
    text: string;
  }>;
}

export interface RepriceRecommendation {
  productId: string;
  productName: string;
  productSku: string;
  currentPrice: number;
  costPrice: number;
  lowestCompetitorPrice: number;
  suggestedPrice: number;
  projectedMargin: number;
  strategy: 'match_lowest' | 'undercut_1_percent' | 'maximize_margin_stockout';
  reason: string;
}

export type BackgroundJobType = 'search_candidates' | 'batch_auto_match' | 'daily_scan';
export type BackgroundJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BackgroundJob {
  id: string;
  tenantId: string;
  type: BackgroundJobType;
  title: string;
  status: BackgroundJobStatus;
  progress: number; // 0 - 100
  totalItems: number;
  processedItems: number;
  currentTaskDescription: string;
  payload: any;
  resultSummary?: {
    productsScanned?: number;
    priceChangesFound?: number;
    stockChangesFound?: number;
    alertsTriggered?: number;
    matchesSaved?: number;
    durationMs?: number;
  };
  errors?: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}
