import { NextResponse } from 'next/server';
import { enqueueJob } from '@/lib/server/queue';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant-apex', type, title, payload = {} } = body;

    if (!type || !title) {
      return NextResponse.json({ success: false, error: 'Job type and title are required' }, { status: 400 });
    }

    const job = await enqueueJob(tenantId, type, title, payload);
    return NextResponse.json({
      success: true,
      message: 'Job enqueued in background worker pool',
      jobId: job.id,
      job,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
