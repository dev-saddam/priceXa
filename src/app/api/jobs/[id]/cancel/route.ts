import { NextResponse } from 'next/server';
import { cancelJob } from '@/lib/server/queue';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = cancelJob(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Job could not be cancelled or not found' }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: `Job ${id} cancelled successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
