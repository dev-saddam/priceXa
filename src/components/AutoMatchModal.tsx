'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Product, CompetitorProductMatch } from '@/types';
import {
  X,
  Search,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Check,
  RefreshCw,
} from 'lucide-react';

interface AutoMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct?: Product | null;
}

export const AutoMatchModal: React.FC<AutoMatchModalProps> = ({
  isOpen,
  onClose,
  targetProduct,
}) => {
  const {
    products,
    competitors,
    currentTenant,
    autoMatchProductByTitle,
    addManualMatch,
    matches,
  } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    targetProduct?.id || products[0]?.id || ''
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchLogs, setSearchLogs] = useState<string[]>([]);
  const [discoveredMatches, setDiscoveredMatches] = useState<CompetitorProductMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'auto_search' | 'manual_link'>('auto_search');

  // Manual link form state
  const [manualCompId, setManualCompId] = useState<string>(competitors[0]?.id || '');
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualStock, setManualStock] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [manualSaved, setManualSaved] = useState(false);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === (targetProduct?.id || selectedProductId));
  const activeCompetitors = competitors.filter(
    (c) => c.tenantId === currentTenant.id && c.status === 'active'
  );

  const existingMatches = currentProduct
    ? matches.filter((m) => m.productId === currentProduct.id)
    : [];

  const handleRunSearch = async () => {
    if (!currentProduct) return;
    setIsSearching(true);
    setSearchLogs([`Initiating crawler query for: "${currentProduct.name}"...`]);

    for (let i = 0; i < activeCompetitors.length; i++) {
      const comp = activeCompetitors[i];
      await new Promise((r) => setTimeout(r, 450));
      setSearchLogs((prev) => [
        ...prev,
        `Searching ${comp.name} (${comp.domain}) for title keywords...`,
      ]);
    }

    await new Promise((r) => setTimeout(r, 500));
    setSearchLogs((prev) => [
      ...prev,
      'Calculating title vector similarity & parsing price nodes...',
    ]);

    const res = await autoMatchProductByTitle(currentProduct.id);
    setDiscoveredMatches(res);
    setIsSearching(false);
    setSearchLogs((prev) => [
      ...prev,
      `Matched ${res.length} competitor listings across active stores.`,
    ]);
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !manualCompId || !manualUrl || !manualPrice) return;

    addManualMatch(
      currentProduct.id,
      manualCompId,
      manualTitle || currentProduct.name,
      manualUrl,
      parseFloat(manualPrice),
      manualStock
    );

    setManualSaved(true);
    setTimeout(() => {
      setManualSaved(false);
      setManualTitle('');
      setManualUrl('');
      setManualPrice('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Competitor Title Search & Match</h2>
              <p className="text-xs text-slate-400">
                Discover product prices and stock across competitor domains by title
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

        {/* Tab switch */}
        <div className="flex border-b border-white/[0.06] bg-slate-950/40 px-6 pt-3 gap-5">
          <button
            onClick={() => setActiveTab('auto_search')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'auto_search'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Automated Title Search ({activeCompetitors.length} Stores)
          </button>
          <button
            onClick={() => setActiveTab('manual_link')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'manual_link'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Manual URL Link
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Product Selection */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.06] space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Selected Product to Monitor
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{currentProduct?.name || 'No Product in Catalog'}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-slate-300">SKU: {currentProduct?.code || 'None'}</span>
                  <span>•</span>
                  <span>
                    Your Rate:{' '}
                    <strong className="text-slate-100">
                      {currentTenant.currencySymbol}
                      {currentProduct ? currentProduct.currentPrice.toFixed(2) : '0.00'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    MRP:{' '}
                    <span className="text-slate-400">
                      {currentTenant.currencySymbol}
                      {currentProduct ? currentProduct.mrp.toFixed(2) : '0.00'}
                    </span>
                  </span>
                </div>
              </div>

              {!targetProduct && products.length > 0 && (
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setDiscoveredMatches([]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {activeTab === 'auto_search' ? (
            <div className="space-y-4">
              {/* Trigger Button */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/[0.06] border border-blue-500/20">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-300">
                    Search Competitor Stores by Product Title
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Queries catalogs for title keywords, extracting verified prices and live stock.
                  </p>
                </div>
                <button
                  onClick={handleRunSearch}
                  disabled={isSearching || activeCompetitors.length === 0}
                  className="btn-primary-clean flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Search All Stores
                    </>
                  )}
                </button>
              </div>

              {/* Crawler Search Logs */}
              {searchLogs.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/[0.06] text-[11px] font-mono space-y-1 text-slate-400 max-h-36 overflow-y-auto">
                  {searchLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Listings */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Confirmed Competitor Matches ({existingMatches.length})
                </h4>

                {existingMatches.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-white/[0.06] text-slate-400 text-xs">
                    No competitor matches linked yet for this product. Click{' '}
                    <strong className="text-slate-200">Search All Stores</strong> above to search automatically.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {existingMatches.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/10 transition-colors"
                      >
                        <div className="space-y-1 max-w-[65%]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{m.competitorName}</span>
                            <span className="badge-clean-purple px-2 py-0.5 rounded-full text-[9px] font-bold">
                              {m.matchConfidence}% Match
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                m.stockStatus === 'in_stock'
                                  ? 'badge-clean-emerald'
                                  : 'badge-clean-rose'
                              }`}
                            >
                              {m.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <p className="text-slate-400 truncate text-[11px]">{m.competitorProductTitle}</p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-slate-100">
                            {currentTenant.currencySymbol}
                            {m.currentPrice.toFixed(2)}
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              m.priceDiff < 0
                                ? 'text-rose-400'
                                : m.priceDiff > 0
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {m.priceDiff < 0
                              ? `${Math.abs(m.priceDiffPercent)}% Cheaper`
                              : m.priceDiff > 0
                              ? `+${m.priceDiffPercent}% Higher`
                              : 'Identical'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Manual URL Link Override */
            <form onSubmit={handleManualSave} className="space-y-4">
              {manualSaved && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Manual competitor match saved successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Competitor *
                  </label>
                  <select
                    value={manualCompId}
                    onChange={(e) => setManualCompId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {activeCompetitors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.domain})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Price ({currentTenant.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="149.99"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-semibold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Direct Competitor Product URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.amazon.com/dp/B09VXYZ99"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Listing Title on Store
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Velocity Pro Carbon (Men)"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stock Status
                  </label>
                  <select
                    value={manualStock}
                    onChange={(e) => setManualStock(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock (&lt; 5)</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="btn-primary-clean flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Link Product to Competitor
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-slate-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
