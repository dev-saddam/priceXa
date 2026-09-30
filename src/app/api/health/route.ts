import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json({
      status: 'healthy',
      engine: 'PriceXa Backend Intelligence Engine v2.4',
      storage: 'persistent-json-db',
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
