'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  PackageSearch,
  Crosshair,
  Timer,
  BellRing,
  Settings,
  ShieldCheck,
  Building,
  CreditCard,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSuperAdmin,
    currentTenant,
    products,
    competitors,
    plans,
    notifications,
    currentUser,
    setIsUpgradeModalOpen,
  } = useApp();

  const tenantProducts = products.filter((p) => p.tenantId === currentTenant.id);
  const tenantCompetitors = competitors.filter((c) => c.tenantId === currentTenant.id);
  const currentPlan = plans.find((p) => p.id === currentTenant.planId) || plans[1];
  const unreadAlerts = notifications.filter(
    (n) => n.tenantId === currentTenant.id && !n.read
  ).length;

  const skuPercent = Math.min(100, Math.round((tenantProducts.length / currentTenant.skuLimit) * 100));
  const compPercent = Math.min(
    100,
    Math.round((tenantCompetitors.length / currentTenant.competitorLimit) * 100)
  );

  const brandNavItems = [
    {
      id: 'dashboard',
      label: 'Price Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'products',
      label: 'Products & CSV',
      icon: PackageSearch,
      badge: tenantProducts.length,
    },
    {
      id: 'competitors',
      label: 'Competitors & Matches',
      icon: Crosshair,
      badge: tenantCompetitors.length,
    },
    {
      id: 'scans',
      label: '2x/Day Crawl Engine',
      icon: Timer,
      badge: 'Active',
      badgeColor: 'badge-clean-emerald',
    },
    {
      id: 'alerts',
      label: 'Smart Alert Rules',
      icon: BellRing,
      badge: unreadAlerts > 0 ? unreadAlerts : null,
      badgeColor: 'badge-clean-rose',
    },
    {
      id: 'settings',
      label: 'Settings & Webhooks',
      icon: Settings,
      badge: null,
    },
  ];

  const adminNavItems = [
    {
      id: 'superadmin',
      label: 'Platform Overview',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'admin_tenants',
      label: 'Brand Tenancies',
      icon: Building,
      badge: '3 Active',
    },
    {
      id: 'admin_subscriptions',
      label: 'Subscription Plans',
      icon: CreditCard,
      badge: '3 Tiers',
    },
    {
      id: 'admin_crawler',
      label: 'Proxy Cluster Health',
      icon: Layers,
      badge: '99.4%',
      badgeColor: 'badge-clean-emerald',
    },
  ];

  const isSuperAdminView = currentUser?.role === 'super_admin' && isSuperAdmin;
  const activeItems = isSuperAdminView ? adminNavItems : brandNavItems;

  return (
    <aside className="w-64 border-r border-white/[0.06] bg-[#080d19]/60 backdrop-blur-xl flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Top Navigation */}
      <div className="p-4 space-y-5">
        {/* Workspace Brand Badge */}
        {!isSuperAdmin ? (
          <div className="p-3 rounded-2xl glass-card border border-white/[0.07]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-white/[0.08] flex items-center justify-center text-xl shadow-inner">
                {currentTenant.logo}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                  {currentTenant.name}
                </h3>
                <span className="text-[11px] text-slate-400 block truncate">
                  {currentTenant.industry}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 block">SUPER ADMIN</span>
                <span className="text-[10px] text-slate-400">Multi-Tenant Platform</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isSuperAdmin ? 'Admin Platform' : 'Navigation'}
          </div>

          {activeItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Quota card for brands */}
      <div className="p-4 border-t border-white/[0.05] bg-[#080d19]/80">
        {!isSuperAdmin ? (
          <div className="p-3.5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                {currentPlan.name}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {currentTenant.planStatus}
              </span>
            </div>

            {/* SKU Limit Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>SKU Usage</span>
                <span className="text-slate-200 font-medium">
                  {tenantProducts.length} / {currentTenant.skuLimit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, skuPercent)}%` }}
                />
              </div>
            </div>

            {/* Competitor Domains Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Competitors</span>
                <span className="text-slate-200 font-medium">
                  {tenantCompetitors.length} / {currentTenant.competitorLimit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, compPercent)}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Timer className="w-3 h-3 text-slate-400" />
                {currentPlan.scanFrequencyLabel}
              </span>
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="w-full mt-1.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Change / Buy Plan
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl glass-card space-y-2">
            <div className="flex items-center justify-between text-slate-200">
              <span className="font-bold text-xs">Global Engine</span>
              <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                ALL SYSTEMS HEALTHY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dual-slot automated crawling active for all tenants.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
