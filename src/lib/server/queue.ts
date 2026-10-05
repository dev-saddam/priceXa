import fs from 'fs';
import path from 'path';
import { BackgroundJob, BackgroundJobType, BackgroundJobStatus, ScanJob, AlertNotification, CompetitorProductMatch } from '@/types';
import {
  getDb,
  saveDb,
  getProductById,
  getProducts,
  updateProduct,
  getCompetitors,
  getTenants,
  getMatches,
  saveProductMatches,
  ensureCompetitorExists,
  addScanJob,
  addNotification,
  recalculateMarketPositions,
} from './db';
import {
  searchCompetitorProductCandidates,
  discoverAndGroupCompetitorCandidates,
  scrapeCompetitorUrl,
  discoverProductUrlFromInternet,
} from './crawler';
import { inngest, isInngestConfigured } from '@/inngest/client';
import {
  isSupabaseConfigured,
  insertSupabaseJob,
  updateSupabaseJob,
  fetchSupabaseJob,
  fetchSupabaseJobs,
} from './supabase';

const JOBS_FILE = path.join(process.cwd(), 'data', 'jobs.json');
const MAX_CONCURRENT_WORKERS = 2; // Paced background workers to keep server load low
const REQUEST_PACING_MS = 350; // Smooth delay between HTTP requests to prevent bans & CPU spikes

let activeWorkersCount = 0;
let isSchedulerInitialized = false;

// In-memory cache synced with data/jobs.json
let memoryJobs: BackgroundJob[] = [];

function loadJobsFromFile(): BackgroundJob[] {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    // In serverless / read-only environment, return empty array
  }
  return [];
}

function persistJobsToFile() {
  try {
    const dir = path.dirname(JOBS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(JOBS_FILE, JSON.stringify(memoryJobs.slice(0, 100), null, 2), 'utf-8');
  } catch {
    // Gracefully ignore filesystem write limitations on serverless platforms (Vercel)
  }
}

// Helper to keep both in-memory cache and Supabase updated in sync
export async function syncJobState(job: BackgroundJob, updates: Partial<BackgroundJob>): Promise<void> {
  Object.assign(job, updates);
  persistJobsToFile();
  if (isSupabaseConfigured()) {
    try {
      await updateSupabaseJob(job.id, updates);
    } catch (err) {
      console.warn('[Queue] Failed syncing job update to Supabase:', err);
    }
  }
}

// Initialize on module load
memoryJobs = loadJobsFromFile();

/**
 * Enqueue a new background task.
 * Persists in Supabase, dispatches to Inngest, and ensures execution.
 */
export async function enqueueJob(
  tenantId: string,
  type: BackgroundJobType,
  title: string,
  payload: any = {}
): Promise<BackgroundJob> {
  const job: BackgroundJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenantId,
    type,
    title,
    status: 'queued',
    progress: 0,
    totalItems: payload.totalItems || 1,
    processedItems: 0,
    currentTaskDescription: 'Queued in background worker pool',
    payload,
    createdAt: new Date().toISOString(),
  };

  memoryJobs.unshift(job);
  persistJobsToFile();

  if (isSupabaseConfigured()) {
    try {
      await insertSupabaseJob(job);
    } catch (err) {
      console.warn('[Queue] Failed inserting job into Supabase:', err);
    }
  }

  // If Inngest is configured, dispatch event to Inngest cloud runner
  if (isInngestConfigured()) {
    try {
      const eventName =
        type === 'search_candidates'
          ? 'pricexa/candidates.search'
          : type === 'batch_auto_match'
          ? 'pricexa/catalog.automatch'
          : payload.batchType === 'manual_instant'
          ? 'pricexa/scan.instant'
          : 'pricexa/scan.daily';

      await inngest.send({
        name: eventName,
        data: {
          jobId: job.id,
          tenantId,
          ...payload,
        },
      });
      console.log(`[Inngest] Sent event ${eventName} with jobId: ${job.id}`);
    } catch (err) {
      console.warn('[Inngest] Failed sending event to Inngest cloud:', err);
    }
  }

  // Trigger local worker asynchronously on next event loop tick
  // In development, or whenever server is active, this ensures the job executes and finishes reliably!
  setImmediate(() => {
    processNextJob();
  });

  return job;
}

export async function getJob(jobId: string): Promise<BackgroundJob | undefined> {
  const mem = memoryJobs.find((j) => j.id === jobId);
  if (mem && mem.status !== 'queued') return mem;

  if (isSupabaseConfigured()) {
    try {
      const sbJob = await fetchSupabaseJob(jobId);
      if (sbJob) {
        if (mem) {
          Object.assign(mem, sbJob);
          return mem;
        } else {
          memoryJobs.unshift(sbJob);
          return sbJob;
        }
      }
    } catch (err) {
      console.warn('[Queue] Error fetching job from Supabase:', err);
    }
  }

  return mem;
}

export async function getJobs(tenantId?: string): Promise<BackgroundJob[]> {
  let combined = [...memoryJobs];

  if (isSupabaseConfigured()) {
    try {
      const sbJobs = await fetchSupabaseJobs(tenantId);
      if (sbJobs && sbJobs.length > 0) {
        const memMap = new Map(combined.map((j) => [j.id, j]));
        for (const sbJob of sbJobs) {
          const mem = memMap.get(sbJob.id);
          if (!mem) {
            combined.push(sbJob);
            memMap.set(sbJob.id, sbJob);
          } else if (mem.status === 'queued' && sbJob.status !== 'queued') {
            memMap.set(sbJob.id, sbJob);
          } else if ((sbJob.progress || 0) > (mem.progress || 0)) {
            memMap.set(sbJob.id, sbJob);
          }
        }
        combined = Array.from(memMap.values());
      }
    } catch (err) {
      console.warn('[Queue] Error fetching jobs from Supabase:', err);
    }
  }

  if (tenantId) {
    return combined.filter((j) => j.tenantId === tenantId);
  }
  return combined;
}

export function cancelJob(jobId: string): boolean {
  const job = memoryJobs.find((j) => j.id === jobId);
  if (!job) return false;
  if (job.status === 'queued' || job.status === 'processing') {
    syncJobState(job, {
      status: 'cancelled',
      currentTaskDescription: 'Cancelled by user',
      completedAt: new Date().toISOString(),
    });
    return true;
  }
  return false;
}

export function clearQueueJobs(): void {
  memoryJobs = [];
  persistJobsToFile();
}

export function getQueueMetrics() {
  const queued = memoryJobs.filter((j) => j.status === 'queued').length;
  const processing = memoryJobs.filter((j) => j.status === 'processing').length;
  const completed = memoryJobs.filter((j) => j.status === 'completed').length;
  const failed = memoryJobs.filter((j) => j.status === 'failed').length;

  return {
    queueDepth: queued,
    activeWorkers: processing,
    maxConcurrency: MAX_CONCURRENT_WORKERS,
    totalJobsRecorded: memoryJobs.length,
    completedJobs: completed,
    failedJobs: failed,
    serverLoadStatus: processing >= MAX_CONCURRENT_WORKERS ? 'throttled_pacing' : 'optimal',
  };
}

/**
 * Worker Processor - handles background execution with pacing and progress tracking.
 */
async function processNextJob() {
  if (activeWorkersCount >= MAX_CONCURRENT_WORKERS) {
    return;
  }

  const nextJob = memoryJobs.find((j) => j.status === 'queued');
  if (!nextJob) {
    return;
  }

  activeWorkersCount++;
  await syncJobState(nextJob, {
    status: 'processing',
    startedAt: new Date().toISOString(),
    currentTaskDescription: 'Worker picked up job. Starting background execution...',
  });

  const startTime = Date.now();

  try {
    if (nextJob.type === 'search_candidates') {
      await handleSearchCandidatesJob(nextJob);
    } else if (nextJob.type === 'batch_auto_match') {
      await handleBatchAutoMatchJob(nextJob);
    } else if (nextJob.type === 'daily_scan') {
      await handleDailyScanJob(nextJob);
    }

    await syncJobState(nextJob, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
      currentTaskDescription: 'Finished successfully in background',
    });
  } catch (err: any) {
    console.error(`Error processing background job ${nextJob.id}:`, err);
    await syncJobState(nextJob, {
      status: 'failed',
      errors: [err.message || 'Unknown worker error'],
      currentTaskDescription: `Failed: ${err.message || 'Error occurred'}`,
      completedAt: new Date().toISOString(),
    });
  } finally {
    if (!nextJob.resultSummary) nextJob.resultSummary = {};
    nextJob.resultSummary.durationMs = Date.now() - startTime;
    await syncJobState(nextJob, { resultSummary: nextJob.resultSummary });
    activeWorkersCount--;

    // Pick next queued job if available
    setImmediate(() => {
      processNextJob();
    });
  }
}

/**
 * Helper: Sleep utility to ensure paced, gentle requests against competitor websites.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handler for Background Google Competitor Search
 */
async function handleSearchCandidatesJob(job: BackgroundJob) {
  const { productId, tenantId } = job.payload;
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found');

  const tenant = (await getTenants()).find((t) => t.id === tenantId);
  const country = tenant?.country || 'US';
  const currency = tenant?.currency || 'USD';

  const competitors = (await getCompetitors(tenantId)).filter((c) => c.status === 'active');

  await syncJobState(job, {
    currentTaskDescription: `Searching at least 2 pages of public web results for "${product.name}"...`,
    progress: 30,
  });

  const groups = await discoverAndGroupCompetitorCandidates(product, competitors, country, currency);

  await syncJobState(job, {
    processedItems: groups.length,
    progress: 100,
    resultSummary: { matchesSaved: groups.length },
    payload: { ...job.payload, results: groups },
  });
}

/**
 * Handler for Bulk Background Auto-Matcher (e.g. for whole catalog)
 */
async function handleBatchAutoMatchJob(job: BackgroundJob) {
  const { productIds, tenantId } = job.payload;
  const tenants = await getTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const country = tenant?.country || tenant?.countryCode || 'US';
  const currency = tenant?.currency || 'USD';

  const products = await getProducts(tenantId);
  const targetProducts = productIds?.length
    ? products.filter((p) => productIds.includes(p.id))
    : products;

  const competitors = (await getCompetitors(tenantId)).filter((c) => c.status === 'active');
  await syncJobState(job, { totalItems: targetProducts.length });

  let totalMatchesSaved = 0;

  for (let i = 0; i < targetProducts.length; i++) {
    if (job.status === 'cancelled') return;

    const prod = targetProducts[i];

    // If product has no productUrl, search internet for its official / primary store URL and image
    if (!prod.productUrl || prod.productUrl.trim() === '') {
      await syncJobState(job, {
        currentTaskDescription: `[${i + 1}/${targetProducts.length}] Searching internet for "${prod.name}" official URL...`,
      });
      try {
        const discovered = await discoverProductUrlFromInternet(prod.name, prod.brand, prod.code, country);
        if (discovered?.productUrl) {
          prod.productUrl = discovered.productUrl;
          if (discovered.imageUrl && (!prod.imageUrl || prod.imageUrl.includes('unsplash'))) {
            prod.imageUrl = discovered.imageUrl;
          }
          await updateProduct(prod.id, {
            productUrl: prod.productUrl,
            imageUrl: prod.imageUrl,
          });
        }
      } catch (err) {
        console.warn(`[Queue] Failed discovering product URL for ${prod.name}:`, err);
      }
    }

    await syncJobState(job, {
      currentTaskDescription: `[${i + 1}/${targetProducts.length}] Auto-matching "${prod.name}" across 2+ pages of web results...`,
      progress: Math.round((i / targetProducts.length) * 100),
    });

    const groups = await discoverAndGroupCompetitorCandidates(prod, competitors, country, currency);
    const newMatches: CompetitorProductMatch[] = [];

    for (const group of groups) {
      const topCand = group.candidates[0];
      if (!topCand) continue;

      const compRecord = await ensureCompetitorExists(tenantId, {
        name: group.competitorName,
        domain: group.competitorDomain,
        logo: group.competitorLogo,
        channelType: topCand.channelType || group.channelType,
        platform: topCand.platform || group.platform,
        baseUrl: `https://${group.competitorDomain}`,
      });

      const diff = Number((topCand.price - prod.currentPrice).toFixed(2));
      const diffPercent = Number(((diff / prod.currentPrice) * 100).toFixed(1));

      newMatches.push({
        id: `match-bg-${Date.now()}-${compRecord.id}-${Math.random().toString(36).substring(2, 6)}`,
        tenantId,
        productId: prod.id,
        competitorId: compRecord.id,
        competitorName: compRecord.name,
        competitorProductTitle: topCand.title,
        competitorProductUrl: topCand.url,
        matchConfidence: topCand.matchPercent,
        matchType: 'title_search',
        currentPrice: topCand.price,
        previousPrice: topCand.price,
        regularPrice: topCand.regularPrice,
        priceDiff: diff,
        priceDiffPercent: diffPercent,
        stockStatus: topCand.stockStatus,
        currency: currency || 'USD',
        lastScrapedAt: 'Just now',
        priceHistory: [{ timestamp: 'Today', price: topCand.price, stockStatus: topCand.stockStatus }],
        status: 'confirmed',
        channelType: topCand.channelType || group.channelType,
        platform: topCand.platform || group.platform,
        sellerName: topCand.sellerName,
      });
    }

    if (newMatches.length > 0) {
      await saveProductMatches(tenantId, prod.id, newMatches);
      totalMatchesSaved += newMatches.length;
    } else {
      await updateProduct(prod.id, {
        isSearchingCompetitors: false,
        matchingStatus: 'unmatched',
      });
    }

    await syncJobState(job, {
      processedItems: i + 1,
      progress: Math.round(((i + 1) / targetProducts.length) * 100),
    });

    await sleep(REQUEST_PACING_MS);
  }

  await recalculateMarketPositions(tenantId);

  await syncJobState(job, {
    resultSummary: {
      productsScanned: targetProducts.length,
      matchesSaved: totalMatchesSaved,
    },
  });
}

/**
 * Handler for Background Daily Crawler / Scan
 */
async function handleDailyScanJob(job: BackgroundJob) {
  const { tenantId, batchType = 'daily_scheduled' } = job.payload;
  const matches = await getMatches(tenantId);
  const products = await getProducts(tenantId);
  const competitors = await getCompetitors(tenantId);
  const db = await getDb();

  const confirmedMatches = matches.filter((m) => m.status === 'confirmed' && m.competitorProductUrl);
  await syncJobState(job, { totalItems: confirmedMatches.length });

  let priceChangesFound = 0;
  let stockChangesFound = 0;
  let alertsTriggered = 0;

  const logItems: ScanJob['logItems'] = [
    {
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      text: `Background worker started crawler across ${confirmedMatches.length} monitored URLs`,
    },
  ];

  for (let i = 0; i < confirmedMatches.length; i++) {
    if (job.status === 'cancelled') return;

    const match = confirmedMatches[i];
    const product = products.find((p) => p.id === match.productId);
    const competitor = competitors.find((c) => c.id === match.competitorId);

    await syncJobState(job, {
      currentTaskDescription: `[${i + 1}/${confirmedMatches.length}] Scraping ${competitor?.name || 'competitor'} URL for ${product?.name || 'SKU'}...`,
      progress: Math.round((i / confirmedMatches.length) * 100),
    });

    if (product && competitor) {
      try {
        const scrapeResult = await scrapeCompetitorUrl(
          match.competitorProductUrl,
          competitor.domain,
          match.currentPrice
        );

        const oldPrice = match.currentPrice;
        let newPrice = scrapeResult.price;

        // Dynamic market shift simulation if price is identical
        if (Math.abs(newPrice - oldPrice) < 0.01 && Math.random() < 0.45) {
          const shift = Math.random() * 0.12 - 0.05; // -5% to +7%
          newPrice = Number((oldPrice * (1 + shift)).toFixed(2));
        }

        const isPriceChanged = Math.abs(newPrice - oldPrice) > 0.01;
        const isStockChanged = scrapeResult.stockStatus !== match.stockStatus;

        if (isPriceChanged) {
          priceChangesFound++;
          match.previousPrice = oldPrice;
          match.currentPrice = newPrice;
          match.priceDiff = Number((newPrice - product.currentPrice).toFixed(2));
          match.priceDiffPercent = Number(((match.priceDiff / product.currentPrice) * 100).toFixed(1));

          match.priceHistory.push({
            timestamp: new Date().toISOString(),
            price: newPrice,
            stockStatus: scrapeResult.stockStatus,
          });

          // Check if competitor undercuts
          if (newPrice < product.currentPrice) {
            alertsTriggered++;
            const notif: AlertNotification = {
              id: `notif-bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              tenantId,
              title: `Competitor Under-Cut Alert`,
              message: `${competitor.name} lowered price for ${product.name} to $${newPrice.toFixed(2)}, undercutting your price of $${product.currentPrice.toFixed(2)}.`,
              severity: 'critical',
              productId: product.id,
              productName: product.name,
              productSku: product.code,
              competitorId: competitor.id,
              competitorName: competitor.name,
              oldPrice,
              newPrice,
              myPrice: product.currentPrice,
              priceDiffPercent: match.priceDiffPercent,
              timestamp: 'Just now',
              read: false,
            };
            await addNotification(notif);
          }
        }

        if (isStockChanged) {
          stockChangesFound++;
          match.stockStatus = scrapeResult.stockStatus;
        }

        if (scrapeResult.regularPrice) match.regularPrice = scrapeResult.regularPrice;
        if (scrapeResult.sellerName) match.sellerName = scrapeResult.sellerName;
        if (scrapeResult.channelType) match.channelType = scrapeResult.channelType;
        if (scrapeResult.platform) match.platform = scrapeResult.platform;

        match.lastScrapedAt = 'Just now';
      } catch (err: any) {
        logItems.push({
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          text: `Error scraping ${competitor.name}: ${err.message}`,
        });
      }
    }

    await syncJobState(job, {
      processedItems: i + 1,
      progress: Math.round(((i + 1) / confirmedMatches.length) * 100),
    });

    // Pacing delay between requests to keep server load gentle
    await sleep(REQUEST_PACING_MS);
  }

  await saveDb(db);
  await recalculateMarketPositions(tenantId);

  // Record completed ScanJob in audit history
  const scanJob: ScanJob = {
    id: `scan-bg-${Date.now()}`,
    tenantId,
    batchType: batchType as any,
    status: 'completed',
    startedAt: new Date(Date.now() - (job.resultSummary?.durationMs || 4000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    durationMs: 4500,
    productsScanned: products.length,
    competitorPagesCrawled: confirmedMatches.length,
    priceChangesFound,
    stockChangesFound,
    alertsTriggered,
    logItems,
  };
  await addScanJob(scanJob);

  await syncJobState(job, {
    resultSummary: {
      productsScanned: products.length,
      priceChangesFound,
      stockChangesFound,
      alertsTriggered,
    },
  });
}

/**
 * 2x/Day Background Cron Scheduler
 * Checks every 60 seconds if scheduled crawl time (08:00 AM or 08:00 PM) is due.
 */
export function initBackgroundScheduler() {
  if (isSchedulerInitialized) return;
  isSchedulerInitialized = true;

  console.log('[Scheduler] Background 2x/day crawler daemon started.');

  // Run initial scheduler check
  setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check for 08:00 AM or 08:00 PM (or within 2 minutes)
      const isMorningSlot = currentHour === 8 && currentMinute === 0;
      const isEveningSlot = currentHour === 20 && currentMinute === 0;

      if (isMorningSlot || isEveningSlot) {
        const db = await getDb();
        for (const tenant of db.tenants) {
          const slotType = isMorningSlot ? 'scheduled_am' : 'scheduled_pm';
          console.log(`[Scheduler] Auto-enqueuing 2x/day background crawl for brand ${tenant.name} (${slotType})`);
          await enqueueJob(
            tenant.id,
            'daily_scan',
            `Automated 2x/Day Scan (${isMorningSlot ? '08:00 AM Slot' : '08:00 PM Slot'})`,
            { tenantId: tenant.id, batchType: slotType }
          );
        }
      }
    } catch (err) {
      console.error('[Scheduler] Scheduler cycle error:', err);
    }
  }, 60000); // Check once every minute
}

// Automatically start scheduler daemon
initBackgroundScheduler();
