'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Bell,
  Zap,
  Shield,
  ChevronDown,
  Plus,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenScanRunner: () => void;
  onOpenRegisterBrand: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenScanRunner,
  onOpenRegisterBrand,
}) => {
  const {
    currentTenant,
    tenants,
    setCurrentTenantId,
    isSuperAdmin,
    setIsSuperAdmin,
    notifications,
    isScanning,
    setActiveTab,
  } = useApp();

  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(
    (n) => n.tenantId === currentTenant.id && !n.read
  ).length;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-[#080d19]/85 backdrop-blur-xl px-5 sm:px-7 flex items-center justify-between transition-colors">
      {/* Left: Brand / Tenant selector */}
      <div className="flex items-center gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm tracking-tight border border-white/20">
            PX
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">PriceXa</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Competitor Price Intelligence</p>
          </div>
        </div>

        <div className="h-5 w-px bg-white/[0.08] hidden md:block" />

        {/* Tenant / Brand Switcher */}
        {!isSuperAdmin ? (
          <div className="relative">
            <button
              onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/[0.08] hover:border-white/20 hover:bg-slate-900 transition-all text-xs font-medium group"
            >
              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-slate-800/80 text-xs border border-white/[0.06]">
                {currentTenant.logo}
              </div>
              <span className="font-semibold text-slate-200">
                {currentTenant.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden lg:inline">
                {currentTenant.planId}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
            </button>

            {brandDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Brand Workspaces
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTenantId(t.id);
                        setBrandDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                        t.id === currentTenant.id
                          ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{t.logo}</span>
                        <div>
                          <p className="font-semibold leading-tight text-slate-100">{t.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{t.industry}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                        {t.planId}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-1 pt-1 border-t border-white/[0.06]">
                  <button
                    onClick={() => {
                      setBrandDropdownOpen(false);
                      onOpenRegisterBrand();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Register New Brand
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Super Administrator View
          </div>
        )}
      </div>

      {/* Right: Crawl Indicator, Live Scan Button, Notifications, Super Admin Switch */}
      <div className="flex items-center gap-3">
        {/* Scheduler status badge */}
        {!isSuperAdmin && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/[0.08] text-xs text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">
              Next 2x/Day Crawl: <span className="text-slate-200 font-semibold">{currentTenant.nextScanAt}</span>
            </span>
          </div>
        )}

        {/* Live Instant Scan Button */}
        {!isSuperAdmin && (
          <button
            onClick={onOpenScanRunner}
            disabled={isScanning}
            className="btn-primary-clean flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Instant Scan'}</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-900/60 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          title="Price & Stock Alert Feed"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white shadow-sm ring-2 ring-[#080d19] animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Super Admin Switcher */}
        <button
          onClick={() => {
            const nextState = !isSuperAdmin;
            setIsSuperAdmin(nextState);
            setActiveTab(nextState ? 'superadmin' : 'dashboard');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isSuperAdmin
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              : 'bg-slate-900/60 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isSuperAdmin ? 'Exit Admin' : 'Super Admin'}</span>
        </button>
      </div>
    </header>
  );
};
