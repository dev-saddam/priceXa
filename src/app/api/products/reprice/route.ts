import { NextResponse } from 'next/server';
import { updateProduct } from '@/lib/server/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, newPrice } = body;

    if (!productId || typeof newPrice !== 'number') {
      return NextResponse.json({ success: false, error: 'Product ID and newPrice are required' }, { status: 400 });
    }

    const updated = await updateProduct(productId, { currentPrice: Number(newPrice.toFixed(2)) });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
