'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldAlert, Mail, LogOut } from 'lucide-react';

export const SuspendedAccountNotice: React.FC = () => {
  const { currentTenant, logout, isSuperAdmin } = useApp();

  // If super admin is viewing, do not block
  if (isSuperAdmin || currentTenant.planStatus !== 'suspended') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080d19]/95 backdrop-blur-xl p-4">
      <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-rose-500/30 p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/25 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Account Suspended
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {currentTenant.name} is Temporarily Inactive
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your brand workspace has been suspended by the platform administrator. Automated price crawlers,
            alert notifications, and catalog updates are currently paused.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Account Contact:</span>
            <span className="font-mono text-white">{currentTenant.contactEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Plan:</span>
            <span className="font-bold uppercase text-amber-400">{currentTenant.planId}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href="mailto:support@pricexa.com?subject=Reactivate%20Suspended%20Account"
            className="flex-1 btn-primary-clean flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/[0.08] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
