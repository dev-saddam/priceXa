import { NextResponse } from 'next/server';
import {
  isZyteConfigured,
  getZyteApiKey,
  maskZyteApiKey,
  testZyteConnection,
} from '@/lib/server/zyte';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configured = isZyteConfigured();
    const apiKey = getZyteApiKey();
    const keyMasked = maskZyteApiKey(apiKey);

    if (!configured) {
      return NextResponse.json({
        success: true,
        configured: false,
        connected: false,
        keyMasked: '',
        message: 'Zyte API key is not configured in environment variables (ZYTE_API_KEY).',
      });
    }

    const testResult = await testZyteConnection();

    return NextResponse.json({
      success: true,
      configured: true,
      connected: testResult.connected,
      keyMasked,
      latencyMs: testResult.latencyMs,
      statusCode: testResult.statusCode,
      error: testResult.error,
      message: testResult.connected
        ? 'Zyte API is connected and active for residential proxy scraping and automated product extraction.'
        : `Zyte API connection check failed: ${testResult.error}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        connected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const testKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : undefined;

    const testResult = await testZyteConnection(testKey);

    return NextResponse.json({
      success: true,
      tested: true,
      connected: testResult.connected,
      latencyMs: testResult.latencyMs,
      statusCode: testResult.statusCode,
      error: testResult.error,
      message: testResult.connected
        ? 'Zyte API Key verified successfully! Enterprise scraping and product extraction is ready.'
        : `Zyte API Key verification failed: ${testResult.error}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
