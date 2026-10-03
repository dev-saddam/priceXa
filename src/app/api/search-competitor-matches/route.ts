import { NextResponse } from 'next/server';
import { getProductById, getCompetitors, getTenants } from '@/lib/server/db';
import { discoverAndGroupCompetitorCandidates } from '@/lib/server/crawler';
import { CompetitorCandidateGroup } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, tenantId } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const effectiveTenantId = tenantId || product.tenantId;
    const tenant = (await getTenants()).find((t) => t.id === effectiveTenantId);
    const country = tenant?.country || 'US';
    const currency = tenant?.currency || 'USD';
    const competitors = (await getCompetitors(effectiveTenantId)).filter((c) => c.status === 'active');

    // Run multi-page internet search (at least 2 pages) and discover suggested competitor listings
    const groups = await discoverAndGroupCompetitorCandidates(product, competitors, country, currency);

    return NextResponse.json({
      success: true,
      productId,
      productName: product.name,
      productCode: product.code,
      groups,
      totalPagesSearched: 2,
    });
  } catch (error: any) {
    console.error('Error searching competitor matches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during search' },
      { status: 500 }
    );
  }
}
