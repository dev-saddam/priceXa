import { NextResponse } from 'next/server';
import { deleteCompetitor, getDb, saveDb, recalculateMarketPositions } from '@/lib/server/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCompetitor(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Competitor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = await getDb();
    const comp = db.competitors.find((c) => c.id === id);
    if (!comp) {
      return NextResponse.json({ success: false, error: 'Competitor not found' }, { status: 404 });
    }

    Object.assign(comp, body);
    await saveDb(db);
    await recalculateMarketPositions(comp.tenantId);

    return NextResponse.json({ success: true, competitor: comp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
