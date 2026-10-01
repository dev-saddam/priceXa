import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'pricexa',
  name: 'PriceXa Dynamic Pricing & Intelligence',
});

export function isInngestConfigured(): boolean {
  return Boolean(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY);
}
