'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ChevronRight,
  PackageX,
  FileSpreadsheet,
  CheckCircle2,
  Check,
  Search,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  Equal,
  Loader2,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenCsvModal: () => void;
  onOpenAddProductModal: () => void;
  onOpenScanRunner: () => void;
  onOpenAutoMatchModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCsvModal,
  onOpenAddProductModal,
  onOpenScanRunner,
  onOpenAutoMatchModal,
}) => {
  const {
    currentTenant,
    products,
    competitors,
    matches,
    notifications,
    setActiveTab,
    applyReprice,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'undercut' | 'cheapest' | 'competitive' | 'stockout'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [repricedNotice, setRepricedNotice] = useState<string | null>(null);
  const [recentlyMatchedId, setRecentlyMatchedId] = useState<string | null>(null);

  const tenantProducts = useMemo(
    () => products.filter((p) => p.tenantId === currentTenant.id),
    [products, currentTenant.id]
  );

  const tenantCompetitors = useMemo(
    () => competitors.filter((c) => c.tenantId === currentTenant.id),
    [competitors, currentTenant.id]
  );

  const tenantMatches = useMemo(
    () => matches.filter((m) => m.tenantId === currentTenant.id && m.status === 'confirmed'),
    [matches, currentTenant.id]
  );

  const tenantAlerts = useMemo(
    () => notifications.filter((n) => n.tenantId === currentTenant.id),
    [notifications, currentTenant.id]
  );

  // Categorized products
  const undercutProducts = useMemo(
    () => tenantProducts.filter((p) => p.marketPosition === 'expensive'),
    [tenantProducts]
  );

  const cheapestProducts = useMemo(
    () => tenantProducts.filter((p) => p.marketPosition === 'cheapest'),
    [tenantProducts]
  );

  const competitiveProducts = useMemo(
    () => tenantProducts.filter((p) => p.marketPosition === 'competitive'),
    [tenantProducts]
  );

  const stockoutProducts = useMemo(
    () =>
      tenantProducts.filter((p) => {
        const prodMatches = tenantMatches.filter((m) => m.productId === p.id);
        return prodMatches.some((m) => m.stockStatus === 'out_of_stock');
      }),
    [tenantProducts, tenantMatches]
  );

  const outOfStockCompetitorMatches = useMemo(
    () => tenantMatches.filter((m) => m.stockStatus === 'out_of_stock'),
    [tenantMatches]
  );

  const recentCriticalAlerts = useMemo(
    () => tenantAlerts.filter((a) => a.severity === 'critical' || a.severity === 'warning'),
    [tenantAlerts]
  );

  // Distribution percentages
  const totalProducts = tenantProducts.length;
  const undercutPct = totalProducts > 0 ? Math.round((undercutProducts.length / totalProducts) * 100) : 0;
  const cheapestPct = totalProducts > 0 ? Math.round((cheapestProducts.length / totalProducts) * 100) : 0;
  const competitivePct = totalProducts > 0 ? Math.round((competitiveProducts.length / totalProducts) * 100) : 0;
  const unmatchedCount = Math.max(0, totalProducts - undercutProducts.length - cheapestProducts.length - competitiveProducts.length);
  const unmatchedPct = totalProducts > 0 ? Math.max(0, 100 - undercutPct - cheapestPct - competitivePct) : 0;

  // Filtered and searched products
  const filteredProducts = useMemo(() => {
    let result = tenantProducts;

    if (activeFilter === 'undercut') {
      result = undercutProducts;
    } else if (activeFilter === 'cheapest') {
      result = cheapestProducts;
    } else if (activeFilter === 'competitive') {
      result = competitiveProducts;
    } else if (activeFilter === 'stockout') {
      result = stockoutProducts;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tenantProducts, activeFilter, undercutProducts, cheapestProducts, competitiveProducts, stockoutProducts, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleQuickReprice = (productId: string, newPrice: number, productName: string) => {
    applyReprice(productId, newPrice);
    setRecentlyMatchedId(productId);
    setRepricedNotice(`Updated ${productName} to ${currentTenant.currencySymbol}${newPrice.toFixed(2)}`);
    setTimeout(() => {
      setRepricedNotice(null);
      setRecentlyMatchedId(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Refined Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/40 border border-white/[0.08] p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-clean-blue text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Automated 2x/Day Scheduler Active
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {currentTenant.name} Price Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitoring <strong className="text-white font-semibold">{totalProducts} SKUs</strong> across{' '}
              <strong className="text-white font-semibold">{tenantCompetitors.length} competitor channels</strong>.
              Automated crawls run at <span className="text-blue-400 font-semibold">08:00 AM</span> and{' '}
              <span className="text-blue-400 font-semibold">08:00 PM</span> UTC daily.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenScanRunner}
              className="btn-primary-clean flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg transition-all transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" />
              Trigger Instant Scan
            </button>
            <button
              onClick={onOpenCsvModal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/[0.08] hover:border-white/20 text-slate-200 text-xs font-semibold transition-all hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Import CSV
            </button>
            <button
              onClick={onOpenAutoMatchModal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/[0.08] hover:border-white/20 text-slate-200 text-xs font-semibold transition-all hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Auto-Match URLs
            </button>
            <button
              onClick={onOpenAddProductModal}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/[0.08] hover:border-white/20 text-slate-300 text-xs font-medium transition-all hover:bg-slate-800 cursor-pointer whitespace-nowrap"
              title="Add Single Product"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              Add SKU
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Reprice Toast Notice */}
      {repricedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span>{repricedNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">Live in Catalog</span>
        </div>
      )}

      {/* 2. Interactive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total SKUs */}
        <div
          onClick={() => {
            setActiveFilter('all');
            setSearchQuery('');
          }}
          className={`p-5 rounded-2xl glass-card glass-card-hover space-y-2 cursor-pointer transition-all ${
            activeFilter === 'all' && !searchQuery ? 'ring-1 ring-blue-500/50 bg-blue-500/[0.04]' : ''
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Catalog SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white tracking-tight">{totalProducts}</span>
            <span className="text-[11px] text-slate-400 font-mono">
              / {currentTenant.skuLimit} limit
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>100% active in crawler</span>
          </div>
        </div>

        {/* Metric 2: Under-Cut SKUs */}
        <div
          onClick={() => {
            setActiveFilter('undercut');
            setSearchQuery('');
          }}
          className={`p-5 rounded-2xl glass-card glass-card-hover space-y-2 cursor-pointer transition-all ${
            activeFilter === 'undercut' ? 'ring-1 ring-rose-500/50 bg-rose-500/[0.04]' : ''
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Under-Cut SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400 tracking-tight">{undercutProducts.length}</span>
            <span className="text-[11px] text-rose-300 font-medium">
              {undercutPct}% of catalog
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Competitor priced lower</span>
          </div>
        </div>

        {/* Metric 3: Lowest Price Lead */}
        <div
          onClick={() => {
            setActiveFilter('cheapest');
            setSearchQuery('');
          }}
          className={`p-5 rounded-2xl glass-card glass-card-hover space-y-2 cursor-pointer transition-all ${
            activeFilter === 'cheapest' ? 'ring-1 ring-emerald-500/50 bg-emerald-500/[0.04]' : ''
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Price Leadership</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 tracking-tight">{cheapestProducts.length}</span>
            <span className="text-[11px] text-emerald-300 font-medium">
              {cheapestPct}% win rate
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cheapest in market</span>
          </div>
        </div>

        {/* Metric 4: Competitor Stockouts */}
        <div
          onClick={() => {
            setActiveFilter('stockout');
            setSearchQuery('');
          }}
          className={`p-5 rounded-2xl glass-card glass-card-hover space-y-2 cursor-pointer transition-all ${
            activeFilter === 'stockout' ? 'ring-1 ring-amber-500/50 bg-amber-500/[0.04]' : ''
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Arbitrage Targets</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {outOfStockCompetitorMatches.length}
            </span>
            <span className="text-[11px] text-amber-300 font-medium">Margin potential</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Competitor Out of Stock</span>
          </div>
        </div>
      </div>

      {/* 3. Market Price Position Visualizer Bar */}
      <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">Catalog Market Position Distribution</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Click segment to filter table
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3 rounded-full bg-slate-900/90 overflow-hidden flex p-0.5 border border-white/[0.06] shadow-inner gap-0.5">
          {cheapestPct > 0 && (
            <div
              onClick={() => setActiveFilter('cheapest')}
              title={`Cheapest in market: ${cheapestProducts.length} SKUs (${cheapestPct}%)`}
              style={{ width: `${cheapestPct}%` }}
              className="h-full bg-emerald-500 hover:bg-emerald-400 transition-all rounded-l-full cursor-pointer relative group"
            />
          )}
          {competitivePct > 0 && (
            <div
              onClick={() => setActiveFilter('competitive')}
              title={`Competitive / Parity: ${competitiveProducts.length} SKUs (${competitivePct}%)`}
              style={{ width: `${competitivePct}%` }}
              className="h-full bg-blue-500 hover:bg-blue-400 transition-all cursor-pointer"
            />
          )}
          {undercutPct > 0 && (
            <div
              onClick={() => setActiveFilter('undercut')}
              title={`Under-Cut by competitor: ${undercutProducts.length} SKUs (${undercutPct}%)`}
              style={{ width: `${undercutPct}%` }}
              className="h-full bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer"
            />
          )}
          {unmatchedPct > 0 && (
            <div
              title={`Unmatched: ${unmatchedCount} SKUs (${unmatchedPct}%)`}
              style={{ width: `${unmatchedPct}%` }}
              className="h-full bg-slate-700 hover:bg-slate-600 transition-all rounded-r-full cursor-pointer"
            />
          )}
        </div>

        {/* Legend Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
          <button
            onClick={() => setActiveFilter('cheapest')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'cheapest' ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Price Leader ({cheapestPct}%)</span>
          </button>
          <button
            onClick={() => setActiveFilter('competitive')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'competitive' ? 'text-blue-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Competitive ({competitivePct}%)</span>
          </button>
          <button
            onClick={() => setActiveFilter('undercut')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'undercut' ? 'text-rose-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Under-Cut ({undercutPct}%)</span>
          </button>
          <div className="flex items-center gap-1.5 text-slate-500 ml-auto">
            <span className="w-2 h-2 rounded-full bg-slate-700" />
            <span>Unmatched ({unmatchedPct}%)</span>
          </div>
        </div>
      </div>

      {/* 4. Main Grid: Competitor Price Intelligence Matrix + Right Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Competitor Price Intelligence Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl glass-card p-5 sm:p-6 space-y-5">
            {/* Header with Title and Search/Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Price Comparison Matrix</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-semibold border border-blue-500/20">
                    {filteredProducts.length} SKUs
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct price and stock comparison against matched competitor stores
                </p>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SKU or name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
                />
              </div>
            </div>

            {/* Filter Pills Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-white/[0.06] text-xs">
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({tenantProducts.length})
              </button>
              <button
                onClick={() => {
                  setActiveFilter('undercut');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'undercut'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Under-Cut ({undercutProducts.length})
              </button>
              <button
                onClick={() => {
                  setActiveFilter('cheapest');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'cheapest'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cheapest ({cheapestProducts.length})
              </button>
              <button
                onClick={() => {
                  setActiveFilter('competitive');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'competitive'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Competitive ({competitiveProducts.length})
              </button>
              <button
                onClick={() => {
                  setActiveFilter('stockout');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'stockout'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Competitor OOS ({stockoutProducts.length})
              </button>
            </div>

            {/* Table Container with guaranteed column widths and no awkward wrapping */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-slate-950/40">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4 min-w-[240px]">Product / SKU</th>
                    <th className="py-3 px-3 min-w-[100px]">Your Price</th>
                    <th className="py-3 px-3 min-w-[170px]">Competitor Lowest</th>
                    <th className="py-3 px-3 min-w-[140px]">Price Delta</th>
                    <th className="py-3 px-3 min-w-[120px]">Position</th>
                    <th className="py-3 px-4 min-w-[130px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-semibold text-slate-300">No products match this filter</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Try resetting the search or selecting another filter tab.
                        </p>
                        <button
                          onClick={() => {
                            setActiveFilter('all');
                            setSearchQuery('');
                          }}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-white/[0.08] cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => {
                      const prodMatches = tenantMatches.filter((m) => m.productId === product.id);
                      const lowestComp = prodMatches.reduce((min, cur) => {
                        return !min || cur.currentPrice < min.currentPrice ? cur : min;
                      }, null as any);

                      const delta = lowestComp ? Number((product.currentPrice - lowestComp.currentPrice).toFixed(2)) : 0;
                      const deltaPct = lowestComp
                        ? Number(((delta / lowestComp.currentPrice) * 100).toFixed(1))
                        : 0;

                      const isJustRepriced = recentlyMatchedId === product.id;

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* 1. Product info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-white/[0.08] flex items-center justify-center">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="max-w-[240px]">
                                <p className="font-semibold text-slate-100 truncate text-xs" title={product.name}>
                                  {product.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-white/[0.05]">
                                    {product.code}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {product.brand}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Your Price */}
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-100 whitespace-nowrap text-xs">
                              {currentTenant.currencySymbol}
                              {product.currentPrice.toFixed(2)}
                            </div>
                            {product.mrp && product.mrp > product.currentPrice && (
                              <div className="text-[10px] text-slate-500 line-through">
                                MRP {currentTenant.currencySymbol}{product.mrp.toFixed(2)}
                              </div>
                            )}
                          </td>

                          {/* 3. Competitor Lowest */}
                          <td className="py-3.5 px-3">
                            {product.isSearchingCompetitors || product.matchingStatus === 'searching' ? (
                              <div className="flex items-center gap-1.5 text-blue-400 py-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span className="text-[11px] font-medium animate-pulse">Searching stores...</span>
                              </div>
                            ) : lowestComp ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-100 whitespace-nowrap text-xs">
                                    {currentTenant.currencySymbol}
                                    {lowestComp.currentPrice.toFixed(2)}
                                  </span>
                                  {lowestComp.stockStatus === 'out_of_stock' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                                      OOS
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[160px]">
                                  <span className="truncate">{lowestComp.competitorName}</span>
                                  {lowestComp.competitorProductUrl && (
                                    <a
                                      href={lowestComp.competitorProductUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-slate-500 hover:text-blue-400 inline-flex items-center shrink-0"
                                      title="Open Competitor URL"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold">
                                    {prodMatches.length} stores found
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px] whitespace-nowrap">
                                Unmatched
                              </span>
                            )}
                          </td>

                          {/* 4. Price Delta */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {product.isSearchingCompetitors || product.matchingStatus === 'searching' ? (
                              <span className="text-[11px] text-blue-400/80 italic">Searching Google...</span>
                            ) : lowestComp ? (
                              <span
                                className={`inline-flex items-center gap-1 font-semibold text-xs ${
                                  delta > 0
                                    ? 'text-rose-400'
                                    : delta < 0
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {delta > 0 ? (
                                  <>
                                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      +{currentTenant.currencySymbol}
                                      {delta.toFixed(2)} (+{deltaPct.toFixed(1)}%)
                                    </span>
                                  </>
                                ) : delta < 0 ? (
                                  <>
                                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      -{currentTenant.currencySymbol}
                                      {Math.abs(delta).toFixed(2)} ({Math.abs(deltaPct).toFixed(1)}%)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Equal className="w-3.5 h-3.5 shrink-0" />
                                    <span>Parity ($0.00)</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          {/* 5. Market Position Badge */}
                          <td className="py-3.5 px-3">
                            {product.isSearchingCompetitors || product.matchingStatus === 'searching' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 whitespace-nowrap animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                Searching
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                  product.marketPosition === 'cheapest'
                                    ? 'badge-clean-emerald'
                                    : product.marketPosition === 'expensive'
                                    ? 'badge-clean-rose'
                                    : product.marketPosition === 'competitive'
                                    ? 'badge-clean-blue'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    product.marketPosition === 'cheapest'
                                      ? 'bg-emerald-400'
                                      : product.marketPosition === 'expensive'
                                      ? 'bg-rose-400'
                                      : product.marketPosition === 'competitive'
                                      ? 'bg-blue-400'
                                      : 'bg-slate-500'
                                  }`}
                                />
                                {product.marketPosition === 'expensive' ? 'Under-Cut' : product.marketPosition}
                              </span>
                            )}
                          </td>

                          {/* 6. Action Button */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {product.isSearchingCompetitors || product.matchingStatus === 'searching' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold text-[11px] border border-blue-500/20">
                                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                                In Background
                              </span>
                            ) : isJustRepriced ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30">
                                <Check className="w-3 h-3" /> Matched
                              </span>
                            ) : lowestComp && product.marketPosition === 'expensive' ? (
                              <button
                                onClick={() => handleQuickReprice(product.id, lowestComp.currentPrice, product.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                title={`Match competitor price of ${currentTenant.currencySymbol}${lowestComp.currentPrice.toFixed(2)}`}
                              >
                                <Zap className="w-3 h-3" />
                                Match {currentTenant.currencySymbol}
                                {lowestComp.currentPrice.toFixed(2)}
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveTab('products')}
                                className="text-slate-400 hover:text-slate-200 text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                Details
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination & Catalog Redirect */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
              <div className="text-slate-400 text-xs">
                Showing{' '}
                <span className="font-semibold text-slate-200">
                  {filteredProducts.length === 0 ? 0 : startIndex + 1}–
                  {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-200">{filteredProducts.length}</span> SKUs
                {filteredProducts.length < totalProducts && (
                  <span className="text-slate-500 ml-1">
                    (filtered from {totalProducts} total)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs text-slate-400 font-medium">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('products')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white font-medium text-xs transition-all cursor-pointer"
                >
                  View All in Catalog
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Twice a Day Scheduler & Alerts Feed */}
        <div className="space-y-4">
          {/* Scheduled Status Widget */}
          <div className="rounded-3xl glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                2x/Day Scheduler
              </span>
              <span className="badge-clean-emerald text-[9px] font-bold px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Morning Slot */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200 block text-xs">Morning Scan (08:00 AM)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Completed today • {tenantCompetitors.length} stores crawled</span>
                </div>
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Synced
                </span>
              </div>

              {/* Evening Slot */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">Evening Scan (08:00 PM)</span>
                  <span className="text-[11px] text-slate-400">Next automated interval</span>
                </div>
                <span className="text-blue-400 font-bold text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  Queued
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-white/[0.06]">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-slate-500" />
                Next run in ~4h 15m
              </span>
              <button
                onClick={onOpenScanRunner}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Run Scan Now →
              </button>
            </div>
          </div>

          {/* Actionable Alerts Feed */}
          <div className="rounded-3xl glass-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Price Intelligence Alerts
              </span>
              <button
                onClick={() => setActiveTab('alerts')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                View all ({tenantAlerts.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {recentCriticalAlerts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 opacity-70" />
                  No critical price alerts right now
                </div>
              ) : (
                recentCriticalAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-xs space-y-2 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{alert.competitorName}</span>
                      <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        {alert.priceDiffPercent < 0 ? `${Math.abs(alert.priceDiffPercent)}% Drop` : 'Shift'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{alert.message}</p>
                    {alert.productId !== 'system' && alert.newPrice > 0 && (
                      <div className="pt-1 flex items-center justify-between border-t border-white/[0.04]">
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {alert.productSku}</span>
                        <button
                          onClick={() => handleQuickReprice(alert.productId, alert.newPrice, alert.productName)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          Match {currentTenant.currencySymbol}
                          {alert.newPrice.toFixed(2)} →
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Competitor Channel Coverage */}
          <div className="rounded-3xl glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                Tracked Channels
              </span>
              <button
                onClick={() => setActiveTab('competitors')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                Manage ({tenantCompetitors.length})
              </button>
            </div>

            <div className="space-y-2">
              {tenantCompetitors.slice(0, 4).map((comp) => {
                const compMatches = tenantMatches.filter((m) => m.competitorId === comp.id);
                return (
                  <div
                    key={comp.id}
                    className="p-2.5 rounded-xl bg-slate-950/40 border border-white/[0.05] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-medium text-slate-200">{comp.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {compMatches.length} URLs mapped
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
