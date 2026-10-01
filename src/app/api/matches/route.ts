import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const productIdsParam = searchParams.get('productIds') || undefined;
    const productIds = productIdsParam ? productIdsParam.split(',').map((id) => id.trim()).filter(Boolean) : undefined;

    const matches = await getMatches(tenantId, productId, productIds);
    return NextResponse.json({ success: true, matches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
