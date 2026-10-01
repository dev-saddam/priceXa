import { serve } from 'inngest/next';
import { inngest, getInngestSigningKey } from '@/inngest/client';
import {
  searchCandidatesFunction,
  batchAutoMatchFunction,
  dailyScanFunction,
  instantScanFunction,
} from '@/inngest/functions';

const signingKey = getInngestSigningKey();

if (!signingKey && process.env.NODE_ENV !== 'production') {
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

