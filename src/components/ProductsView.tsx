'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Product, CompetitorProductMatch } from '@/types';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Sparkles,
  Trash2,
  Edit2,
  Crosshair,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Package,
  Layers,
  Zap,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';

interface ProductsViewProps {
  onOpenAddModal: () => void;
  onOpenCsvModal: () => void;
  onOpenCandidateMatcher: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onOpenAddModal,
  onOpenCsvModal,
  onOpenCandidateMatcher,
}) => {
  const {
    products,
    currentTenant,
    matches,
    deleteProduct,
    bulkDeleteProducts,
    clearAllProducts,
    updateProduct,
    generateLargeDemoCatalog,
    bulkAutoMatchProducts,
  } = useApp();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [matchingStatusFilter, setMatchingStatusFilter] = useState('all');
  const [densityMode, setDensityMode] = useState<'comfortable' | 'compact'>('comfortable');

  // Multi-Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Pagination State (Designed for thousands of items)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  // Server-Side Paginated Engine (Enables 10,000+ SKUs with 60 FPS zero browser lag)
  const [serverData, setServerData] = useState<{
    products: Product[];
    total: number;
    totalPages: number;
    stats: {
      total: number;
      fullyMatched: number;
      partiallyMatched: number;
      underCut: number;
    };
    categories: string[];
  } | null>(null);
  const [serverMatches, setServerMatches] = useState<CompetitorProductMatch[]>([]);
  const [isLoadingServerData, setIsLoadingServerData] = useState(false);

  // Debounced server fetch when pagination or filters change
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingServerData(true);

    const timer = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({
          tenantId: currentTenant.id,
          page: String(currentPage),
          pageSize: String(pageSize),
        });
        if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
        if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
        if (positionFilter !== 'all') queryParams.set('marketPosition', positionFilter);
        if (matchingStatusFilter !== 'all') queryParams.set('matchingStatus', matchingStatusFilter);

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        const data = await res.json();

        if (!isCancelled && data.success && data.pagination) {
          setServerData({
            products: data.products,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
            stats: data.stats,
            categories: data.categories || [],
          });

          // Fetch matches for the returned product IDs on this active page
          const productIds = (data.products || []).map((p: Product) => p.id);
          if (productIds.length > 0) {
            const mRes = await fetch(`/api/matches?tenantId=${currentTenant.id}&productIds=${productIds.join(',')}`);
            const mData = await mRes.json();
            if (!isCancelled && mData.success && Array.isArray(mData.matches)) {
              setServerMatches(mData.matches);
            }
          } else {
            setServerMatches([]);
          }
        }
      } catch (err) {
        console.warn('Server pagination fetch failed, running with local data:', err);
      } finally {
        if (!isCancelled) setIsLoadingServerData(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    currentTenant.id,
    currentPage,
    pageSize,
    searchQuery,
    categoryFilter,
    positionFilter,
    matchingStatusFilter,
  ]);

  const tenantProducts = useMemo(
    () => products.filter((p) => p.tenantId === currentTenant.id),
    [products, currentTenant.id]
  );

  const categories = useMemo(
    () => Array.from(new Set(tenantProducts.map((p) => p.category))),
    [tenantProducts]
  );

  const displayCategories = serverData && serverData.categories.length > 0 ? serverData.categories : categories;

  // Filtered dataset (Local fallback if server pagination is unconfigured)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return tenantProducts.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesPos = positionFilter === 'all' || p.marketPosition === positionFilter;

      let matchesMatchStatus = true;
      if (matchingStatusFilter === 'fully_matched') {
        matchesMatchStatus = p.matchingStatus === 'fully_matched';
      } else if (matchingStatusFilter === 'needs_review') {
        matchesMatchStatus = p.matchingStatus === 'partially_matched';
      } else if (matchingStatusFilter === 'unmatched') {
        matchesMatchStatus = p.matchesCount === 0 || p.matchingStatus === 'unmatched';
      }

      return matchesSearch && matchesCat && matchesPos && matchesMatchStatus;
    });
  }, [tenantProducts, searchQuery, categoryFilter, positionFilter, matchingStatusFilter]);

  // Scalable pagination math (Priority to indexed PostgreSQL engine)
  const totalItems = serverData ? serverData.total : filteredProducts.length;
  const totalPages = serverData ? serverData.totalPages : Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    if (serverData && serverData.products) {
      return serverData.products;
    }
    const start = (validCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [serverData, filteredProducts, validCurrentPage, pageSize]);

  // Scalable catalog high-level stats (Directly from database aggregates)
  const fullyMatchedCount = serverData
    ? serverData.stats.fullyMatched
    : tenantProducts.filter((p) => p.matchingStatus === 'fully_matched').length;
  const needsReviewCount = serverData
    ? serverData.stats.partiallyMatched
    : tenantProducts.filter((p) => p.matchingStatus === 'partially_matched').length;
  const undercutCount = serverData
    ? serverData.stats.underCut
    : tenantProducts.filter((p) => p.marketPosition === 'expensive').length;

  // Multi-selection handlers
  const handleToggleSelectAllPage = () => {
    const pageIds = paginatedProducts.map((p) => p.id);
    const allSelected = pageIds.every((id) => selectedProductIds.includes(id));

    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAutoMatch = async () => {
    if (selectedProductIds.length === 0) return;
    setIsBulkProcessing(true);
    await bulkAutoMatchProducts(selectedProductIds);
    setIsBulkProcessing(false);
    setSelectedProductIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    bulkDeleteProducts(selectedProductIds);
    setSelectedProductIds([]);
  };

  const handleExportCsv = () => {
    const exportTargets =
      selectedProductIds.length > 0
        ? tenantProducts.filter((p) => selectedProductIds.includes(p.id))
        : filteredProducts;

    const headers = ['name', 'brand', 'code', 'category', 'mrp', 'currentPrice', 'costPrice', 'stockStatus'];
    const rows = exportTargets.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      `"${p.code}"`,
      `"${p.category}"`,
      p.mrp,
      p.currentPrice,
      p.costPrice,
      p.stockStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTenant.slug}-catalog-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEditPrice = (product: Product) => {
    setEditingId(product.id);
    setEditPrice(product.currentPrice.toString());
  };

  const saveEditPrice = (productId: string) => {
    const newPrice = parseFloat(editPrice);
    if (!isNaN(newPrice) && newPrice > 0) {
      updateProduct(productId, { currentPrice: newPrice });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Header & Fast Volume Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Catalog & SKU Management
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/[0.08]">
              {tenantProducts.length.toLocaleString()} Total SKUs
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimized for enterprise multi-thousand SKU catalogs with automated candidate title matching
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Demo Data Generator to test thousands of products */}
          {tenantProducts.length < 50 && (
            <button
              onClick={() => generateLargeDemoCatalog(600)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 text-xs font-semibold transition-all cursor-pointer"
              title="Populate 600+ realistic products to test high-volume performance"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Generate 600+ SKUs Demo
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/[0.08] hover:border-white/20 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export ({selectedProductIds.length > 0 ? selectedProductIds.length : totalItems})
          </button>

          <button
            onClick={onOpenCsvModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Bulk CSV Upload
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn-primary-clean flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>

          {tenantProducts.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to remove all product data?')) {
                  clearAllProducts();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold transition-colors cursor-pointer"
              title="Remove all products from this catalog"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* High-Volume Catalog Health Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Total Catalog SKUs
            </span>
            <span className="text-lg font-black text-white">{tenantProducts.length.toLocaleString()}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Fully Matched
            </span>
            <span className="text-lg font-black text-emerald-400">{fullyMatchedCount.toLocaleString()}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Pending URL Selection
            </span>
            <span className="text-lg font-black text-purple-400">{needsReviewCount.toLocaleString()}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Competitor Under-Cut
            </span>
            <span className="text-lg font-black text-rose-400">{undercutCount.toLocaleString()}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Multi-Faceted Toolbar (Search, Filter, Density, Page Size) */}
      <div className="p-3.5 rounded-2xl glass-card flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search thousands of titles, SKUs, brands..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/[0.08] text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories ({displayCategories.length})</option>
            {displayCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* URL Matching Status Filter */}
          <select
            value={matchingStatusFilter}
            onChange={(e) => {
              setMatchingStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/[0.08] text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All URL Match Statuses</option>
            <option value="fully_matched">Fully Matched URLs (3+ Stores)</option>
            <option value="needs_review">Needs Candidate Review (&lt; 3)</option>
            <option value="unmatched">Unmatched (0 URLs)</option>
          </select>

          {/* Market Position Filter */}
          <select
            value={positionFilter}
            onChange={(e) => {
              setPositionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/[0.08] text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Price Positions</option>
            <option value="cheapest">Lowest Price Lead</option>
            <option value="expensive">Competitor Under-Cut</option>
            <option value="competitive">Competitive</option>
          </select>

          {/* View Density Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-950/70 border border-white/[0.08] p-0.5">
            <button
              onClick={() => setDensityMode('comfortable')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                densityMode === 'comfortable' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comfortable
            </button>
            <button
              onClick={() => setDensityMode('compact')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                densityMode === 'compact' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Dock when items are selected */}
      {selectedProductIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-blue-950/90 border border-blue-500/40 shadow-2xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white bg-blue-600 px-2 py-0.5 rounded-md">
              {selectedProductIds.length}
            </span>
            <span className="text-slate-200 font-medium">SKUs selected across table</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkAutoMatch}
              disabled={isBulkProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isBulkProcessing ? 'Auto-Matching...' : 'Auto-Match Selected'}
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              className="px-2 py-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="rounded-3xl glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-white/[0.06] text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-3 pl-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every((p) => selectedProductIds.includes(p.id))
                    }
                    onChange={handleToggleSelectAllPage}
                    className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3">Product Name & SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">MRP</th>
                <th className="p-3">Your Price</th>
                <th className="p-3">Lowest Competitor</th>
                <th className="p-3">Position</th>
                <th className="p-3">Monitored Stores</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner">
                        <Package className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-200">
                          {tenantProducts.length === 0 ? 'Catalog is Empty' : 'No Matching Products'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {tenantProducts.length === 0
                            ? 'All product data has been removed. Upload your product catalog via CSV or add single SKUs to start monitoring competitor prices.'
                            : 'No products matched your search or filters.'}
                        </p>
                      </div>
                      {tenantProducts.length === 0 ? (
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={onOpenCsvModal}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            Import CSV
                          </button>
                          <button
                            onClick={onOpenAddModal}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/[0.08] transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            Add SKU Manually
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('all');
                            setPositionFilter('all');
                            setMatchingStatusFilter('all');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 border border-white/[0.08] cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const activeMatchList = serverMatches.length > 0 ? serverMatches : matches;
                  const prodMatches = activeMatchList.filter(
                    (m) => m.productId === product.id && m.status === 'confirmed'
                  );
                  const isSearching = (product.isSearchingCompetitors || product.matchingStatus === 'searching') && prodMatches.length === 0;
                  const lowestComp = prodMatches.reduce((min, cur) => {
                    return !min || cur.currentPrice < min.currentPrice ? cur : min;
                  }, null as any);

                  const marginPct = Math.round(
                    ((product.currentPrice - product.costPrice) / product.currentPrice) * 100
                  );

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors group ${
                        isSelected ? 'bg-blue-600/[0.08]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(product.id)}
                          className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Title & SKU */}
                      <td className={densityMode === 'compact' ? 'py-2 px-3' : 'py-3.5 px-3'}>
                        <div className="flex items-center gap-3">
                          {densityMode === 'comfortable' && (
                            <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-white/[0.08]">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="max-w-[260px]">
                            <p className="font-semibold text-slate-100 truncate text-xs">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.2 rounded">
                                {product.code}
                              </span>
                              <span className="text-[10px] text-slate-400">{product.brand}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 text-slate-400">{product.category}</td>

                      {/* MRP */}
                      <td className="p-3 font-semibold text-slate-300">
                        {currentTenant.currencySymbol}
                        {product.mrp.toFixed(2)}
                      </td>

                      {/* Current Selling Price */}
                      <td className="p-3">
                        {editingId === product.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-blue-500 text-xs font-bold text-emerald-400 focus:outline-none"
                            />
                            <button
                              onClick={() => saveEditPrice(product.id)}
                              className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditPrice(product)}
                            className="inline-flex items-center gap-1.5 cursor-pointer hover:text-blue-400 transition-colors"
                            title="Click to edit selling price"
                          >
                            <span className="font-bold text-slate-100">
                              {currentTenant.currencySymbol}
                              {product.currentPrice.toFixed(2)}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* Lowest Competitor */}
                      <td className="p-3">
                        {isSearching ? (
                          <div className="flex items-center gap-1.5 text-blue-400 py-1">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                            <span className="text-[11px] font-medium animate-pulse">Scanning stores...</span>
                          </div>
                        ) : lowestComp ? (
                          <div>
                            <span className="font-bold text-slate-200">
                              {currentTenant.currencySymbol}
                              {lowestComp.currentPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              on {lowestComp.competitorName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unmatched</span>
                        )}
                      </td>

                      {/* Market Position */}
                      <td className="p-3">
                        {isSearching ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 w-fit animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                            <span>Searching</span>
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              product.marketPosition === 'cheapest'
                                ? 'badge-clean-emerald'
                                : product.marketPosition === 'expensive'
                                ? 'badge-clean-rose'
                                : product.marketPosition === 'competitive'
                                ? 'badge-clean-blue'
                                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                            }`}
                          >
                            {product.marketPosition === 'expensive' ? 'Under-Cut' : product.marketPosition}
                          </span>
                        )}
                      </td>

                      {/* Monitored Competitors Count with URL Matcher trigger */}
                      <td className="p-3">
                        {isSearching ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 animate-pulse max-w-[220px]">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold block text-[11px] text-blue-200 leading-tight">
                                Searching in background...
                              </span>
                              <span className="text-[10px] text-blue-400/80 truncate block">
                                Scanning Google & stores
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => onOpenCandidateMatcher(product)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shadow-sm ${
                                prodMatches.length >= 3
                                  ? 'badge-clean-emerald hover:opacity-90'
                                  : prodMatches.length > 0
                                  ? 'badge-clean-purple hover:opacity-90'
                                  : 'bg-slate-800/80 text-amber-300 border border-amber-500/30 hover:border-amber-500'
                              }`}
                              title="Click to review candidate URLs and select which to monitor"
                            >
                              {prodMatches.length > 0 ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>{prodMatches.length} Competitors Found</span>
                                </>
                              ) : (
                                <>
                                  <Crosshair className="w-3 h-3" />
                                  <span>0 Found · Match Manually →</span>
                                </>
                              )}
                            </button>

                            {/* Show searched competitors and their prices */}
                            {prodMatches.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {prodMatches.map((m) => (
                                  <span
                                    key={m.id}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-white/[0.08] flex items-center gap-1 font-medium hover:border-white/20 transition-colors"
                                    title={`${m.competitorName}: ${currentTenant.currencySymbol}${m.currentPrice.toFixed(2)}`}
                                  >
                                    <span>{m.platform === 'amazon' ? '🛒' : m.channelType === 'brand_official' ? '🏷️' : '🛍️'}</span>
                                    <span className="truncate max-w-[75px]">{m.competitorName}</span>
                                    <span className="text-[9px] text-emerald-400 font-mono font-semibold">
                                      {currentTenant.currencySymbol}{m.currentPrice.toFixed(0)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSearching ? (
                            <button
                              disabled
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 opacity-80 cursor-wait flex items-center gap-1.5"
                            >
                              <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                              <span>Searching...</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenCandidateMatcher(product)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 transition-colors cursor-pointer flex items-center gap-1"
                              title="Find & Select Competitor URLs by Title"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Match URLs</span>
                            </button>
                          )}
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* High-Performance Pagination Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-white">
                {totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-white">
                {Math.min(validCurrentPage * pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-white">{totalItems.toLocaleString()}</strong> items
            </span>

            <span className="hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-white/[0.08] text-xs text-slate-200 cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={validCurrentPage <= 1}
              className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/[0.08] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-300 px-2 font-mono">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/[0.08] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
