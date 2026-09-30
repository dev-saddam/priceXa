'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Crosshair,
  Plus,
  ExternalLink,
  Trash2,
  PackageX,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
} from 'lucide-react';

interface CompetitorsViewProps {
  onOpenAddCompetitorModal: () => void;
  onOpenAutoMatchModal: () => void;
}

export const CompetitorsView: React.FC<CompetitorsViewProps> = ({
  onOpenAddCompetitorModal,
  onOpenAutoMatchModal,
}) => {
  const {
    competitors,
    matches,
    products,
    currentTenant,
    deleteCompetitor,
    confirmMatch,
    rejectMatch,
  } = useApp();

  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('all');
  const [matchSearch, setMatchSearch] = useState('');

  const tenantCompetitors = competitors.filter((c) => c.tenantId === currentTenant.id);
  const tenantMatches = matches.filter((m) => m.tenantId === currentTenant.id);

  const filteredMatches = tenantMatches.filter((m) => {
    const matchesComp = selectedCompetitorId === 'all' || m.competitorId === selectedCompetitorId;
    const matchesQuery =
      m.competitorProductTitle.toLowerCase().includes(matchSearch.toLowerCase()) ||
      m.competitorName.toLowerCase().includes(matchSearch.toLowerCase());
    return matchesComp && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Competitor Store Monitoring
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-white/[0.08]">
              {tenantCompetitors.length} Active Stores
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-search competitor websites by title, monitor price deltas, and track stock changes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAutoMatchModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Title Search & Auto-Match
          </button>
          <button
            onClick={onOpenAddCompetitorModal}
            className="btn-primary-clean flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Store
          </button>
        </div>
      </div>

      {/* Competitor Stores Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tenantCompetitors.map((comp) => {
          const compMatches = tenantMatches.filter((m) => m.competitorId === comp.id);
          const isSelected = selectedCompetitorId === comp.id;

          return (
            <div
              key={comp.id}
              onClick={() => setSelectedCompetitorId(isSelected ? 'all' : comp.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3.5 ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/30 shadow-lg'
                  : 'glass-card glass-card-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-white/[0.08] flex items-center justify-center text-xl shadow-inner">
                    {comp.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-xs sm:text-sm leading-tight">
                      {comp.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">{comp.domain}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCompetitor(comp.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove Store"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tracked Items</span>
                  <span className="font-bold text-slate-200">{compMatches.length} Matches</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Schedule</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    2x Daily
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Discovered & Confirmed Matches Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Discovered Product Listings ({filteredMatches.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracted via automated title queries across competitor websites
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter matched titles..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {selectedCompetitorId !== 'all' && (
              <button
                onClick={() => setSelectedCompetitorId('all')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/50 border-b border-white/[0.06] text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4">Catalog Product</th>
                  <th className="p-4">Matched Competitor Listing</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Competitor Price</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4">Last Crawled</th>
                  <th className="p-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No competitor matches found. Click &quot;Title Search & Auto-Match&quot; to search competitor stores.
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((m) => {
                    const originalProduct = products.find((p) => p.id === m.productId);

                    return (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Our Product */}
                        <td className="p-4">
                          <div className="max-w-[200px]">
                            <p className="font-semibold text-slate-100 truncate text-xs">
                              {originalProduct?.name || 'Catalog Item'}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">
                              {originalProduct?.code} • {currentTenant.currencySymbol}
                              {originalProduct?.currentPrice.toFixed(2)}
                            </span>
                          </div>
                        </td>

                        {/* Competitor Listing */}
                        <td className="p-4">
                          <div className="max-w-[260px] space-y-0.5">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide block">
                              {m.competitorName}
                            </span>
                            <a
                              href={m.competitorProductUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-200 hover:text-blue-300 font-medium truncate flex items-center gap-1 group"
                            >
                              <span className="truncate">{m.competitorProductTitle}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                            </a>
                          </div>
                        </td>

                        {/* Match Confidence */}
                        <td className="p-4">
                          <span className="badge-clean-purple px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {m.matchConfidence}% Match
                          </span>
                        </td>

                        {/* Competitor Price & Delta */}
                        <td className="p-4">
                          <div>
                            <span className="font-black text-slate-100 text-sm">
                              {currentTenant.currencySymbol}
                              {m.currentPrice.toFixed(2)}
                            </span>
                            <span
                              className={`block text-[10px] font-semibold ${
                                m.priceDiff < 0
                                  ? 'text-rose-400'
                                  : m.priceDiff > 0
                                  ? 'text-emerald-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {m.priceDiff < 0
                                ? `${Math.abs(m.priceDiffPercent)}% cheaper`
                                : m.priceDiff > 0
                                ? `+${m.priceDiffPercent}% higher`
                                : 'Same price'}
                            </span>
                          </div>
                        </td>

                        {/* Stock Status */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              m.stockStatus === 'in_stock'
                                ? 'badge-clean-emerald'
                                : 'badge-clean-rose'
                            }`}
                          >
                            {m.stockStatus === 'in_stock' ? (
                              <>
                                <PackageCheck className="w-3 h-3" />
                                In Stock
                              </>
                            ) : (
                              <>
                                <PackageX className="w-3 h-3" />
                                Out of Stock
                              </>
                            )}
                          </span>
                        </td>

                        {/* Last Crawl */}
                        <td className="p-4 text-slate-400 text-[11px]">{m.lastScrapedAt}</td>

                        {/* Verification Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {m.status === 'confirmed' ? (
                              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirmed
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => confirmMatch(m.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                                  title="Confirm Match"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => rejectMatch(m.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors"
                                  title="Reject Match"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
