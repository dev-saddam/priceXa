import { inngest } from './client';
import {
  getProductById,
  getProducts,
  updateProduct,
  getCompetitors,
  getTenants,
  getMatches,
  saveProductMatches,
  ensureCompetitorExists,
  addScanJob,
  recalculateMarketPositions,
} from '@/lib/server/db';
import {
  searchCompetitorProductCandidates,
  discoverAndGroupCompetitorCandidates,
  scrapeCompetitorUrl,
  discoverProductUrlFromInternet,
} from '@/lib/server/crawler';
import { CompetitorProductMatch, ScanJob } from '@/types';
import { isSupabaseConfigured, updateSupabaseJob } from '@/lib/server/supabase';

/**
 * Inngest Function: Search Competitor Product Candidates
 * Fans out across competitor stores with automatic retry and rate pacing.
 */
export const searchCandidatesFunction = inngest.createFunction(
  {
    id: 'search-candidates',
    name: 'Search Competitor Candidates',
    retries: 2,
    triggers: [{ event: 'pricexa/candidates.search' }],
  },
  async ({ event, step }: any) => {
    const { productId, tenantId, jobId } = event.data;

    if (jobId && isSupabaseConfigured()) {
      await updateSupabaseJob(jobId, {
        status: 'processing',
        progress: 10,
        currentTaskDescription: 'Inngest worker started candidate search across competitor stores...',
        startedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    const { product, competitors, country, currency } = await step.run('load-product-and-competitors', async () => {
      const prod = await getProductById(productId);
      if (!prod) throw new Error(`Product ${productId} not found`);

      const comps = (await getCompetitors(tenantId)).filter((c) => c.status === 'active');
      const tenants = await getTenants();
      const tenant = tenants.find((t) => t.id === tenantId);

      return {
        product: prod,
        competitors: comps,
        country: tenant?.country || tenant?.countryCode || 'US',
        currency: tenant?.currency || 'USD',
      };
    });

    const groups = await step.run('multi-page-candidate-search', async () => {
      return await discoverAndGroupCompetitorCandidates(product, competitors, country, currency);
    });

    if (jobId && isSupabaseConfigured()) {
      await updateSupabaseJob(jobId, {
        status: 'completed',
        progress: 100,
        currentTaskDescription: `Finished candidate search across ${competitors.length} stores`,
        completedAt: new Date().toISOString(),
        resultSummary: { matchesSaved: groups.length },
      }).catch(() => {});
    }

    return {
      productId,
      tenantId,
      groupsCount: groups.length,
      groups,
    };
  }
);

/**
 * Inngest Function: Batch Catalog Auto-Matcher
 * Executes step-by-step per product so serverless execution timeouts never occur.
 */
export const batchAutoMatchFunction = inngest.createFunction(
  {
    id: 'batch-auto-match',
    name: 'Batch Catalog Auto-Matcher',
    retries: 1,
    triggers: [{ event: 'pricexa/catalog.automatch' }],
  },
  async ({ event, step }: any) => {
    const { tenantId, productIds, jobId } = event.data;

    if (jobId && isSupabaseConfigured()) {
      await updateSupabaseJob(jobId, {
        status: 'processing',
        progress: 5,
        currentTaskDescription: 'Inngest worker started batch auto-matching across stores...',
        startedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    const { targetProducts, competitors, country, currency } = await step.run(
      'load-catalog-and-stores',
      async () => {
        const allProducts = await getProducts(tenantId);
        const filtered = productIds?.length
          ? allProducts.filter((p) => productIds.includes(p.id))
          : allProducts;

        const comps = (await getCompetitors(tenantId)).filter((c) => c.status === 'active');
        const tenants = await getTenants();
        const tenant = tenants.find((t) => t.id === tenantId);

        return {
          targetProducts: filtered,
          competitors: comps,
          country: tenant?.country || tenant?.countryCode || 'US',
          currency: tenant?.currency || 'USD',
        };
      }
    );

    let totalMatchesSaved = 0;

    for (let i = 0; i < targetProducts.length; i++) {
      const prod = targetProducts[i];

      // If product has no productUrl, search internet for its official / primary store URL and image
      if (!prod.productUrl || prod.productUrl.trim() === '') {
        await step.run(`discover-product-url-${prod.id}`, async () => {
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
            console.warn(`[Inngest] Failed discovering product URL for ${prod.name}:`, err);
          }
        });
      }

      const matchesCount = await step.run(`auto-match-product-${prod.id}`, async () => {
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
            id: `match-inngest-${Date.now()}-${compRecord.id}-${Math.random().toString(36).substring(2, 6)}`,
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
            stockStatus: topCand.stockStatus || 'in_stock',
            currency: topCand.currency || currency,
            lastScrapedAt: new Date().toISOString(),
            priceHistory: [
              {
                timestamp: new Date().toISOString(),
                price: topCand.price,
                stockStatus: topCand.stockStatus || 'in_stock',
              },
            ],
            status: 'confirmed',
            channelType: topCand.channelType || group.channelType,
            platform: topCand.platform || group.platform,
            sellerName: topCand.sellerName,
          });
        }

        if (newMatches.length > 0) {
          await saveProductMatches(tenantId, prod.id, newMatches);
        } else {
          await updateProduct(prod.id, {
            isSearchingCompetitors: false,
            matchingStatus: 'unmatched',
          });
        }

        return newMatches.length;
      });

      totalMatchesSaved += matchesCount;

      if (jobId && isSupabaseConfigured()) {
        const pct = Math.round(((i + 1) / targetProducts.length) * 100);
        await updateSupabaseJob(jobId, {
          progress: pct,
          processedItems: i + 1,
          currentTaskDescription: `Auto-matched ${i + 1}/${targetProducts.length} products across stores`,
        }).catch(() => {});
      }
    }

    await step.run('recalculate-positions', async () => {
      await recalculateMarketPositions(tenantId);
    });

    if (jobId && isSupabaseConfigured()) {
      await updateSupabaseJob(jobId, {
        status: 'completed',
        progress: 100,
        currentTaskDescription: `Finished batch auto-matching ${targetProducts.length} products (${totalMatchesSaved} matches saved)`,
        completedAt: new Date().toISOString(),
        resultSummary: {
          productsScanned: targetProducts.length,
          matchesSaved: totalMatchesSaved,
        },
      }).catch(() => {});
    }

    return {
      tenantId,
      productsProcessed: targetProducts.length,
      totalMatchesSaved,
    };
  }
);

/**
 * Inngest Function: 2x/Day Scheduled Crawl Cron
 * Runs automated morning (08:00 AM) and evening (08:00 PM) sweeps.
 */
export const dailyScanFunction = inngest.createFunction(
  {
    id: 'daily-scan-cron',
    name: 'Automated 2x/Day Crawl Cron',
    triggers: [
      { cron: '0 8,20 * * *' }, // Triggers at 08:00 AM and 08:00 PM daily
      { event: 'pricexa/scan.daily' },
    ],
  },
  async ({ event, step }: any) => {
    const jobId = event?.data?.jobId;
    const singleTenantId = event?.data?.tenantId;

    if (jobId && isSupabaseConfigured()) {
      await updateSupabaseJob(jobId, {
        status: 'processing',
        progress: 10,
        currentTaskDescription: 'Inngest worker started scheduled crawl sweep...',
        startedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    const tenants = await step.run('get-active-tenants', async () => {
      const all = await getTenants();
      const active = all.filter((t) => t.planStatus === 'active');
      if (singleTenantId) {
        const matched = active.filter((t) => t.id === singleTenantId);
        return matched.length > 0 ? matched : active;
      }
      return active;
    });

    let totalPriceChanges = 0;
    let totalStockChanges = 0;

    for (const tenant of tenants) {
      await step.run(`scan-tenant-${tenant.id}`, async () => {
        const matches = await getMatches(tenant.id);
        const products = await getProducts(tenant.id);
        const startTime = Date.now();

        let priceChanges = 0;
        let stockChanges = 0;

        for (const match of matches) {
          try {
            const updated = await scrapeCompetitorUrl(
              match.competitorProductUrl,
              match.competitorId,
              match.currentPrice
            );

            if (updated.price && updated.price !== match.currentPrice) {
              priceChanges++;
              match.previousPrice = match.currentPrice;
              match.currentPrice = updated.price;
              match.lastScrapedAt = new Date().toISOString();
            }

            if (updated.stockStatus && updated.stockStatus !== match.stockStatus) {
              stockChanges++;
              match.stockStatus = updated.stockStatus;
            }
          } catch {}
        }

        totalPriceChanges += priceChanges;
        totalStockChanges += stockChanges;

        const scanJob: ScanJob = {
          id: `scan-${Date.now()}-${tenant.id}`,
          tenantId: tenant.id,
          batchType: 'scheduled_am',
          status: 'completed',
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          productsScanned: products.length,
          competitorPagesCrawled: matches.length,
          priceChangesFound: priceChanges,
          stockChangesFound: stockChanges,
          alertsTriggered: priceChanges,
          logItems: [
            {
              timestamp: new Date().toISOString(),
              level: 'info',
              text: `Inngest automated scan completed: ${matches.length} tracked URLs verified.`,
            },
          ],
        };

        await addScanJob(scanJob);
        await recalculateMarketPositions(tenant.id);
      });
    }

    if (jobId && isSupabaseConfigured()) {
      await updateSupabaseJob(jobId, {
        status: 'completed',
        progress: 100,
        currentTaskDescription: `Finished scheduled crawl across ${tenants.length} tenants (${totalPriceChanges} price updates detected)`,
        completedAt: new Date().toISOString(),
        resultSummary: {
          tenantsScanned: tenants.length,
          priceChangesFound: totalPriceChanges,
          stockChangesFound: totalStockChanges,
        },
      }).catch(() => {});
    }

    return { completedTenants: tenants.length, totalPriceChanges, totalStockChanges };
  }
);

/**
 * Inngest Function: Instant On-Demand Scan
 */
export const instantScanFunction = inngest.createFunction(
  {
    id: 'instant-scan',
    name: 'Instant Catalog Price Scan',
    triggers: [{ event: 'pricexa/scan.instant' }],
  },
  async ({ event, step }: any) => {
    const { tenantId, jobId } = event.data;

    if (jobId && isSupabaseConfigured()) {
      await updateSupabaseJob(jobId, {
        status: 'processing',
        progress: 10,
        currentTaskDescription: 'Inngest worker started instant catalog price scan...',
        startedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    return await step.run('execute-instant-scan', async () => {
      const matches = await getMatches(tenantId);
      const products = await getProducts(tenantId);
      const startTime = Date.now();

      let priceChanges = 0;
      let stockChanges = 0;

      for (const match of matches) {
        try {
          const updated = await scrapeCompetitorUrl(
            match.competitorProductUrl,
            match.competitorId,
            match.currentPrice
          );

          if (updated.price && updated.price !== match.currentPrice) {
            priceChanges++;
            match.previousPrice = match.currentPrice;
            match.currentPrice = updated.price;
            match.lastScrapedAt = new Date().toISOString();
          }

          if (updated.stockStatus && updated.stockStatus !== match.stockStatus) {
            stockChanges++;
            match.stockStatus = updated.stockStatus;
          }
        } catch {}
      }

      const scanJob: ScanJob = {
        id: `scan-instant-${Date.now()}`,
        tenantId,
        batchType: 'manual_instant',
        status: 'completed',
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        productsScanned: products.length,
        competitorPagesCrawled: matches.length,
        priceChangesFound: priceChanges,
        stockChangesFound: stockChanges,
        alertsTriggered: priceChanges,
        logItems: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            text: `Instant manual scan completed: ${matches.length} URLs scraped.`,
          },
        ],
      };

      await addScanJob(scanJob);
      await recalculateMarketPositions(tenantId);

      if (jobId && isSupabaseConfigured()) {
        await updateSupabaseJob(jobId, {
          status: 'completed',
          progress: 100,
          currentTaskDescription: `Instant manual scan completed: ${matches.length} URLs scraped (${priceChanges} price changes detected)`,
          completedAt: new Date().toISOString(),
          resultSummary: {
            productsScanned: products.length,
            priceChangesFound: priceChanges,
            stockChangesFound: stockChanges,
            alertsTriggered: priceChanges,
            durationMs: Date.now() - startTime,
          },
        }).catch(() => {});
      }

      return scanJob;
    });
  }
);
