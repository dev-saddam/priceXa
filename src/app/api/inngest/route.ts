import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import {
  searchCandidatesFunction,
  batchAutoMatchFunction,
  dailyScanFunction,
  instantScanFunction,
} from '@/inngest/functions';

// Enable Inngest local development mode if running locally without production signing key
if (!process.env.INNGEST_SIGNING_KEY && process.env.NODE_ENV !== 'production') {
  process.env.INNGEST_DEV = '1';
}

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    searchCandidatesFunction,
    batchAutoMatchFunction,
    dailyScanFunction,
    instantScanFunction,
  ],
});
