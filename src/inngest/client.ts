import { Inngest } from 'inngest';

export function getInngestEventKey(): string | undefined {
  const raw = process.env.INNGEST_EVENT_KEY || process.env.INNGEST_EVENT_KEY_FALLBACK;
  return raw ? raw.trim().replace(/^["']|["']$/g, '') : undefined;
}

export function getInngestSigningKey(): string | undefined {
  const raw = process.env.INNGEST_SIGNING_KEY || process.env.INNGEST_SIGNING_KEY_FALLBACK;
  return raw ? raw.trim().replace(/^["']|["']$/g, '') : undefined;
}

export function isInngestConfigured(): boolean {
  return Boolean(getInngestEventKey() || getInngestSigningKey());
}

export const inngest = new Inngest({
  id: 'pricexa',
  name: 'PriceXa Dynamic Pricing & Intelligence',
  eventKey: getInngestEventKey(),
  signingKey: getInngestSigningKey(),
});

export async function testInngestConnection(): Promise<{
  connected: boolean;
  hasEventKey: boolean;
  hasSigningKey: boolean;
  eventId?: string;
  error?: string;
}> {
  const hasEventKey = Boolean(getInngestEventKey());
  const hasSigningKey = Boolean(getInngestSigningKey());

  if (!hasEventKey && !hasSigningKey) {
    return {
      connected: false,
      hasEventKey: false,
      hasSigningKey: false,
      error: 'Missing INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY environment variables.',
    };
  }

  try {
    const res = await inngest.send({
      name: 'pricexa/system.ping',
      data: {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'production',
      },
    });

    return {
      connected: true,
      hasEventKey,
      hasSigningKey,
      eventId: res.ids?.[0],
    };
  } catch (err: any) {
    return {
      connected: false,
      hasEventKey,
      hasSigningKey,
      error: err.message || 'Error communicating with Inngest Cloud.',
    };
  }
}

