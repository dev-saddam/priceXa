'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PlanTier, SubscriptionPlan } from '@/types';
import {
  ShieldCheck,
  Building,
  CreditCard,
  Layers,
  Edit2,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface SuperAdminViewProps {
  onOpenRegisterBrandModal: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onOpenRegisterBrandModal }) => {
  const {
    tenants,
    plans,
    products,
    setCurrentTenantId,
    setIsSuperAdmin,
    setActiveTab,
    updateTenantPlan,
    updateTenantPlanStatus,
    updatePlanDetails,
  } = useApp();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'tenants' | 'plans' | 'crawler'>('tenants');

  // Plan editing modal state
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editPriceMonthly, setEditPriceMonthly] = useState('');
  const [editMaxProducts, setEditMaxProducts] = useState('');
  const [editMaxCompetitors, setEditMaxCompetitors] = useState('');

  // Calculate platform financial stats
  const totalMrr = tenants.reduce((acc, t) => {
    const plan = plans.find((p) => p.id === t.planId);
    return acc + (plan?.priceMonthly || 0);
  }, 0);

  const totalArr = totalMrr * 12;
  const totalPlatformSkus = products.length;

  const handleSwitchToTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setIsSuperAdmin(false);
    setActiveTab('dashboard');
  };

  const handleSavePlanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    updatePlanDetails(editingPlan.id, {
      priceMonthly: parseFloat(editPriceMonthly) || editingPlan.priceMonthly,
      maxProducts: parseInt(editMaxProducts) || editingPlan.maxProducts,
      maxCompetitors: parseInt(editMaxCompetitors) || editingPlan.maxCompetitors,
    });

    setEditingPlan(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Super Admin Top Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/[0.08] via-slate-900/80 to-slate-900/60 border border-amber-500/25 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Administrator Console
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Brands & Subscription Management
            </h1>
            <p className="text-xs text-slate-300">
              Manage multi-tenant brand accounts, configure pricing tiers, and monitor crawler cluster load
            </p>
          </div>

          <button
            onClick={onOpenRegisterBrandModal}
            className="btn-primary-clean flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Onboard New Brand
          </button>
        </div>

        {/* Financial and Platform Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              MRR (Monthly Run Rate)
            </span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">
              ${totalMrr.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">+18.4% this month</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              ARR (Annualized)
            </span>
            <span className="text-xl font-black text-slate-100 mt-1 block">
              ${totalArr.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Projected run-rate</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Active Brand Tenants
            </span>
            <span className="text-xl font-black text-blue-400 mt-1 block">{tenants.length} Brands</span>
            <span className="text-[10px] text-slate-400">100% healthy</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Platform Catalog SKUs
            </span>
            <span className="text-xl font-black text-purple-400 mt-1 block">
              {totalPlatformSkus} Products
            </span>
            <span className="text-[10px] text-purple-300 font-semibold">2x / day active</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-white/[0.06] gap-4">
        <button
          onClick={() => setActiveAdminSubTab('tenants')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeAdminSubTab === 'tenants'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          Registered Brands ({tenants.length})
        </button>
        <button
          onClick={() => setActiveAdminSubTab('plans')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeAdminSubTab === 'plans'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Subscription Plans & Pricing Tiers ({plans.length})
        </button>
        <button
          onClick={() => setActiveAdminSubTab('crawler')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeAdminSubTab === 'crawler'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Crawler Proxy Cluster Health
        </button>
      </div>

      {/* Tab 1: Tenants Management */}
      {activeAdminSubTab === 'tenants' && (
        <div className="space-y-4">
          <div className="rounded-3xl glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/50 border-b border-white/[0.06] text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Brand Workspace</th>
                    <th className="p-4">Industry</th>
                    <th className="p-4">Contact Email</th>
                    <th className="p-4">Plan Tier</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">SKU Quota</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  {tenants.map((t) => {
                    const tenantProds = products.filter((p) => p.tenantId === t.id);

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{t.logo}</span>
                            <div>
                              <span className="font-bold text-slate-100 block text-xs sm:text-sm">
                                {t.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">/{t.slug}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-slate-400">{t.industry}</td>

                        <td className="p-4 text-slate-300 font-mono text-[11px]">{t.contactEmail}</td>

                        {/* Plan Tier Selector */}
                        <td className="p-4">
                          <select
                            value={t.planId}
                            onChange={(e) => updateTenantPlan(t.id, e.target.value as PlanTier)}
                            className="px-2.5 py-1 rounded-xl bg-slate-950 border border-white/[0.08] text-xs font-semibold text-blue-400 focus:outline-none cursor-pointer"
                          >
                            <option value="starter">Starter ($79/mo)</option>
                            <option value="growth">Growth ($199/mo)</option>
                            <option value="enterprise">Enterprise ($499/mo)</option>
                          </select>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              t.planStatus === 'active'
                                ? 'badge-clean-emerald'
                                : t.planStatus === 'suspended'
                                ? 'badge-clean-rose'
                                : 'badge-clean-amber'
                            }`}
                          >
                            {t.planStatus}
                          </span>
                        </td>

                        {/* SKU Limit */}
                        <td className="p-4">
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-200">
                              {tenantProds.length} / {t.skuLimit}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {Math.round((tenantProds.length / t.skuLimit) * 100)}% used
                            </span>
                          </div>
                        </td>

                        {/* Admin Actions: Suspend / Reactivate & View */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                updateTenantPlanStatus(
                                  t.id,
                                  t.planStatus === 'suspended' ? 'active' : 'suspended'
                                )
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                                t.planStatus === 'suspended'
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}
                              title={t.planStatus === 'suspended' ? 'Reactivate brand account' : 'Suspend brand account'}
                            >
                              {t.planStatus === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>

                            <button
                              onClick={() => handleSwitchToTenant(t.id)}
                              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              View →
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription Plans Manager */}
      {activeAdminSubTab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-3xl glass-card flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-base">{p.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase">
                      {p.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-3xl font-black text-white">${p.priceMonthly}</span>
                    <span className="text-xs text-slate-400 font-medium"> / month</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-white/[0.06]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max SKUs:</span>
                      <strong className="text-white">{p.maxProducts.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Competitors:</span>
                      <strong className="text-white">{p.maxCompetitors}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scan Frequency:</span>
                      <strong className="text-emerald-400 font-semibold">{p.scanFrequencyLabel}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Features:
                    </span>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingPlan(p);
                    setEditPriceMonthly(p.priceMonthly.toString());
                    setEditMaxProducts(p.maxProducts.toString());
                    setEditMaxCompetitors(p.maxCompetitors.toString());
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-white/[0.06]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Plan Pricing & Limits
                </button>
              </div>
            ))}
          </div>

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Edit Plan: {editingPlan.name}</h3>

                <form onSubmit={handleSavePlanEdit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Monthly Price ($)
                    </label>
                    <input
                      type="number"
                      value={editPriceMonthly}
                      onChange={(e) => setEditPriceMonthly(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Max SKUs</label>
                      <input
                        type="number"
                        value={editMaxProducts}
                        onChange={(e) => setEditMaxProducts(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Max Competitors
                      </label>
                      <input
                        type="number"
                        value={editMaxCompetitors}
                        onChange={(e) => setEditMaxCompetitors(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPlan(null)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-clean px-4 py-1.5 rounded-xl text-white font-semibold text-xs shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Crawler Cluster Health */}
      {activeAdminSubTab === 'crawler' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl glass-card space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Proxy Pool Health
              </span>
              <span className="text-3xl font-black text-emerald-400">99.8%</span>
              <span className="text-[11px] text-slate-400 block">1,450 residential nodes active</span>
            </div>

            <div className="p-5 rounded-3xl glass-card space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Anti-Bot Bypass Success
              </span>
              <span className="text-3xl font-black text-blue-400">99.1%</span>
              <span className="text-[11px] text-slate-400 block">Cloudflare & Datadome transparent</span>
            </div>

            <div className="p-5 rounded-3xl glass-card space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Scrape Latency
              </span>
              <span className="text-3xl font-black text-purple-400">410 ms</span>
              <span className="text-[11px] text-slate-400 block">Headless DOM extraction pipeline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
