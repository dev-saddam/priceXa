import { NextResponse } from 'next/server';
import { getTenants } from '@/lib/server/db';
import { AuthUser } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Super Admin Authentication
    if (cleanEmail === 'admin@pricexa.com' || cleanEmail === 'admin') {
      const adminUser: AuthUser = {
        id: 'usr-admin-master',
        email: 'admin@pricexa.com',
        name: 'Platform Administrator',
        role: 'super_admin',
        tenantId: 'all',
        companyName: 'PriceXa Platform',
      };
      return NextResponse.json({ success: true, user: adminUser });
    }

    // 2. Company / Brand Authentication
    const tenants = await getTenants();
    const tenant = tenants.find(
      (t) =>
        t.contactEmail.toLowerCase() === cleanEmail ||
        t.slug.toLowerCase() === cleanEmail ||
        t.id.toLowerCase() === cleanEmail
    );

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: 'No brand account found matching this email. Please sign up to register your company.',
        },
        { status: 401 }
      );
    }

    const companyUser: AuthUser = {
      id: `usr-${tenant.id}`,
      email: tenant.contactEmail,
      name: `${tenant.name} Ops`,
      role: 'company_owner',
      tenantId: tenant.id,
      companyName: tenant.name,
    };

    return NextResponse.json({ success: true, user: companyUser, tenant });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
