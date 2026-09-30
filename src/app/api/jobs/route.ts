import { NextResponse } from 'next/server';
import { getJobs, enqueueJob, getQueueMetrics } from '@/lib/server/queue';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const jobs = getJobs(tenantId);
    const metrics = getQueueMetrics();
    return NextResponse.json({ success: true, jobs, metrics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
