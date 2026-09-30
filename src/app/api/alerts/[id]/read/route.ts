import { NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/server/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await markNotificationRead(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
