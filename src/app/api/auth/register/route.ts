import { NextResponse } from 'next/server';
import { getTenants, addTenant } from '@/lib/server/db';
import { Tenant, PlanTier, AuthUser } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      email,
      industry = 'E-Commerce Retail',
      currency = 'USD',
      planId = 'starter',
    } = body;

    if (!companyName || !email) {
      return NextResponse.json(
        { success: false, error: 'Company Name and Contact Email are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingTenants = await getTenants();

    const exists = existingTenants.some(
      (t) => t.contactEmail.toLowerCase() === cleanEmail
    );
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `company-${Date.now()}`;

    const id = `tenant-${slug}-${Math.random().toString(36).substring(2, 6)}`;

    const currencySymbol =
      currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

    const chosenPlan: PlanTier = (['starter', 'growth', 'enterprise'].includes(planId)
      ? planId
      : 'starter') as PlanTier;

    const skuLimit = chosenPlan === 'enterprise' ? 10000 : chosenPlan === 'growth' ? 1500 : 250;
    const competitorLimit = chosenPlan === 'enterprise' ? 50 : chosenPlan === 'growth' ? 15 : 5;

    const newTenant: Tenant = {
      id,
      name: companyName.trim(),
      slug,
      logo: '🏢',
      industry,
      currency,
      currencySymbol,
      planId: chosenPlan,
      planStatus: 'trial', // Initial 14-day free trial on registration
      scanFrequency: chosenPlan === 'enterprise' ? 'hourly' : '2x_daily',
      scanTimes: ['08:00 AM', '08:00 PM'],
      lastScanAt: 'Never',
      nextScanAt: 'Today at 08:00 PM',
      skuLimit,
      competitorLimit,
      createdAt: new Date().toISOString().split('T')[0],
      contactEmail: cleanEmail,
      webhookUrl: '',
      emailAlertsEnabled: true,
      autoRepriceRecommendation: true,
    };

    const createdTenant = await addTenant(newTenant);

    const user: AuthUser = {
      id: `usr-${createdTenant.id}`,
      email: cleanEmail,
      name: `${createdTenant.name} Admin`,
      role: 'company_owner',
      tenantId: createdTenant.id,
      companyName: createdTenant.name,
    };

    return NextResponse.json({ success: true, user, tenant: createdTenant });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
