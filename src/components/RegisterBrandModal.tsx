'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Building2, Check } from 'lucide-react';
import { PlanTier } from '@/types';

interface RegisterBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterBrandModal: React.FC<RegisterBrandModalProps> = ({ isOpen, onClose }) => {
  const { registerBrandTenant, plans } = useApp();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Footwear & Apparel');
  const [contactEmail, setContactEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [planId, setPlanId] = useState<PlanTier>('growth');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactEmail) return;

    registerBrandTenant({
      name,
      industry,
      contactEmail,
      currency,
      planId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Register New Brand / Store</h2>
              <p className="text-xs text-slate-400">Onboard a brand into PriceXa multi-tenant platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Brand / Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Zenvo Activewear"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Industry / Sector</label>
              <input
                type="text"
                placeholder="e.g. Consumer Electronics"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Brand Contact Email *
            </label>
            <input
              type="email"
              required
              placeholder="ops@brand.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Subscription Tier Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Subscription Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    planId === p.id
                      ? 'bg-blue-600/15 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30'
                      : 'bg-slate-950/60 border-white/[0.06] text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="block font-bold text-xs text-slate-100">{p.name.split(' ')[0]}</span>
                  <span className="block text-sm font-extrabold text-white mt-1">
                    ${p.priceMonthly}
                    <span className="text-[10px] font-normal text-slate-400">/mo</span>
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {p.maxProducts.toLocaleString()} SKUs
                  </span>
                  <span className="block text-[10px] text-blue-400 font-semibold mt-0.5">
                    {p.scanFrequency === '2x_daily' ? '2x Daily' : p.scanFrequency}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-clean flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Complete Onboarding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
