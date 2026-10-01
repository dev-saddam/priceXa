import { NextResponse } from 'next/server';
import { getProducts, addProduct, clearAllProducts, getTenants } from '@/lib/server/db';
import { enqueueJob } from '@/lib/server/queue';
import { discoverProductUrlFromInternet } from '@/lib/server/crawler';

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

    // If productUrl is missing or empty, search the public internet to discover it
    if (!body.productUrl || body.productUrl.trim() === '') {
      try {
        const tenants = await getTenants();
        const tenant = tenants.find((t) => t.id === body.tenantId);
        const country = tenant?.country || tenant?.countryCode || 'US';
        const discovered = await discoverProductUrlFromInternet(body.name, body.brand, body.code, country);
        if (discovered?.productUrl) {
          body.productUrl = discovered.productUrl;
          if (discovered.imageUrl && (!body.imageUrl || body.imageUrl.includes('unsplash'))) {
            body.imageUrl = discovered.imageUrl;
          }
        }
      } catch (err) {
        console.warn('[Products API] Failed discovering product URL from internet on upload:', err);
      }
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
