import { NextResponse } from 'next/server';
import { getProductById, saveProductMatches, ensureCompetitorExists } from '@/lib/server/db';
import { CompetitorCandidateGroup, CompetitorProductMatch } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, tenantId, groups } = body as {
      productId: string;
      tenantId: string;
      groups: CompetitorCandidateGroup[];
    };

    if (!productId || !groups) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const effectiveTenantId = tenantId || product.tenantId;

    // Convert candidate group selections into confirmed CompetitorProductMatch records
    const newMatches: CompetitorProductMatch[] = [];

    for (const group of groups) {
      if (!group.selectedCandidateId) continue;

      let title = '';
      let url = '';
      let price = product.currentPrice;
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      let confidence = 85;

      const candidate = group.selectedCandidateId !== 'custom' 
        ? group.candidates.find((c) => c.id === group.selectedCandidateId)
        : null;

      if (group.selectedCandidateId === 'custom') {
        if (!group.customUrl) continue;
        url = group.customUrl;
        title = `${product.name} (Custom Monitored URL)`;
        price = product.currentPrice;
        confidence = 100;
      } else {
        if (!candidate) continue;
        title = candidate.title;
        url = candidate.url;
        price = candidate.price;
        stockStatus = candidate.stockStatus;
        confidence = candidate.matchPercent;
      }

      // Ensure the competitor store exists in the company's competitor catalog
      const compRecord = await ensureCompetitorExists(effectiveTenantId, {
        name: group.competitorName,
        domain: group.competitorDomain,
        logo: group.competitorLogo,
        channelType: candidate?.channelType || group.channelType,
        platform: candidate?.platform || group.platform,
        baseUrl: `https://${group.competitorDomain}`,
      });
      const resolvedCompetitorId = compRecord.id;

      const priceDiff = Number((price - product.currentPrice).toFixed(2));
      const priceDiffPercent = Number(((priceDiff / product.currentPrice) * 100).toFixed(1));

      newMatches.push({
        id: `match-${Date.now()}-${resolvedCompetitorId}-${Math.random().toString(36).substring(2, 6)}`,
        tenantId: effectiveTenantId,
        productId,
        competitorId: resolvedCompetitorId,
        competitorName: compRecord.name || group.competitorName,
        competitorProductTitle: title,
        competitorProductUrl: url,
        matchConfidence: confidence,
        matchType: group.selectedCandidateId === 'custom' ? 'manual_override' : 'title_search',
        currentPrice: price,
        previousPrice: price,
        regularPrice: candidate?.regularPrice,
        priceDiff,
        priceDiffPercent,
        stockStatus,
        currency: 'USD',
        lastScrapedAt: 'Just now',
        priceHistory: [
          {
            timestamp: new Date().toISOString(),
            price,
            stockStatus,
          },
        ],
        status: 'confirmed',
        channelType: candidate?.channelType || group.channelType,
        platform: candidate?.platform || group.platform,
        sellerName: candidate?.sellerName,
      });
    }

    const savedMatches = await saveProductMatches(effectiveTenantId, productId, newMatches);

    return NextResponse.json({
      success: true,
      productId,
      matches: savedMatches,
      count: savedMatches.length,
    });
  } catch (error: any) {
    console.error('Error saving candidate matches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error saving matches' },
      { status: 500 }
    );
  }
}
