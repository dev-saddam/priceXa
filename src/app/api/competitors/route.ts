import { NextResponse } from 'next/server';
import { getCompetitors, addCompetitor } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const competitors = await getCompetitors(tenantId);
    return NextResponse.json({ success: true, competitors });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.domain || !body.baseUrl) {
      return NextResponse.json({ success: false, error: 'Name, domain and baseUrl are required' }, { status: 400 });
    }

    const created = await addCompetitor(body);
    return NextResponse.json({ success: true, competitor: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
