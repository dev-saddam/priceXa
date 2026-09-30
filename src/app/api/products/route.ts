import { NextResponse } from 'next/server';
import { getProducts, addProduct } from '@/lib/server/db';

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
    return NextResponse.json({ success: true, product: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
