'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Tenant,
  Product,
  Competitor,
  CompetitorProductMatch,
  AlertRule,
  AlertNotification,
  ScanJob,
  SubscriptionPlan,
  PlanTier,
  CandidateMatchOption,
  CompetitorCandidateGroup,
  BackgroundJob,
} from '@/types';
import {
  INITIAL_TENANTS,
  INITIAL_PLANS,
  INITIAL_COMPETITORS,
  INITIAL_PRODUCTS,
  INITIAL_MATCHES,
  INITIAL_ALERT_RULES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SCAN_JOBS,
} from '@/data/mockData';

interface AppContextType {
  tenants: Tenant[];
  currentTenant: Tenant;
  isSuperAdmin: boolean;
  activeTab: string;
  products: Product[];
  competitors: Competitor[];
  matches: CompetitorProductMatch[];
  alertRules: AlertRule[];
  notifications: AlertNotification[];
  scanJobs: ScanJob[];
  plans: SubscriptionPlan[];
  isScanning: boolean;
  scanProgress: { percent: number; message: string; activeItem?: string };
  backendConnected: boolean;
  backgroundJobs: BackgroundJob[];
  activeBackgroundJob: BackgroundJob | null;
  queueMetrics: {
    queueDepth: number;
    activeWorkers: number;
    maxConcurrency: number;
    serverLoadStatus: string;
  };
  triggerBackgroundScan: (batchType?: string) => Promise<string>;
  cancelBackgroundJob: (jobId: string) => Promise<void>;

  // Setters & Actions
  setCurrentTenantId: (id: string) => void;
  setIsSuperAdmin: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'matchesCount' | 'marketPosition'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkDeleteProducts: (ids: string[]) => Promise<void>;
  clearAllProducts: () => Promise<void>;
  importProductsFromCsv: (csvRows: Array<{ name: string; brand?: string; code: string; mrp: number; currentPrice?: number; costPrice?: number; category?: string; productUrl?: string }>) => Promise<{ count: number; importedProducts: Product[] }>;
  generateLargeDemoCatalog: (count?: number) => void;
  addCompetitor: (competitor: Omit<Competitor, 'id' | 'tenantId' | 'monitoredProductsCount' | 'avgPriceDiffPercent' | 'lastScrapedAt'>) => Promise<Competitor>;
  deleteCompetitor: (id: string) => Promise<void>;
  
  // Title candidate matching & URL selection
  generateCompetitorCandidates: (productId: string) => Promise<CompetitorCandidateGroup[]>;
  saveSelectedCandidateMatches: (productId: string, groups: CompetitorCandidateGroup[]) => Promise<void>;
  bulkAutoMatchProducts: (productIds: string[]) => Promise<number>;
  autoMatchProductByTitle: (productId: string) => Promise<CompetitorProductMatch[]>;
  autoMatchAllProducts: () => Promise<number>;
  
  confirmMatch: (matchId: string) => void;
  rejectMatch: (matchId: string) => void;
  addManualMatch: (productId: string, competitorId: string, competitorProductTitle: string, competitorProductUrl: string, price: number, stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  runInstantScan: () => Promise<ScanJob>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  applyReprice: (productId: string, newPrice: number) => Promise<void>;
  addAlertRule: (rule: Omit<AlertRule, 'id' | 'tenantId' | 'timesTriggered' | 'createdAt'>) => void;
  toggleAlertRule: (ruleId: string) => void;
  deleteAlertRule: (ruleId: string) => void;
  registerBrandTenant: (tenantData: { name: string; industry: string; contactEmail: string; planId: PlanTier; currency: string }) => Promise<Tenant>;
  updateTenantPlan: (tenantId: string, planId: PlanTier, status?: Tenant['planStatus']) => void;
  updatePlanDetails: (planId: PlanTier, updates: Partial<SubscriptionPlan>) => void;
  refreshBackendData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-apex');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [matches, setMatches] = useState<CompetitorProductMatch[]>(INITIAL_MATCHES);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(INITIAL_ALERT_RULES);
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [scanJobs, setScanJobs] = useState<ScanJob[]>(INITIAL_SCAN_JOBS);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);

  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ percent: number; message: string; activeItem?: string }>({
    percent: 0,
    message: '',
  });

  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<{
    queueDepth: number;
    activeWorkers: number;
    maxConcurrency: number;
    serverLoadStatus: string;
  }>({
    queueDepth: 0,
    activeWorkers: 0,
    maxConcurrency: 2,
    serverLoadStatus: 'optimal',
  });

  const currentTenant = tenants.find((t) => t.id === currentTenantId) || tenants[0];
  const activeBackgroundJob = backgroundJobs.find((j) => j.status === 'processing' || j.status === 'queued') || null;

  // Helper: recalculate product market positions and lowest prices locally for instant responsiveness
  const recalculateProductPositions = useCallback(
    (currentProducts: Product[], currentMatches: CompetitorProductMatch[]): Product[] => {
      const tenantComps = competitors.filter((c) => c.tenantId === currentTenant.id && c.status === 'active');
      const compCount = Math.max(1, tenantComps.length);

      return currentProducts.map((p) => {
        const prodMatches = currentMatches.filter((m) => m.productId === p.id && m.status === 'confirmed');
        if (prodMatches.length === 0) {
          return {
            ...p,
            matchesCount: 0,
            marketPosition: 'unmatched',
            matchingStatus: 'unmatched',
            lowestCompetitorPrice: undefined,
            averageCompetitorPrice: undefined,
          };
        }

        const prices = prodMatches.map((m) => m.currentPrice);
        const lowest = Math.min(...prices);
        const avg = Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2));

        let pos: Product['marketPosition'] = 'competitive';
        if (p.currentPrice < lowest) {
          pos = 'cheapest';
        } else if (p.currentPrice > lowest) {
          pos = 'expensive';
        }

        const matchStatus: Product['matchingStatus'] =
          prodMatches.length >= compCount ? 'fully_matched' : 'partially_matched';

        return {
          ...p,
          matchesCount: prodMatches.length,
          marketPosition: pos,
          matchingStatus: matchStatus,
          lowestCompetitorPrice: lowest,
          averageCompetitorPrice: avg,
        };
      });
    },
    [competitors, currentTenant.id]
  );

  // Fetch full live database state from backend API
  const refreshBackendData = useCallback(async () => {
    try {
      const [prodRes, compRes, matchRes, alertRes, scanRes, tenantRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()).catch(() => null),
        fetch('/api/competitors').then((r) => r.json()).catch(() => null),
        fetch('/api/matches').then((r) => r.json()).catch(() => null),
        fetch('/api/alerts').then((r) => r.json()).catch(() => null),
        fetch('/api/scans').then((r) => r.json()).catch(() => null),
        fetch('/api/tenants').then((r) => r.json()).catch(() => null),
      ]);

      if (prodRes?.success && Array.isArray(prodRes.products)) {
        setProducts(prodRes.products);
      }
      if (compRes?.success && Array.isArray(compRes.competitors)) {
        setCompetitors(compRes.competitors);
      }
      if (matchRes?.success && Array.isArray(matchRes.matches)) {
        setMatches(matchRes.matches);
      }
      if (alertRes?.success && Array.isArray(alertRes.notifications)) {
        setNotifications(alertRes.notifications);
      }
      if (scanRes?.success && Array.isArray(scanRes.scans)) {
        setScanJobs(scanRes.scans);
      }
      if (tenantRes?.success && Array.isArray(tenantRes.tenants) && tenantRes.tenants.length > 0) {
        setTenants(tenantRes.tenants);
      }
      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend sync failed, running in resilient mode:', err);
      setBackendConnected(false);
    }
  }, []);

  // Sync live database on mount
  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // Sync background jobs queue periodically
  const fetchBackgroundJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs?tenantId=${currentTenant.id}`);
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.jobs)) setBackgroundJobs(data.jobs);
        if (data.metrics) setQueueMetrics(data.metrics);
      }
    } catch {
      // background polling quiet fail
    }
  }, [currentTenant.id]);

  useEffect(() => {
    fetchBackgroundJobs();
    const interval = setInterval(fetchBackgroundJobs, 2000);
    return () => clearInterval(interval);
  }, [fetchBackgroundJobs]);

  // Background Trigger Action
  const triggerBackgroundScan = async (batchType: string = 'manual_instant'): Promise<string> => {
    try {
      const res = await fetch('/api/jobs/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          type: 'daily_scan',
          title: `Daily Crawl Sweep (${batchType === 'manual_instant' ? 'Instant Sweep' : 'Scheduled'})`,
          payload: { tenantId: currentTenant.id, batchType },
        }),
      });
      const data = await res.json();
      if (data.success && data.jobId) {
        await fetchBackgroundJobs();
        return data.jobId;
      }
    } catch (err) {
      console.error('Failed enqueueing background scan:', err);
    }
    return '';
  };

  const cancelBackgroundJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      await fetchBackgroundJobs();
    } catch (err) {
      console.error('Failed canceling background job:', err);
    }
  };

  // 1. Add Product with Backend Persistence
  const addProduct = async (
    data: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'matchesCount' | 'marketPosition'>
  ): Promise<Product> => {
    const tempId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const optimisticProduct: Product = {
      ...data,
      id: tempId,
      tenantId: currentTenant.id,
      createdAt: new Date().toISOString().split('T')[0],
      matchesCount: 0,
      marketPosition: 'unmatched',
      matchingStatus: 'unmatched',
    };

    setProducts((prev) => [optimisticProduct, ...prev]);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tenantId: currentTenant.id }),
      });
      const json = await res.json();
      if (json.success && json.product) {
        setProducts((prev) => prev.map((p) => (p.id === tempId ? json.product : p)));
        return json.product;
      }
    } catch (err) {
      console.error('Failed to save product to backend:', err);
    }

    return optimisticProduct;
  };

  // 2. Update Product with Backend Persistence
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      recalculateProductPositions(
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        matches
      )
    );

    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed updating product on backend:', err);
    }
  };

  // 3. Delete Product with Backend Persistence
  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setMatches((prev) => prev.filter((m) => m.productId !== id));

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed deleting product on backend:', err);
    }
  };

  const bulkDeleteProducts = async (ids: string[]) => {
    const idSet = new Set(ids);
    setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
    setMatches((prev) => prev.filter((m) => !idSet.has(m.productId)));

    await Promise.allSettled(ids.map((id) => fetch(`/api/products/${id}`, { method: 'DELETE' })));
  };

  const clearAllProducts = async () => {
    setProducts([]);
    setMatches([]);
    setNotifications([]);
    setCompetitors((prev) =>
      prev.map((c) => ({ ...c, monitoredProductsCount: 0, avgPriceDiffPercent: 0 }))
    );

    try {
      await fetch('/api/products?all=true', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed clearing products on backend:', err);
    }
  };

  // 4. Bulk CSV Import with Backend API
  const importProductsFromCsv = async (
    csvRows: Array<{
      name: string;
      brand?: string;
      code: string;
      mrp: number;
      currentPrice?: number;
      costPrice?: number;
      category?: string;
      productUrl?: string;
    }>
  ): Promise<{ count: number; importedProducts: Product[] }> => {
    try {
      const res = await fetch('/api/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: currentTenant.id, rows: csvRows }),
      });
      const data = await res.json();
      if (data.success && data.importedProducts) {
        setProducts((prev) => [...data.importedProducts, ...prev]);
        return { count: data.count, importedProducts: data.importedProducts };
      }
    } catch (err) {
      console.error('Backend CSV import failed, falling back to local:', err);
    }

    // Fallback local import
    const fallbackProducts: Product[] = csvRows.map((row, idx) => ({
      id: `prod-csv-${Date.now()}-${idx}`,
      tenantId: currentTenant.id,
      name: row.name,
      brand: row.brand || currentTenant.name,
      code: row.code || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: row.category || 'General',
      mrp: Number(row.mrp) || 0,
      currentPrice: Number(row.currentPrice) || Number(row.mrp) || 0,
      costPrice: Number(row.costPrice) || Math.round((Number(row.mrp) || 100) * 0.5),
      minMarginPercent: 30,
      stockStatus: 'in_stock',
      stockCount: 50,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      productUrl: row.productUrl || '',
      createdAt: new Date().toISOString().split('T')[0],
      matchesCount: 0,
      marketPosition: 'unmatched',
      matchingStatus: 'unmatched',
    }));

    setProducts((prev) => [...fallbackProducts, ...prev]);
    return { count: fallbackProducts.length, importedProducts: fallbackProducts };
  };

  // 5. Generate Large Demo Catalog (to test high volumes)
  const generateLargeDemoCatalog = (count: number = 600) => {
    const categories = ['Footwear', 'Apparel', 'Accessories', 'Outerwear', 'Gear', 'Electronics'];
    const items = [
      'Pro Runner Carbon',
      'Ultra Mesh Singlet',
      'Aero Hydration Pack',
      'StormShield Wind Jacket',
      'Seamless Compression Tights',
      'Flex Cross-Trainer',
      'Thermal Quarter Zip',
      'Reflective Night Vest',
      'Grip Strength Trainer',
      'Polarized Sport Sunglasses',
      'Recovery Massage Gun',
      'Ergonomic Water Bottle',
      'Trail Stride Sock 3-Pack',
      'Speed Interval Timer',
      'Endurance Energy Flask',
      'Power Elastic Resistance Band',
    ];

    const generated: Product[] = [];
    for (let i = 1; i <= count; i++) {
      const baseName = items[i % items.length];
      const category = categories[i % categories.length];
      const mrp = Number((40 + (i % 25) * 8 + Math.random() * 5).toFixed(2));
      const currentPrice = Number((mrp * (0.85 + (i % 10) * 0.015)).toFixed(2));
      const costPrice = Number((mrp * 0.45).toFixed(2));
      const prodId = `prod-bulk-${Date.now()}-${i}`;
      const code = `APX-${category.substring(0, 3).toUpperCase()}-${1000 + i}`;

      generated.push({
        id: prodId,
        tenantId: currentTenant.id,
        name: `${baseName} Elite v${(i % 5) + 1}`,
        brand: currentTenant.name,
        code,
        category,
        mrp,
        currentPrice,
        costPrice,
        minMarginPercent: 25,
        stockStatus: i % 18 === 0 ? 'out_of_stock' : i % 7 === 0 ? 'low_stock' : 'in_stock',
        stockCount: Math.floor(10 + Math.random() * 120),
        imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-03-20',
        matchesCount: 0,
        marketPosition: 'unmatched',
        matchingStatus: 'unmatched',
      });
    }

    setProducts((prev) => [...generated, ...prev]);
  };

  // 6. CORE FEATURE: Google Competitor Search & Candidate Extraction via Backend
  const generateCompetitorCandidates = async (productId: string): Promise<CompetitorCandidateGroup[]> => {
    try {
      const res = await fetch('/api/search-competitor-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, tenantId: currentTenant.id }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.groups) && data.groups.length > 0) {
        return data.groups;
      }
    } catch (err) {
      console.warn('Backend search API failed, falling back to local crawler simulation:', err);
    }

    // Local fallback generator if backend search is offline
    const product = products.find((p) => p.id === productId);
    if (!product) return [];

    const tenantComps = competitors.filter((c) => c.tenantId === currentTenant.id && c.status === 'active');
    const groups: CompetitorCandidateGroup[] = [];

    for (const comp of tenantComps) {
      const cand1: CandidateMatchOption = {
        id: `cand-${comp.id}-1`,
        competitorId: comp.id,
        competitorName: comp.name,
        competitorDomain: comp.domain,
        competitorLogo: comp.logo,
        title: `${product.brand} ${product.name} (Official Listing)`,
        url: `${comp.baseUrl}/dp/${product.code}-01`,
        matchPercent: 97,
        price: Number((product.currentPrice * 0.94).toFixed(2)),
        currency: 'USD',
        stockStatus: 'in_stock',
        isRecommended: true,
      };

      const cand2: CandidateMatchOption = {
        id: `cand-${comp.id}-2`,
        competitorId: comp.id,
        competitorName: comp.name,
        competitorDomain: comp.domain,
        competitorLogo: comp.logo,
        title: `${product.name} Retail Bundle Package`,
        url: `${comp.baseUrl}/product/${product.code}-pack`,
        matchPercent: 88,
        price: Number((product.currentPrice * 0.98).toFixed(2)),
        currency: 'USD',
        stockStatus: 'in_stock',
        isRecommended: false,
      };

      groups.push({
        competitorId: comp.id,
        competitorName: comp.name,
        competitorDomain: comp.domain,
        competitorLogo: comp.logo,
        selectedCandidateId: cand1.id,
        customUrl: '',
        candidates: [cand1, cand2],
      });
    }

    return groups;
  };

  // 7. Save Selected Candidate Matches (Confirmed URLs to monitor)
  const saveSelectedCandidateMatches = async (
    productId: string,
    groups: CompetitorCandidateGroup[]
  ) => {
    // 1. Optimistic local update
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const otherMatches = matches.filter((m) => m.productId !== productId);
    const newConfirmedMatches: CompetitorProductMatch[] = [];

    for (const group of groups) {
      if (!group.selectedCandidateId) continue;

      let chosenCandidate = group.candidates.find((c) => c.id === group.selectedCandidateId);
      let chosenUrl = chosenCandidate?.url || group.customUrl || '';
      let chosenTitle = chosenCandidate?.title || product.name;
      let chosenPrice = chosenCandidate?.price || product.currentPrice;
      let chosenStock = chosenCandidate?.stockStatus || 'in_stock';
      let confidence = chosenCandidate?.matchPercent || 99;

      if (!chosenUrl) continue;

      const diff = Number((chosenPrice - product.currentPrice).toFixed(2));
      const diffPercent = Number(((diff / product.currentPrice) * 100).toFixed(1));

      newConfirmedMatches.push({
        id: `match-confirmed-${Date.now()}-${group.competitorId}`,
        tenantId: currentTenant.id,
        productId: product.id,
        competitorId: group.competitorId,
        competitorName: group.competitorName,
        competitorProductTitle: chosenTitle,
        competitorProductUrl: chosenUrl,
        matchConfidence: confidence,
        matchType: chosenCandidate ? 'title_search' : 'manual_override',
        currentPrice: chosenPrice,
        previousPrice: chosenPrice,
        priceDiff: diff,
        priceDiffPercent: diffPercent,
        stockStatus: chosenStock,
        currency: currentTenant.currencySymbol,
        lastScrapedAt: 'Just now',
        priceHistory: [{ timestamp: 'Today', price: chosenPrice, stockStatus: chosenStock }],
        status: 'confirmed',
        channelType: chosenCandidate?.channelType || group.channelType,
        platform: chosenCandidate?.platform || group.platform,
        regularPrice: chosenCandidate?.regularPrice,
        sellerName: chosenCandidate?.sellerName,
      });
    }

    const updatedMatches = [...otherMatches, ...newConfirmedMatches];
    setMatches(updatedMatches);
    setProducts((prev) => recalculateProductPositions(prev, updatedMatches));

    // 2. Persist to backend database
    try {
      const res = await fetch('/api/matches/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, tenantId: currentTenant.id, groups }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh products to ensure market positions match the server's calculations
        const pRes = await fetch(`/api/products?tenantId=${currentTenant.id}`);
        const pData = await pRes.json();
        if (pData.success && pData.products) {
          setProducts(pData.products);
        }
      }
    } catch (err) {
      console.error('Failed to save matches to backend:', err);
    }
  };

  // 8. Bulk Auto Match (for selected batch of products)
  const bulkAutoMatchProducts = async (productIds: string[]): Promise<number> => {
    let count = 0;
    for (const id of productIds) {
      const groups = await generateCompetitorCandidates(id);
      await saveSelectedCandidateMatches(id, groups);
      count++;
    }
    return count;
  };

  const autoMatchProductByTitle = async (productId: string): Promise<CompetitorProductMatch[]> => {
    const groups = await generateCompetitorCandidates(productId);
    await saveSelectedCandidateMatches(productId, groups);
    return matches.filter((m) => m.productId === productId);
  };

  const autoMatchAllProducts = async (): Promise<number> => {
    const tenantProds = products.filter((p) => p.tenantId === currentTenant.id);
    let count = 0;
    for (const p of tenantProds) {
      const groups = await generateCompetitorCandidates(p.id);
      await saveSelectedCandidateMatches(p.id, groups);
      count++;
    }
    return count;
  };

  // 9. Competitor CRUD with Backend
  const addCompetitor = async (
    compData: Omit<Competitor, 'id' | 'tenantId' | 'monitoredProductsCount' | 'avgPriceDiffPercent' | 'lastScrapedAt'>
  ): Promise<Competitor> => {
    const tempId = `comp-${Date.now()}`;
    const optimisticComp: Competitor = {
      ...compData,
      id: tempId,
      tenantId: currentTenant.id,
      monitoredProductsCount: 0,
      avgPriceDiffPercent: 0,
      lastScrapedAt: 'Never',
    };

    setCompetitors((prev) => [...prev, optimisticComp]);

    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...compData, tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (data.success && data.competitor) {
        setCompetitors((prev) => prev.map((c) => (c.id === tempId ? data.competitor : c)));
        return data.competitor;
      }
    } catch (err) {
      console.error('Failed to add competitor to backend:', err);
    }

    return optimisticComp;
  };

  const deleteCompetitor = async (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    setMatches((prev) => prev.filter((m) => m.competitorId !== id));

    try {
      await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete competitor on backend:', err);
    }
  };

  const confirmMatch = (matchId: string) => {
    const updated = matches.map((m) => (m.id === matchId ? { ...m, status: 'confirmed' as const } : m));
    setMatches(updated);
    setProducts((prev) => recalculateProductPositions(prev, updated));
  };

  const rejectMatch = (matchId: string) => {
    const updated = matches.map((m) => (m.id === matchId ? { ...m, status: 'rejected' as const } : m));
    setMatches(updated);
    setProducts((prev) => recalculateProductPositions(prev, updated));
  };

  const addManualMatch = (
    productId: string,
    competitorId: string,
    competitorProductTitle: string,
    competitorProductUrl: string,
    price: number,
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
  ) => {
    const product = products.find((p) => p.id === productId);
    const comp = competitors.find((c) => c.id === competitorId);
    if (!product || !comp) return;

    const diff = Number((price - product.currentPrice).toFixed(2));
    const diffPercent = Number(((diff / product.currentPrice) * 100).toFixed(1));

    const newMatch: CompetitorProductMatch = {
      id: `match-manual-${Date.now()}`,
      tenantId: currentTenant.id,
      productId: product.id,
      competitorId: comp.id,
      competitorName: comp.name,
      competitorProductTitle: competitorProductTitle || product.name,
      competitorProductUrl,
      matchConfidence: 100,
      matchType: 'manual_override',
      currentPrice: price,
      previousPrice: price,
      priceDiff: diff,
      priceDiffPercent: diffPercent,
      stockStatus,
      currency: currentTenant.currencySymbol,
      lastScrapedAt: 'Just now',
      priceHistory: [{ timestamp: 'Today', price, stockStatus }],
      status: 'confirmed',
    };

    const updated = [...matches.filter((m) => !(m.productId === productId && m.competitorId === competitorId)), newMatch];
    setMatches(updated);
    setProducts((prev) => recalculateProductPositions(prev, updated));
  };

  // 10. Live Scan Runner backed by Background Worker Queue
  const runInstantScan = async (): Promise<ScanJob> => {
    setIsScanning(true);
    setScanProgress({ percent: 5, message: 'Submitting crawl job to background worker queue...' });

    try {
      const res = await fetch('/api/jobs/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          type: 'daily_scan',
          title: 'Live Instant Scan Crawl',
          payload: { tenantId: currentTenant.id, batchType: 'manual_instant' },
        }),
      });

      const data = await res.json();
      const jobId = data.jobId;

      if (jobId) {
        let isDone = false;
        let pollCount = 0;
        let finalJob: BackgroundJob | null = null;

        while (!isDone && pollCount < 50) {
          await new Promise((r) => setTimeout(r, 400));
          pollCount++;

          const pollRes = await fetch(`/api/jobs/${jobId}`);
          const pollData = await pollRes.json();

          if (pollData.success && pollData.job) {
            const currentJob = pollData.job as BackgroundJob;
            finalJob = currentJob;
            setScanProgress({
              percent: Math.max(10, currentJob.progress),
              message: currentJob.currentTaskDescription || 'Processing crawler in background...',
            });

            if (currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'cancelled') {
              isDone = true;
            }
          }
        }

        await refreshBackendData();
        await fetchBackgroundJobs();
        setScanProgress({ percent: 100, message: 'Background crawl complete!' });
        setTimeout(() => setIsScanning(false), 500);

        const summary = (finalJob as any)?.resultSummary;

        return (
          scanJobs[0] || {
            id: `scan-${Date.now()}`,
            tenantId: currentTenant.id,
            batchType: 'manual_instant',
            status: 'completed',
            startedAt: 'Just now',
            completedAt: 'Just now',
            durationMs: summary?.durationMs || 3500,
            productsScanned: products.length,
            competitorPagesCrawled: matches.length,
            priceChangesFound: summary?.priceChangesFound ?? 0,
            stockChangesFound: summary?.stockChangesFound ?? 0,
            alertsTriggered: summary?.alertsTriggered ?? 0,
            logItems: [
              { timestamp: '00:01', level: 'info', text: 'Job dispatched to background worker queue.' },
              { timestamp: '00:03', level: 'success', text: 'Monitored URLs scraped with paced rate-limiting.' },
            ],
          }
        );
      }
    } catch (err) {
      console.warn('Background scan execution error, fallback:', err);
    }

    // Fallback scan simulation
    setScanProgress({ percent: 100, message: 'Scan completed!' });
    setIsScanning(false);
    return scanJobs[0];
  };

  // 11. Alerts & Notifications
  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`/api/alerts/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark alert read on backend:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: currentTenant.id }),
      });
    } catch (err) {
      console.error('Failed to mark all alerts read on backend:', err);
    }
  };

  // 12. Dynamic Reprice
  const applyReprice = async (productId: string, newPrice: number) => {
    await updateProduct(productId, { currentPrice: newPrice });
    setNotifications((prev) =>
      prev.map((n) => (n.productId === productId ? { ...n, read: true, actionTaken: 'repriced' } : n))
    );

    try {
      await fetch('/api/products/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newPrice }),
      });
    } catch (err) {
      console.error('Failed to reprice on backend:', err);
    }
  };

  // 13. Alert Rules
  const addAlertRule = (rule: Omit<AlertRule, 'id' | 'tenantId' | 'timesTriggered' | 'createdAt'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      tenantId: currentTenant.id,
      timesTriggered: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAlertRules((prev) => [...prev, newRule]);
  };

  const toggleAlertRule = (ruleId: string) => {
    setAlertRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteAlertRule = (ruleId: string) => {
    setAlertRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  // 14. Brand Registration with Backend
  const registerBrandTenant = async (data: {
    name: string;
    industry: string;
    contactEmail: string;
    planId: PlanTier;
    currency: string;
  }): Promise<Tenant> => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.tenant) {
        setTenants((prev) => [...prev, json.tenant]);
        setCurrentTenantId(json.tenant.id);
        return json.tenant;
      }
    } catch (err) {
      console.error('Failed registering tenant on backend:', err);
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const symbol = data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : data.currency === 'INR' ? '₹' : '$';
    const plan = plans.find((p) => p.id === data.planId) || plans[1];

    const fallbackTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: data.name,
      slug,
      logo: '🏢',
      industry: data.industry,
      currency: data.currency,
      currencySymbol: symbol,
      planId: data.planId,
      planStatus: 'active',
      scanFrequency: '2x_daily',
      scanTimes: ['08:00 AM', '08:00 PM'],
      lastScanAt: 'Never',
      nextScanAt: 'Today at 08:00 PM',
      skuLimit: plan.maxProducts,
      competitorLimit: plan.maxCompetitors,
      createdAt: new Date().toISOString().split('T')[0],
      contactEmail: data.contactEmail,
      webhookUrl: '',
      emailAlertsEnabled: true,
      autoRepriceRecommendation: true,
    };

    setTenants((prev) => [...prev, fallbackTenant]);
    setCurrentTenantId(fallbackTenant.id);
    return fallbackTenant;
  };

  const updateTenantPlan = (tenantId: string, planId: PlanTier, status: Tenant['planStatus'] = 'active') => {
    const plan = plans.find((p) => p.id === planId) || plans[1];
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              planId,
              planStatus: status,
              skuLimit: plan.maxProducts,
              competitorLimit: plan.maxCompetitors,
            }
          : t
      )
    );
  };

  const updatePlanDetails = (planId: PlanTier, updates: Partial<SubscriptionPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, ...updates } : p)));
  };

  return (
    <AppContext.Provider
      value={{
        tenants,
        currentTenant,
        isSuperAdmin,
        activeTab,
        products,
        competitors,
        matches,
        alertRules,
        notifications,
        scanJobs,
        plans,
        isScanning,
        scanProgress,
        backendConnected,
        backgroundJobs,
        activeBackgroundJob,
        queueMetrics,
        triggerBackgroundScan,
        cancelBackgroundJob,
        setCurrentTenantId,
        setIsSuperAdmin,
        setActiveTab,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        clearAllProducts,
        importProductsFromCsv,
        generateLargeDemoCatalog,
        addCompetitor,
        deleteCompetitor,
        generateCompetitorCandidates,
        saveSelectedCandidateMatches,
        bulkAutoMatchProducts,
        autoMatchProductByTitle,
        autoMatchAllProducts,
        confirmMatch,
        rejectMatch,
        addManualMatch,
        runInstantScan,
        markNotificationAsRead,
        markAllNotificationsRead,
        applyReprice,
        addAlertRule,
        toggleAlertRule,
        deleteAlertRule,
        registerBrandTenant,
        updateTenantPlan,
        updatePlanDetails,
        refreshBackendData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
