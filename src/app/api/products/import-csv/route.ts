import { NextResponse } from 'next/server';
import { bulkImportProducts, recalculateMarketPositions } from '@/lib/server/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant-apex', rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No CSV rows provided' }, { status: 400 });
    }

    const imported = await bulkImportProducts(tenantId, rows);
    await recalculateMarketPositions(tenantId);

    return NextResponse.json({
      success: true,
      count: imported.length,
      importedProducts: imported,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
