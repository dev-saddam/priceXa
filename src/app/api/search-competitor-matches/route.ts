import { NextResponse } from 'next/server';
import { getProductById, getCompetitors } from '@/lib/server/db';
import { searchCompetitorProductCandidates } from '@/lib/server/crawler';
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
    const competitors = (await getCompetitors(effectiveTenantId)).filter((c) => c.status === 'active');

    // Run searches for each competitor concurrently (using Google/DuckDuckGo + crawler)
    const groups = await Promise.all(
      competitors.map((comp) => searchCompetitorProductCandidates(product, comp))
    );

    return NextResponse.json({
      success: true,
      productId,
      productName: product.name,
      productCode: product.code,
      groups,
    });
  } catch (error: any) {
    console.error('Error searching competitor matches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during search' },
      { status: 500 }
    );
  }
}
