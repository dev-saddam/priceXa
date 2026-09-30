'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PlanTier } from '@/types';
import {
  ShieldCheck,
  Building,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  Globe,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, registerCompany, tenants } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Registration Fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Sportswear & Apparel');
  const [currency, setCurrency] = useState('USD');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) {
      setErrorMsg('Company Name and Work Email are required.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    const res = await registerCompany({
      companyName: companyName.trim(),
      email: email.trim(),
      password,
      industry,
      currency,
    });
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed. Please try a different email.');
    }
  };

  const handleQuickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setErrorMsg(null);
    setLoading(true);
    setTimeout(async () => {
      await login(demoEmail, 'password');
      setLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Dynamic ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25 text-white font-black text-lg border border-white/20">
              PX
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">PriceXa</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Competitor Price Monitoring & Intelligence</p>
            </div>
          </div>
        </div>

        {/* Auth Glass Card */}
        <div className="rounded-3xl glass-card border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-2xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-white/[0.06] text-xs font-semibold">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-2xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In to Workspace
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-2xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New Company
            </button>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    Work Email / Account
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pricing-ops@yourbrand.com or admin@pricexa.com"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400">Demo: any password</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary-clean py-3 rounded-2xl text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    'Signing In...'
                  ) : (
                    <>
                      <span>Open Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick 1-Click Demo Logins */}
                <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                    Quick 1-Click Test Access
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('admin@pricexa.com')}
                      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-left text-xs transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-amber-300 block flex items-center gap-1">
                        👑 Platform Admin
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">admin@pricexa.com</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('pricing-ops@apexathletics.com')}
                      className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-left text-xs transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-blue-300 block flex items-center gap-1">
                        ⚡ Apex Athletics
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Growth Plan (1.5k SKUs)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('director@aurasoundworks.com')}
                      className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-left text-xs transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-purple-300 block flex items-center gap-1">
                        🎧 Aura Soundworks
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Consumer Audio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('operations@luminaskin.co')}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-left text-xs transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-emerald-300 block flex items-center gap-1">
                        ✨ Lumina Skin Labs
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Starter Trial</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER COMPANY */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    Company / Brand Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Footwear, Nova Tech Labs"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    Work Contact Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@acmefootwear.com"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Industry
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-950/80 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Sportswear & Apparel">Sportswear & Apparel</option>
                      <option value="Consumer Electronics">Consumer Electronics</option>
                      <option value="Cosmetics & Skincare">Cosmetics & Skincare</option>
                      <option value="Footwear & Sneakers">Footwear & Sneakers</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Health & Supplements">Health & Supplements</option>
                      <option value="General E-Commerce">General E-Commerce</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                      Store Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-950/80 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                      <option value="CAD">CAD ($ - Canadian Dollar)</option>
                      <option value="AUD">AUD ($ - Australian Dollar)</option>
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                    </select>
                  </div>
                </div>

                {/* 14-Day Free Trial Notice */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1.5 mt-2">
                  <div className="flex items-center gap-2 font-semibold text-blue-300">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Instant Free Trial Workspace</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    No upfront plan selection or credit card required. Once registered, you will have immediate access to your workspace and can select, buy, or change your subscription plan anytime directly from your dashboard.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary-clean py-3 rounded-2xl text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                >
                  {loading ? (
                    'Creating Company Workspace...'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Register Company Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security / Isolation reassurance */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Strict Multi-Tenant Isolation
          </span>
          <span>•</span>
          <span>Zero Data Leaks</span>
          <span>•</span>
          <span>Automated 2x/Day Crawling</span>
        </div>
      </div>
    </div>
  );
};
