'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PlanTier } from '@/types';
import {
  X,
  Check,
  Zap,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose }) => {
  const { currentTenant, plans, purchasePlan } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanTier>(currentTenant.planId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmPurchase = async (planId: PlanTier) => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 600)); // Smooth simulated transaction
    await purchasePlan(planId);
    setIsProcessing(false);
    setSuccessNotice(`Successfully upgraded to ${planId.toUpperCase()}! Your new SKU and competitor limits are now active.`);
    setTimeout(() => {
      setSuccessNotice(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-4xl rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Subscription Plans & Quota</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Current: {currentTenant.planId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose the right monitoring frequency and SKU scale for {currentTenant.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success message banner */}
        {successNotice && (
          <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {successNotice}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 text-xs">
            <span className={billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-400'}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center border border-white/[0.1] cursor-pointer transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full bg-blue-500 transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className={billingCycle === 'yearly' ? 'text-white font-bold' : 'text-slate-400'}>
              Annual Billing{' '}
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                Save 20%
              </span>
            </span>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isCurrent = currentTenant.planId === p.id;
              const isSelected = selectedPlanId === p.id;
              const isPopular = p.id === 'growth';

              const price = billingCycle === 'yearly' ? Math.round(p.priceYearly / 12) : p.priceMonthly;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`rounded-3xl p-5 flex flex-col justify-between transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'bg-blue-950/40 border-2 border-blue-500 shadow-xl shadow-blue-500/10'
                      : isSelected
                      ? 'bg-slate-800/80 border-2 border-indigo-400'
                      : 'bg-slate-900/60 border border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{p.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">${price}</span>
                        <span className="text-xs text-slate-400">/ month</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <span className="text-[10px] text-slate-500">Billed annually (${p.priceYearly}/yr)</span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-300 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        <span>Up to {p.maxProducts.toLocaleString()} SKUs</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{p.maxCompetitors} Competitor Stores</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{p.scanFrequencyLabel}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 text-[11px] text-slate-400">
                      {p.features.slice(3).map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.06]">
                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl bg-blue-500/10 text-blue-300 text-xs font-bold text-center border border-blue-500/20">
                        Current Active Plan
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmPurchase(p.id);
                        }}
                        disabled={isProcessing}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {isProcessing ? 'Activating...' : `Switch to ${p.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure payment reassurance strip */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant activation • 14-day money back guarantee • Cancel or switch anytime</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Lock className="w-3 h-3" />
              <span>Encrypted via 256-bit SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
