import { NextResponse } from 'next/server';
import { getScanJobs } from '@/lib/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const scans = await getScanJobs(tenantId);
    return NextResponse.json({ success: true, scans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
