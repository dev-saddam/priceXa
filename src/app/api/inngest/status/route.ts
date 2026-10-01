import { NextResponse } from 'next/server';
import {
  isInngestConfigured,
  getInngestEventKey,
  getInngestSigningKey,
  testInngestConnection,
} from '@/inngest/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isConfigured = isInngestConfigured();
    const eventKey = getInngestEventKey();
    const signingKey = getInngestSigningKey();

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          configured: false,
          message: 'Inngest environment variables are missing on this deployment.',
          troubleshooting: {
            requiredVars: ['INNGEST_EVENT_KEY', 'INNGEST_SIGNING_KEY'],
            instructions:
              'In your Vercel Project Settings > Environment Variables, add INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY, then trigger a redeploy.',
          },
        },
        { status: 200 }
      );
    }

    const testResult = await testInngestConnection();

    return NextResponse.json({
      success: testResult.connected,
      connected: testResult.connected,
      configured: true,
      hasEventKey: Boolean(eventKey),
      hasSigningKey: Boolean(signingKey),
      eventKeyPrefix: eventKey ? eventKey.substring(0, 8) + '...' : undefined,
      testEventId: testResult.eventId,
      error: testResult.error,
      functionsRegistered: [
        'search-candidates',
        'batch-auto-match',
        'daily-scan-cron',
        'instant-scan',
      ],
      webhookUrl: '/api/inngest',
      message: testResult.connected
        ? 'Successfully sent test ping event to Inngest Cloud.'
        : `Could not send event to Inngest Cloud: ${testResult.error}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message,
        message: 'Unexpected error testing Inngest connection.',
      },
      { status: 500 }
    );
  }
}
