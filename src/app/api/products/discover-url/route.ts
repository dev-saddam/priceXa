import { NextResponse } from 'next/server';
import { discoverProductUrlFromInternet } from '@/lib/server/crawler';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, brand, code, country = 'US' } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 });
    }

    const discovered = await discoverProductUrlFromInternet(name, brand, code, country);

    if (!discovered || !discovered.productUrl) {
      return NextResponse.json({
        success: false,
        message: 'No official or direct product URL found on the internet for this item.',
      });
    }

    return NextResponse.json({
      success: true,
      discovered,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
