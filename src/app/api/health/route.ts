import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { isSupabaseConfigured, testSupabaseConnection } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const supabaseTest = isSupabaseConfigured() ? await testSupabaseConnection() : null;

    return NextResponse.json({
      status: 'healthy',
      engine: 'PriceXa Backend Intelligence Engine v2.4',
      storage: supabaseTest?.connected ? 'supabase-cloud-postgres' : 'resilient-in-memory-db',
      supabase: {
        configured: isSupabaseConfigured(),
        connected: supabaseTest?.connected || false,
        error: supabaseTest?.error,
        counts: supabaseTest?.counts,
      },
      stats: {
        tenants: db.tenants.length,
        products: db.products.length,
        competitors: db.competitors.length,
        matches: db.matches.length,
        notifications: db.notifications.length,
      },
      crawler: {
        googleSearch: 'active',
        duckDuckGoFallback: 'active',
        cheerioScraper: 'active',
        cronScheduler: 'active-2x-daily',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 500 });
  }
}
