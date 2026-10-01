import { NextResponse } from 'next/server';
import { executeScheduledCrawl } from '@/lib/server/cronEngine';

/**
 * Twice-a-Day Crawl Engine Cron Webhook
 *
 * Invoked automatically by:
 * - Vercel Cron (schedule: 0 8,20 * * *)
 * - External Cron schedulers (cron-job.org, EasyCron, GitHub Actions)
 * - Inngest scheduled cron tasks
 * - Manual trigger via POST / GET ?force=true
 */
export async function GET(req: Request) {
  return handleCronRequest(req);
}

export async function POST(req: Request) {
  return handleCronRequest(req);
}

async function handleCronRequest(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const secretQuery = searchParams.get('secret');

    // Secure the cron endpoint if CRON_SECRET is defined in environment variables
    if (cronSecret && process.env.NODE_ENV === 'production') {
      const isBearerValid = authHeader === `Bearer ${cronSecret}`;
      const isQueryValid = secretQuery === cronSecret;

      if (!isBearerValid && !isQueryValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Missing or invalid CRON_SECRET authorization token',
          },
          { status: 401 }
        );
      }
    }

    const slotParam = (searchParams.get('slot') || 'auto') as 'am' | 'pm' | 'auto';
    const tenantIdParam = searchParams.get('tenantId') || undefined;

    const result = await executeScheduledCrawl({
      slot: slotParam,
      tenantId: tenantIdParam,
      triggerSource: authHeader ? 'cron-auth' : 'http-trigger',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cron API] Twice-a-Day crawl execution failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred during scheduled crawl',
      },
      { status: 500 }
    );
  }
}
