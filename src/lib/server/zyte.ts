/**
 * Zyte API Client & Automated E-Commerce Extraction Engine
 * Official API Documentation: https://docs.zyte.com/zyte-api/
 *
 * Provides:
 * 1. AI-powered automated e-commerce extraction (price, regular price, stock, title, SKU).
 * 2. Residential proxy IP pool with country-level geolocation matching company settings.
 * 3. Headless browser JavaScript rendering to bypass anti-bot protections (Cloudflare, Akamai, Datadome).
 * 4. Resilient search engine fetching (Google, Bing, DuckDuckGo) without CAPTCHAs.
 */
import * as cheerio from 'cheerio';

export interface ZyteExtractOptions {
  url: string;
  browserHtml?: boolean;
  httpResponseBody?: boolean;
  product?: boolean;
  serp?: boolean;
  geolocation?: string;
  timeoutMs?: number;
}

export interface ZyteSerpOrganicItem {
  rank?: number;
  title?: string;
  name?: string;
  url?: string;
  snippet?: string;
  description?: string;
  displayedUrl?: string;
  displayedUrlText?: string;
  domain?: string;
}

export interface ZyteSerpData {
  organicResults?: ZyteSerpOrganicItem[];
  pageNumber?: number;
  url?: string;
  metadata?: Record<string, any>;
}

export interface ZyteProductData {
  name?: string;
  price?: string | number;
  regularPrice?: string | number;
  currency?: string;
  currencyRaw?: string;
  availability?: 'InStock' | 'OutOfStock' | string;
  sku?: string;
  mpn?: string;
  brand?: { name?: string };
  breadcrumbs?: Array<{ name?: string; url?: string }>;
  mainImage?: { url?: string };
  images?: Array<{ url?: string }>;
  description?: string;
  features?: string[];
  canonicalUrl?: string;
  metadata?: Record<string, any>;
}

export interface ZyteExtractResponse {
  url: string;
  statusCode?: number;
  browserHtml?: string;
  httpResponseBody?: string;
  product?: ZyteProductData;
  serp?: ZyteSerpData;
  error?: string;
}

/**
 * Retrieves the configured Zyte API key from environment variables.
 */
export function getZyteApiKey(): string | undefined {
  const raw = process.env.ZYTE_API_KEY || process.env.ZYTE_KEY;
  return raw ? raw.trim().replace(/^["']|["']$/g, '') : undefined;
}

/**
 * Returns true if Zyte API is configured with a non-empty API key.
 */
export function isZyteConfigured(): boolean {
  const key = getZyteApiKey();
  return Boolean(key && key.length > 5);
}

/**
 * Masks a Zyte API key for safe display in UI/logs.
 */
export function maskZyteApiKey(key?: string): string {
  const effectiveKey = key || getZyteApiKey();
  if (!effectiveKey) return '';
  if (effectiveKey.length <= 8) return '••••••••';
  return `${effectiveKey.slice(0, 4)}••••••••${effectiveKey.slice(-4)}`;
}

/**
 * Core Zyte API request handler (/v1/extract).
 */
export async function zyteExtract(options: ZyteExtractOptions): Promise<ZyteExtractResponse | null> {
  const apiKey = getZyteApiKey();
  if (!apiKey) {
    return null;
  }

  const endpoint = 'https://api.zyte.com/v1/extract';
  const timeoutMs = options.timeoutMs || 25000;

  // Build Zyte extraction payload
  const payload: Record<string, any> = {
    url: options.url,
  };

  if (options.product) {
    payload.product = true;
  }
  if (options.serp) {
    payload.serp = true;
  }
  if (options.browserHtml) {
    payload.browserHtml = true;
  }
  if (options.httpResponseBody) {
    payload.httpResponseBody = true;
  }
  if (options.geolocation && /^[A-Z]{2}$/i.test(options.geolocation)) {
    payload.geolocation = options.geolocation.toUpperCase();
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

  console.log(
    `[Zyte API] 🚀 POST /v1/extract | URL: ${options.url.slice(0, 80)} | serp: ${!!options.serp} | product: ${!!options.product} | browserHtml: ${!!options.browserHtml} | geo: ${options.geolocation || 'auto'}`
  );

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    const data = await res.json();

    if (!res.ok) {
      console.warn(
        `[Zyte API] ⚠️ Zyte returned HTTP ${res.status}: ${data.title || data.detail || JSON.stringify(data).slice(0, 150)}`
      );
      return {
        url: options.url,
        statusCode: res.status,
        error: data.detail || data.title || `Zyte HTTP ${res.status}`,
      };
    }

    let decodedBody: string | undefined;
    if (data.httpResponseBody) {
      try {
        decodedBody = Buffer.from(data.httpResponseBody, 'base64').toString('utf-8');
      } catch {}
    }

    console.log(
      `[Zyte API] ✅ Success HTTP ${data.statusCode || res.status} | serp: ${data.serp ? `${data.serp.organicResults?.length || 0} items` : 'none'} | product: ${data.product ? `"${data.product.name?.slice(0, 30)}" ($${data.product.price})` : 'none'} | HTML: ${data.browserHtml ? `${data.browserHtml.length} bytes` : (decodedBody ? `${decodedBody.length} bytes` : '0')}`
    );

    return {
      url: data.url || options.url,
      statusCode: data.statusCode || res.status,
      browserHtml: data.browserHtml || decodedBody,
      httpResponseBody: decodedBody,
      product: data.product,
      serp: data.serp,
    };
  } catch (err: any) {
    console.warn(`[Zyte API] ❌ Request error:`, err.message);
    return null;
  }
}

/**
 * Fetches fully-rendered browser HTML of any URL via Zyte API (bypassing CAPTCHAs & anti-bot blockers).
 */
export async function fetchHtmlViaZyte(url: string, country?: string): Promise<string | null> {
  if (!isZyteConfigured()) return null;

  const result = await zyteExtract({
    url,
    browserHtml: true,
    geolocation: country,
  });

  return result?.browserHtml || null;
}

/**
 * Extracts structured product data (price, title, currency, stock) directly via Zyte's AI Extraction engine.
 */
export async function extractProductViaZyte(
  url: string,
  country?: string
): Promise<{ product?: ZyteProductData; html?: string } | null> {
  if (!isZyteConfigured()) return null;

  const result = await zyteExtract({
    url,
    product: true,
    browserHtml: true,
    geolocation: country,
  });

  if (!result) return null;

  return {
    product: result.product,
    html: result.browserHtml,
  };
}

/**
 * Extracts clean domain from a raw URL or displayed search snippet (e.g. "https://www.example.com › ...").
 */
export function extractDomainFromUrlOrDisplayed(urlOrDisplayed: string): string {
  if (!urlOrDisplayed) return '';
  const trimmed = urlOrDisplayed.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed.split(/[\s›>]/)[0]);
      return u.hostname.replace(/^www\./, '').toLowerCase();
    } catch {}
  }
  const match = trimmed.match(/https?:\/\/([^\s\/›>]+)/i) || trimmed.match(/^([a-zA-Z0-9.\-]+\.[a-z]{2,})/i);
  if (match) {
    return match[1].replace(/^www\./, '').toLowerCase();
  }
  return '';
}

/**
 * Queries search engine results via Zyte SERP API:
 * 1. Primary: Dedicated Zyte Search API (POST https://api.zyte.com/v1/search)
 * 2. Fallback: Bing SERP via Zyte residential proxy (POST https://api.zyte.com/v1/extract)
 * 3. Fallback: DuckDuckGo SERP via Zyte residential proxy (POST https://api.zyte.com/v1/extract)
 */
export async function fetchSerpViaZyte(
  query: string,
  country: string = 'US'
): Promise<ZyteSerpOrganicItem[]> {
  if (!isZyteConfigured()) return [];

  const apiKey = getZyteApiKey();
  if (!apiKey) return [];

  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const effectiveCountry = (country || 'US').toUpperCase();
  const results: ZyteSerpOrganicItem[] = [];

  // 1. Try Zyte Dedicated Search API (https://api.zyte.com/v1/search)
  try {
    console.log(`[Zyte SERP] 🔎 Querying Search API for: "${query}" (domain: google.com, country: ${effectiveCountry})`);
    const searchRes = await fetch('https://api.zyte.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: 'google.com',
        query,
        include: ['organic'],
        maxResults: 20,
      }),
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const organicList: any[] = searchData.organicResults || [];
      if (organicList.length > 0) {
        console.log(`[Zyte SERP] ✅ Search API returned ${organicList.length} organic items`);
        for (const item of organicList) {
          const rawUrl = item.url || '';
          const disp = item.displayedUrl || item.displayedUrlText || '';
          const domain = extractDomainFromUrlOrDisplayed(rawUrl) || extractDomainFromUrlOrDisplayed(disp);
          results.push({
            rank: item.rank || results.length + 1,
            title: item.title || item.name || '',
            snippet: item.snippet || item.description || '',
            url: rawUrl.startsWith('http') ? rawUrl : (disp.startsWith('http') ? disp.split(/[\s›>]/)[0] : rawUrl),
            displayedUrl: disp,
            domain,
          });
        }
      }
    } else {
      console.warn(`[Zyte SERP] ⚠️ /v1/search returned HTTP ${searchRes.status}`);
    }
  } catch (err: any) {
    console.warn(`[Zyte SERP] ⚠️ /v1/search attempt warning:`, err.message);
  }

  // 2. Fallback: Bing via Zyte Extract Proxy (returns 200 OK without anti-bot blocks)
  if (results.length < 5) {
    try {
      console.log(`[Zyte SERP] ⚡ Falling back to Bing SERP via Zyte proxy for: "${query}" (geo: ${effectiveCountry})`);
      const bingRes = await fetch('https://api.zyte.com/v1/extract', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`,
          httpResponseBody: true,
          geolocation: effectiveCountry,
        }),
      });

      if (bingRes.ok) {
        const data = await bingRes.json();
        if (data.httpResponseBody) {
          const html = Buffer.from(data.httpResponseBody, 'base64').toString('utf8');
          const $ = cheerio.load(html);
          let bCount = 0;
          $('li.b_algo').each((idx, el) => {
            const a = $(el).find('h2 a');
            let href = a.attr('href') || '';
            const title = a.text().trim();
            const snippet = $(el).find('.b_caption p, .b_algoSlug, .b_lineclamp2').first().text().trim();

            if (href.includes('&u=')) {
              const m = href.match(/[?&]u=a1([a-zA-Z0-9_\-=]+)/);
              if (m) {
                try {
                  href = Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
                } catch {}
              }
            }

            if (href && href.startsWith('http') && title) {
              const domain = extractDomainFromUrlOrDisplayed(href);
              results.push({
                rank: results.length + 1,
                title,
                snippet,
                url: href,
                displayedUrl: domain,
                domain,
              });
              bCount++;
            }
          });
          console.log(`[Zyte SERP] ✅ Bing via Zyte extracted ${bCount} organic items`);
        }
      }
    } catch (err: any) {
      console.warn(`[Zyte SERP] ⚠️ Bing fallback warning:`, err.message);
    }
  }

  // 3. Fallback: DuckDuckGo via Zyte Extract Proxy
  if (results.length < 5) {
    try {
      console.log(`[Zyte SERP] ⚡ Falling back to DuckDuckGo SERP via Zyte proxy for: "${query}" (geo: ${effectiveCountry})`);
      const ddgRes = await fetch('https://api.zyte.com/v1/extract', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
          httpResponseBody: true,
          geolocation: effectiveCountry,
        }),
      });

      if (ddgRes.ok) {
        const data = await ddgRes.json();
        if (data.httpResponseBody) {
          const html = Buffer.from(data.httpResponseBody, 'base64').toString('utf8');
          const $ = cheerio.load(html);
          let dCount = 0;
          $('div.result:not(.result--ad)').each((idx, el) => {
            const a = $(el).find('a.result__url, a.result__snippet, h2.result__title a');
            let href = a.attr('href') || '';
            const title = $(el).find('h2.result__title').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();

            if (href.includes('uddg=')) {
              const m = href.match(/[?&]uddg=([^&]+)/);
              if (m) href = decodeURIComponent(m[1]);
            }

            if (href && href.startsWith('http') && title) {
              const domain = extractDomainFromUrlOrDisplayed(href);
              results.push({
                rank: results.length + 1,
                title,
                snippet,
                url: href,
                displayedUrl: domain,
                domain,
              });
              dCount++;
            }
          });
          console.log(`[Zyte SERP] ✅ DuckDuckGo via Zyte extracted ${dCount} organic items`);
        }
      }
    } catch (err: any) {
      console.warn(`[Zyte SERP] ⚠️ DuckDuckGo fallback warning:`, err.message);
    }
  }

  return results;
}

/**
 * Tests connection to Zyte API using the configured or provided key.
 */
export async function testZyteConnection(testKey?: string): Promise<{
  connected: boolean;
  statusCode?: number;
  error?: string;
  latencyMs?: number;
}> {
  const apiKey = testKey || getZyteApiKey();
  if (!apiKey) {
    return {
      connected: false,
      error: 'Missing ZYTE_API_KEY environment variable.',
    };
  }

  const endpoint = 'https://api.zyte.com/v1/extract';
  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://httpbin.org/get',
        httpResponseBody: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return {
        connected: true,
        statusCode: res.status,
        latencyMs,
      };
    }

    const errorData = await res.json().catch(() => ({}));
    return {
      connected: false,
      statusCode: res.status,
      error: errorData.detail || errorData.title || `Zyte HTTP ${res.status}`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Connection timeout or network failure.',
      latencyMs: Date.now() - start,
    };
  }
}
