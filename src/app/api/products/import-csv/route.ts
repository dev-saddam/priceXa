import { NextResponse } from 'next/server';
import { bulkImportProducts, recalculateMarketPositions } from '@/lib/server/db';
import { enqueueJob } from '@/lib/server/queue';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant-apex', rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No CSV rows provided' }, { status: 400 });
    }

    const imported = await bulkImportProducts(tenantId, rows);
    await recalculateMarketPositions(tenantId);

    // Automatically start competitor search in background for imported SKUs
    try {
      await enqueueJob(
        tenantId,
        'batch_auto_match',
        `Auto-matching ${imported.length} imported SKUs across competitors`,
        { tenantId, productIds: imported.map((p) => p.id) }
      );
    } catch (err) {
      console.warn('Background search enqueue failed for CSV, continuing:', err);
    }

    return NextResponse.json({
      success: true,
      count: imported.length,
      importedProducts: imported,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
