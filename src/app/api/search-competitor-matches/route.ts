import { NextResponse } from 'next/server';
import { getProductById, getCompetitors, getTenants } from '@/lib/server/db';
import { discoverAndGroupCompetitorCandidates } from '@/lib/server/crawler';
import { CompetitorCandidateGroup } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      productId,
      tenantId,
      product: clientProduct,
      country: clientCountry,
      currency: clientCurrency,
    } = body;

    let product = clientProduct;
    if (!product && productId) {
      product = await getProductById(productId);
    }

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product or Product ID is required' }, { status: 400 });
    }

    const effectiveTenantId = tenantId || product.tenantId;
    const tenants = await getTenants();
    const tenant = tenants.find((t) => t.id === effectiveTenantId);
    const country = clientCountry || tenant?.country || tenant?.countryCode || 'IN';
    const currency = clientCurrency || tenant?.currency || 'INR';
    const competitors = (await getCompetitors(effectiveTenantId)).filter((c) => c.status === 'active');

    // Run multi-page internet search (at least 2 pages) and discover suggested competitor listings
    const groups = await discoverAndGroupCompetitorCandidates(product, competitors, country, currency);

    return NextResponse.json({
      success: true,
      productId: product.id || productId,
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
