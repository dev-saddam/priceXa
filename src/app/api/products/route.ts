import { NextResponse } from 'next/server';
import { getProducts, addProduct, clearAllProducts } from '@/lib/server/db';
import { enqueueJob } from '@/lib/server/queue';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const products = await getProducts(tenantId);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.code || !body.mrp) {
      return NextResponse.json({ success: false, error: 'Name, SKU code and MRP are required' }, { status: 400 });
    }

    const created = await addProduct(body);

    // Automatically start competitor search in background
    try {
      await enqueueJob(
        created.tenantId,
        'batch_auto_match',
        `Background Competitor Search for ${created.name}`,
        { tenantId: created.tenantId, productIds: [created.id] }
      );
    } catch (err) {
      console.warn('Background search enqueue failed, continuing:', err);
    }

    return NextResponse.json({ success: true, product: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const result = await clearAllProducts(tenantId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
