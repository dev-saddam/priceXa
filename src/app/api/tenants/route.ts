import { NextResponse } from 'next/server';
import { getTenants, addTenant, updateTenant, getCompetitors, saveDb, getDb } from '@/lib/server/db';
import { Tenant, PlanTier } from '@/types';
import { getCountryConfig, getCurrencySymbol, adaptDomainForCountry } from '@/lib/countryConfig';

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
    const {
      name,
      industry,
      contactEmail,
      planId = 'growth',
      country = 'US',
      currency,
    } = body;

    if (!name || !contactEmail) {
      return NextResponse.json({ success: false, error: 'Name and contact email are required' }, { status: 400 });
    }

    const countryConfig = getCountryConfig(country);
    const resolvedCurrency = currency || countryConfig.defaultCurrency;
    const currencySymbol = getCurrencySymbol(resolvedCurrency);

    const id = `tenant-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newTenant: Tenant = {
      id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      logo: '✨',
      industry: industry || 'Retail',
      country: countryConfig.code,
      countryCode: countryConfig.code,
      currency: resolvedCurrency,
      currencySymbol,
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
    const {
      id,
      planId,
      planStatus,
      country,
      currency,
      currencySymbol,
      contactEmail,
      webhookUrl,
      emailAlertsEnabled,
      name,
      industry,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    const updates: Partial<Tenant> = {};
    if (planStatus) updates.planStatus = planStatus;
    if (name) updates.name = name;
    if (industry) updates.industry = industry;
    if (contactEmail) updates.contactEmail = contactEmail;
    if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;
    if (emailAlertsEnabled !== undefined) updates.emailAlertsEnabled = emailAlertsEnabled;

    if (country) {
      const countryConfig = getCountryConfig(country);
      updates.country = countryConfig.code;
      updates.countryCode = countryConfig.code;

      // Update tenant competitors to match target country (e.g. amazon.com -> amazon.co.uk)
      const db = await getDb();
      const tenantCompetitors = db.competitors.filter((c) => c.tenantId === id);
      for (const comp of tenantCompetitors) {
        const newDomain = adaptDomainForCountry(comp.domain, countryConfig.code);
        if (newDomain !== comp.domain) {
          comp.domain = newDomain;
          comp.baseUrl = `https://${newDomain}`;
          if (comp.platform === 'amazon' || comp.name.includes('Amazon')) {
            comp.name = `Amazon Marketplace (${countryConfig.code})`;
          } else if (comp.platform === 'ebay' || comp.name.includes('eBay')) {
            comp.name = `eBay (${countryConfig.code})`;
          }
        }
      }
      await saveDb(db);
    }

    if (currency) {
      updates.currency = currency;
      updates.currencySymbol = currencySymbol || getCurrencySymbol(currency);
    } else if (country && !currency) {
      const countryConfig = getCountryConfig(country);
      updates.currency = countryConfig.defaultCurrency;
      updates.currencySymbol = countryConfig.currencySymbol;
    }

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
