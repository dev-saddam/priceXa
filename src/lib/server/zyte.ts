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

export interface ZyteExtractOptions {
  url: string;
  browserHtml?: boolean;
  httpResponseBody?: boolean;
  product?: boolean;
  geolocation?: string;
  timeoutMs?: number;
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
    `[Zyte API] 🚀 POST /v1/extract | URL: ${options.url.slice(0, 80)} | product: ${!!options.product} | browserHtml: ${!!options.browserHtml} | geo: ${options.geolocation || 'auto'}`
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
      `[Zyte API] ✅ Success HTTP ${data.statusCode || res.status} | product: ${data.product ? `"${data.product.name?.slice(0, 30)}" ($${data.product.price})` : 'none'} | HTML: ${data.browserHtml ? `${data.browserHtml.length} bytes` : (decodedBody ? `${decodedBody.length} bytes` : '0')}`
    );

    return {
      url: data.url || options.url,
      statusCode: data.statusCode || res.status,
      browserHtml: data.browserHtml || decodedBody,
      httpResponseBody: decodedBody,
      product: data.product,
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
