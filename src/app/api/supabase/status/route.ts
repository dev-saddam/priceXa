import { NextResponse } from 'next/server';
import { testSupabaseConnection, isSupabaseConfigured, getSupabaseUrl } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isConfigured = isSupabaseConfigured();
    const url = getSupabaseUrl();
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          configured: false,
          message: 'Supabase environment variables are missing on this deployment.',
          troubleshooting: {
            requiredVars: [
              'NEXT_PUBLIC_SUPABASE_URL',
              'SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
            ],
            instructions:
              'In your Vercel Project Settings > Environment Variables, add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for Production and Preview), then trigger a redeploy.',
          },
        },
        { status: 200 }
      );
    }

    const testResult = await testSupabaseConnection();

    return NextResponse.json({
      success: testResult.connected,
      connected: testResult.connected,
      configured: true,
      url: url ? url.replace(/^(https?:\/\/[^.]+).*/, '$1.supabase.co') : undefined,
      hasServiceKey,
      hasAnonKey,
      counts: testResult.counts,
      error: testResult.error,
      message: testResult.connected
        ? 'Successfully connected to Supabase PostgreSQL database.'
        : `Failed connecting to Supabase: ${testResult.error}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message,
        message: 'Unexpected error testing Supabase connection.',
      },
      { status: 500 }
    );
  }
}
