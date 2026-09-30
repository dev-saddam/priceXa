import { NextResponse } from 'next/server';
import { getQueueMetrics } from '@/lib/server/queue';

export async function GET() {
  try {
    const metrics = getQueueMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
