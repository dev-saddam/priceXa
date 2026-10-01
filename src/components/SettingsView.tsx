'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Save, 
  CheckCircle2, 
  Webhook, 
  Clock, 
  Mail, 
  Shield, 
  Globe2, 
  Coins, 
  Search, 
  Store,
  AlertCircle,
  Loader2,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import { 
  COUNTRY_LIST,
  SUPPORTED_COUNTRIES, 
  SUPPORTED_CURRENCIES, 
  getCountryConfig, 
  getCurrencySymbol,
  adaptDomainForCountry
} from '@/lib/countryConfig';

export const SettingsView: React.FC = () => {
  const { currentTenant, updateTenantSettings } = useApp();

  const [country, setCountry] = useState<string>(
    currentTenant.country || currentTenant.countryCode || 'IN'
  );
  const [currency, setCurrency] = useState<string>(currentTenant.currency || 'INR');
  const [contactEmail, setContactEmail] = useState(currentTenant.contactEmail || '');
  const [webhookUrl, setWebhookUrl] = useState(currentTenant.webhookUrl || '');
  const [emailAlerts, setEmailAlerts] = useState(currentTenant.emailAlertsEnabled ?? true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [loadingSupabase, setLoadingSupabase] = useState(true);

  useEffect(() => {
    fetch('/api/supabase/status')
      .then((r) => r.json())
      .then((data) => {
        setSupabaseStatus(data);
        setLoadingSupabase(false);
      })
      .catch(() => {
        setSupabaseStatus({ connected: false, error: 'Failed connecting to API endpoint' });
        setLoadingSupabase(false);
      });
  }, []);

  // Sync state if currentTenant changes (e.g., tenant switch)
  useEffect(() => {
    setCountry(currentTenant.country || currentTenant.countryCode || 'IN');
    setCurrency(currentTenant.currency || 'INR');
    setContactEmail(currentTenant.contactEmail || '');
    setWebhookUrl(currentTenant.webhookUrl || '');
    setEmailAlerts(currentTenant.emailAlertsEnabled ?? true);
  }, [currentTenant]);

  const handleCountryChange = (newCountryCode: string) => {
    setCountry(newCountryCode);
    const countryCfg = getCountryConfig(newCountryCode);
    setCurrency(countryCfg.defaultCurrency);
  };

  const selectedCountryConfig = getCountryConfig(country);
  const activeCurrencySymbol = getCurrencySymbol(currency);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const symbol = getCurrencySymbol(currency);

    const result = await updateTenantSettings(currentTenant.id, {
      country,
      currency,
      currencySymbol: symbol,
      contactEmail,
      webhookUrl,
      emailAlertsEnabled: emailAlerts,
    });

    setIsSaving(false);

    if (result.success) {
      setSuccessMsg(
        `Workspace updated! Target market set to ${selectedCountryConfig.name} (${symbol} ${currency}). Competitor search and domain routes updated.`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(result.error || 'Failed to update workspace settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          Workspace Settings: {currentTenant.name}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure target search country, store currency, notification channels, and automated crawl settings
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Country & Regional Search Settings */}
        <div className="p-6 rounded-3xl glass-card space-y-5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              Target Search Country & Currency
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {selectedCountryConfig.flag} {selectedCountryConfig.name} Search Engine
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Changing your target country adapts all competitor queries. For instance, selecting <strong>United Kingdom (UK)</strong> will automatically direct Google & store crawler searches to <span className="text-cyan-300 font-mono">amazon.co.uk</span> and <span className="text-cyan-300 font-mono">ebay.co.uk</span> with prices parsed in <strong>British Pounds (£ GBP)</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                Target Country / Region
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.12] text-slate-100 text-xs focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
              >
                {COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.flag} {c.name} ({c.code}) - {c.defaultCurrency} ({c.currencySymbol})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Regional search parameters: Google (<code>gl={selectedCountryConfig.googleGl}</code>, <code>hl={selectedCountryConfig.googleHl}</code>), DuckDuckGo (<code>{selectedCountryConfig.ddgKl}</code>)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Store Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.12] text-slate-100 text-xs focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code} className="bg-slate-900 text-white">
                    {cur.symbol} - {cur.code} ({cur.name})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Active symbol across all tables & alerts: <strong className="text-amber-400 font-mono">{activeCurrencySymbol}</strong>
              </p>
            </div>
          </div>

          {/* Regional Adaptation Preview Badge */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                Live Regional Search Configuration:
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                {selectedCountryConfig.flag} {selectedCountryConfig.name}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Marketplace Domain</div>
                <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
                  {selectedCountryConfig.amazonDomain}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Secondary Store</div>
                <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
                  {selectedCountryConfig.ebayDomain}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Search Geolocation</div>
                <div className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                  gl={selectedCountryConfig.googleGl} ({activeCurrencySymbol})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Information */}
        <div className="p-6 rounded-3xl glass-card space-y-4 border border-white/[0.08]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Brand Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                disabled
                value={currentTenant.name}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-white/[0.06] text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Sector</label>
              <input
                type="text"
                disabled
                value={currentTenant.industry || 'Footwear & Fashion'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-white/[0.06] text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Twice-a-Day Crawl Scheduling */}
        <div className="p-6 rounded-3xl glass-card space-y-4 border border-white/[0.08]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Automated Crawler Schedule
          </h2>

          <p className="text-xs text-slate-400">
            PriceXa triggers dual competitor sweeps daily at designated regional times for your catalog.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Morning Crawl Time
              </label>
              <input
                type="text"
                disabled
                value="08:00 AM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-white/[0.06] text-slate-300 text-xs font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Evening Crawl Time
              </label>
              <input
                type="text"
                disabled
                value="08:00 PM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-white/[0.06] text-slate-300 text-xs font-bold font-mono"
              />
            </div>
          </div>
        </div>

        {/* Alert Dispatch & Webhooks */}
        <div className="p-6 rounded-3xl glass-card space-y-4 border border-white/[0.08]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-400" />
            Alert Dispatch & External Webhook
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notification Email Address
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                placeholder="alerts@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-blue-400" />
                Outgoing Webhook URL (Shopify / Slack / ERP)
              </label>
              <input
                type="url"
                placeholder="https://api.yourstore.com/webhooks/pricing-alerts"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Price deltas and competitor stock transitions will post payload packets to this endpoint.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="emailAlertsCheck"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="emailAlertsCheck" className="text-xs text-slate-300 cursor-pointer">
                Send instantaneous email digest when critical price under-cuts occur
              </label>
            </div>
          </div>
        </div>

        {/* Cloud Database & Supabase Connectivity Status */}
        <div className="p-6 rounded-3xl glass-card space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Cloud Database & Storage (Supabase)
            </h2>
            {loadingSupabase ? (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                Testing link...
              </span>
            ) : supabaseStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected & Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Missing Vercel Env Vars
              </span>
            )}
          </div>

          {loadingSupabase ? (
            <p className="text-xs text-slate-400">Pinging Supabase cloud endpoint...</p>
          ) : supabaseStatus?.connected ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Your deployment is connected to Supabase PostgreSQL. All product uploads, pricing feeds, competitor tracking, and alert triggers persist in real time.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Products</span>
                  <span className="text-lg font-extrabold text-slate-100">{supabaseStatus.counts?.products ?? 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tenants</span>
                  <span className="text-lg font-extrabold text-slate-100">{supabaseStatus.counts?.tenants ?? 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Competitors</span>
                  <span className="text-lg font-extrabold text-slate-100">{supabaseStatus.counts?.competitors ?? 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Matches</span>
                  <span className="text-lg font-extrabold text-slate-100">{supabaseStatus.counts?.matches ?? 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/[0.06]">
                <span className="truncate max-w-[280px]">Endpoint: <span className="font-mono text-slate-300">{supabaseStatus.url}</span></span>
                <span className="text-emerald-400/90 font-medium">Service Role Access Active</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-amber-200">How to Connect Supabase on Vercel:</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Vercel deployments run isolated serverless functions. To connect your Supabase database, add these environment variables in your Vercel Dashboard:
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-white/[0.08] space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span className="text-blue-400 font-semibold">NEXT_PUBLIC_SUPABASE_URL</span>
                  <span className="text-slate-500 truncate max-w-[200px]">https://your-project.supabase.co</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-blue-400 font-semibold">SUPABASE_SERVICE_ROLE_KEY</span>
                  <span className="text-slate-500">eyJhbGciOi... (secret key)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-blue-400 font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  <span className="text-slate-500">eyJhbGciOi... (public anon key)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Steps: Open <strong className="text-slate-200">Vercel &gt; Your Project &gt; Settings &gt; Environment Variables</strong>, add the 3 keys above, then click <strong className="text-slate-200">Deployments &gt; Redeploy</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary-clean flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Updating Regional Parameters...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Workspace Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
