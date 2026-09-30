import { NextResponse } from 'next/server';
import { getTenants, addTenant, updateTenant } from '@/lib/server/db';
import { Tenant, PlanTier } from '@/types';

export async function GET() {
  try {
    const tenants = await getTenants();
    return NextResponse.json({ success: true, tenants });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, industry, contactEmail, planId = 'growth', currency = 'USD' } = body;

    if (!name || !contactEmail) {
      return NextResponse.json({ success: false, error: 'Name and contact email are required' }, { status: 400 });
    }

    const id = `tenant-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newTenant: Tenant = {
      id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      logo: '✨',
      industry: industry || 'Retail',
      currency,
      currencySymbol: currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$',
      planId: planId as PlanTier,
      planStatus: 'active',
      scanFrequency: '2x_daily',
      scanTimes: ['08:00 AM', '08:00 PM'],
      lastScanAt: 'Never',
      nextScanAt: 'Today at 08:00 PM',
      skuLimit: planId === 'enterprise' ? 10000 : planId === 'growth' ? 1500 : 250,
      competitorLimit: planId === 'enterprise' ? 50 : planId === 'growth' ? 15 : 5,
      createdAt: new Date().toISOString().split('T')[0],
      contactEmail,
      emailAlertsEnabled: true,
      autoRepriceRecommendation: true,
    };

    const created = await addTenant(newTenant);
    return NextResponse.json({ success: true, tenant: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, planId, planStatus } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    const updates: Partial<Tenant> = {};
    if (planStatus) updates.planStatus = planStatus;
    if (planId) {
      updates.planId = planId;
      updates.skuLimit = planId === 'enterprise' ? 10000 : planId === 'growth' ? 1500 : 250;
      updates.competitorLimit = planId === 'enterprise' ? 50 : planId === 'growth' ? 15 : 5;
      updates.scanFrequency = planId === 'enterprise' ? 'hourly' : '2x_daily';
    }

    const updated = await updateTenant(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, tenant: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
