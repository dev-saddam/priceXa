'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AlertRule } from '@/types';
import {
  Plus,
  Trash2,
  TrendingDown,
  PackageX,
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const {
    currentTenant,
    alertRules,
    notifications,
    toggleAlertRule,
    deleteAlertRule,
    addAlertRule,
    markNotificationAsRead,
    applyReprice,
  } = useApp();

  const [isAddingRule, setIsAddingRule] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [conditionType, setConditionType] = useState<AlertRule['conditionType']>('competitor_cheaper_by_pct');
  const [thresholdValue, setThresholdValue] = useState('5');
  const [severity, setSeverity] = useState<AlertRule['severity']>('critical');
  const [channel, setChannel] = useState<AlertRule['channel']>('both');

  const [activeTab, setActiveTab] = useState<'feed' | 'rules'>('feed');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [repricedNotice, setRepricedNotice] = useState<string | null>(null);

  const tenantRules = alertRules.filter((r) => r.tenantId === currentTenant.id);
  const tenantNotifs = notifications.filter((n) => n.tenantId === currentTenant.id);

  const filteredNotifs = tenantNotifs.filter((n) => {
    if (filterSeverity === 'all') return true;
    return n.severity === filterSeverity;
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    addAlertRule({
      name: ruleName,
      conditionType,
      thresholdValue: parseFloat(thresholdValue) || 0,
      severity,
      enabled: true,
      channel,
    });

    setRuleName('');
    setIsAddingRule(false);
  };

  const handleReprice = (productId: string, price: number, name: string) => {
    applyReprice(productId, price);
    setRepricedNotice(`Successfully repriced ${name} to ${currentTenant.currencySymbol}${price}`);
    setTimeout(() => setRepricedNotice(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Smart Alerts & Trigger Conditions
            <span className="badge-clean-rose text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {tenantNotifs.filter((n) => !n.read).length} Unread
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automated price thresholds, competitor stockouts, and review alert events
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/[0.06] text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'feed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alerts Feed ({tenantNotifs.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'rules' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Configured Rules ({tenantRules.length})
          </button>
        </div>
      </div>

      {repricedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          {repricedNotice}
        </div>
      )}

      {activeTab === 'feed' ? (
        /* Alerts Feed View */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Alert Stream
            </span>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Severity:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-950/70 border border-white/[0.08] text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info / Arbitrage</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotifs.length === 0 ? (
              <div className="p-8 text-center rounded-3xl glass-card text-slate-400 text-xs">
                No alerts matching the selected filter.
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isUnderCut = notif.newPrice < notif.myPrice && notif.myPrice > 0;
                const isStockout = notif.stockChange?.to === 'out_of_stock';

                return (
                  <div
                    key={notif.id}
                    className={`p-5 rounded-3xl border transition-all space-y-3.5 ${
                      !notif.read
                        ? 'bg-slate-900/90 border-blue-500/30 shadow-lg'
                        : 'glass-card text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            notif.severity === 'critical'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : notif.severity === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {isUnderCut ? (
                            <TrendingDown className="w-5 h-5" />
                          ) : isStockout ? (
                            <PackageX className="w-5 h-5" />
                          ) : (
                            <ShieldAlert className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-xs sm:text-sm">{notif.title}</span>
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                notif.severity === 'critical'
                                  ? 'badge-clean-rose'
                                  : notif.severity === 'warning'
                                  ? 'badge-clean-amber'
                                  : 'badge-clean-blue'
                              }`}
                            >
                              {notif.severity}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 block">{notif.timestamp}</span>
                        </div>
                      </div>

                      {!notif.read && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                    {/* Quick Reprice Card */}
                    {notif.newPrice > 0 && notif.myPrice > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-5">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Your Rate:</span>
                            <span className="font-bold text-slate-100">
                              {currentTenant.currencySymbol}
                              {notif.myPrice.toFixed(2)}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-slate-400 text-[10px] block">Competitor Rate:</span>
                            <span className="font-bold text-rose-400">
                              {currentTenant.currencySymbol}
                              {notif.newPrice.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Disparity:</span>
                            <span className="font-bold text-rose-400">
                              {Math.abs(notif.priceDiffPercent)}% Cheaper
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReprice(notif.productId, notif.newPrice, notif.productName)}
                          className="btn-primary-clean flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-semibold text-xs shadow-md transition-all cursor-pointer shrink-0"
                        >
                          Match Price ({currentTenant.currencySymbol}
                          {notif.newPrice.toFixed(2)})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Configured Rules Manager View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Trigger Rules
            </span>
            <button
              onClick={() => setIsAddingRule(true)}
              className="btn-primary-clean flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Condition Rule
            </button>
          </div>

          {/* Add Rule Form */}
          {isAddingRule && (
            <form
              onSubmit={handleCreateRule}
              className="p-6 rounded-3xl glass-card border border-blue-500/40 space-y-4 shadow-xl animate-in fade-in"
            >
              <h3 className="text-sm font-bold text-white">Create New Alert Condition</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Notify when competitor undercuts by > 7%"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condition Trigger</label>
                  <select
                    value={conditionType}
                    onChange={(e) => setConditionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="competitor_cheaper_by_pct">Competitor Cheaper by X%</option>
                    <option value="cheaper_than_mrp">Competitor Sells Below My MRP</option>
                    <option value="price_drop">Price Drops by Absolute Amount ($)</option>
                    <option value="stock_out">Competitor Goes Out of Stock (Arbitrage)</option>
                    <option value="stock_restocked">Competitor Restocks Product</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Threshold Value (% or $)
                  </label>
                  <input
                    type="number"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="both">In-App + Email</option>
                    <option value="in_app">In-App Only</option>
                    <option value="email">Email Only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-clean px-4 py-1.5 rounded-xl text-white font-semibold text-xs shadow-md"
                >
                  Save Alert Rule
                </button>
              </div>
            </form>
          )}

          {/* List of rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenantRules.map((rule) => (
              <div
                key={rule.id}
                className="p-5 rounded-3xl glass-card space-y-3.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">{rule.name}</h3>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Triggered {rule.timesTriggered} times • Channel: {rule.channel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlertRule(rule.id)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        rule.enabled
                          ? 'badge-clean-emerald'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/60'
                      }`}
                    >
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => deleteAlertRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-xs text-slate-300">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Condition:
                  </span>
                  <span>
                    When competitor changes price by &gt; {rule.thresholdValue}
                    {rule.conditionType.includes('pct') ? '%' : '$'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
