'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Save, CheckCircle2, Webhook, Clock, Mail, Shield } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentTenant } = useApp();

  const [contactEmail, setContactEmail] = useState(currentTenant.contactEmail);
  const [webhookUrl, setWebhookUrl] = useState(currentTenant.webhookUrl || '');
  const [emailAlerts, setEmailAlerts] = useState(currentTenant.emailAlertsEnabled);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          Workspace Settings: {currentTenant.name}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure notification alerts, outbound webhook integrations, and crawl parameters
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Settings successfully updated for {currentTenant.name}.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Brand Information */}
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Brand Profile & Currency
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
              <input
                type="text"
                disabled
                value={`${currentTenant.currency} (${currentTenant.currencySymbol})`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-white/[0.06] text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Twice-a-Day Crawl Scheduling */}
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Twice-a-Day Automation Slots
          </h2>

          <p className="text-xs text-slate-400">
            PriceXa automatically triggers dual competitor sweeps daily at designated times.
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
        <div className="p-6 rounded-3xl glass-card space-y-4">
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

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary-clean flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Workspace Settings
          </button>
        </div>
      </form>
    </div>
  );
};
