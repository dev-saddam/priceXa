'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Product, CompetitorCandidateGroup } from '@/types';
import {
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Check,
  Search,
  RefreshCw,
  Radio,
  Link as LinkIcon,
  ShieldCheck,
  PackageCheck,
  PackageX,
} from 'lucide-react';

interface CandidateMatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onMatchesSaved?: () => void;
}

export const CandidateMatchSelectorModal: React.FC<CandidateMatchSelectorModalProps> = ({
  isOpen,
  onClose,
  product,
  onMatchesSaved,
}) => {
  const {
    currentTenant,
    generateCompetitorCandidates,
    saveSelectedCandidateMatches,
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [candidateGroups, setCandidateGroups] = useState<CompetitorCandidateGroup[]>([]);
  const [customUrls, setCustomUrls] = useState<{ [compId: string]: string }>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setIsLoading(true);
      setIsSaved(false);
      generateCompetitorCandidates(product.id)
        .then((groups) => {
          setCandidateGroups(groups);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSelectCandidate = (competitorId: string, candidateId: string | null) => {
    setCandidateGroups((prev) =>
      prev.map((g) => (g.competitorId === competitorId ? { ...g, selectedCandidateId: candidateId } : g))
    );
  };

  const handleCustomUrlChange = (competitorId: string, url: string) => {
    setCustomUrls((prev) => ({ ...prev, [competitorId]: url }));
    setCandidateGroups((prev) =>
      prev.map((g) =>
        g.competitorId === competitorId
          ? { ...g, selectedCandidateId: 'custom', customUrl: url }
          : g
      )
    );
  };

  const handleSave = () => {
    saveSelectedCandidateMatches(product.id, candidateGroups);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      if (onMatchesSaved) onMatchesSaved();
    }, 1200);
  };

  const selectedCount = candidateGroups.filter((g) => g.selectedCandidateId !== null).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Select Competitor URLs to Monitor
                <span className="badge-clean-purple text-[10px] font-bold px-2 py-0.5 rounded-full">
                  AI Title Matcher
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose the best matching listing URL for each competitor website
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

        {/* Selected Product Banner */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-white/[0.06] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-white/[0.08]">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden flex-1">
            <h3 className="font-bold text-sm text-slate-100 truncate">{product.name}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-slate-300">SKU: {product.code}</span>
              <span>•</span>
              <span>
                Your Price:{' '}
                <strong className="text-white">
                  {currentTenant.currencySymbol}
                  {product.currentPrice.toFixed(2)}
                </strong>
              </span>
              <span>•</span>
              <span>
                MRP:{' '}
                <span className="text-slate-400">
                  {currentTenant.currencySymbol}
                  {product.mrp.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Candidate List Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-200">Searching Competitor Websites...</p>
              <p className="text-xs text-slate-400">
                Querying Amazon, Walmart, Target, and other active stores by product title keywords
              </p>
            </div>
          ) : isSaved ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-100">Competitor URLs Linked!</h3>
              <p className="text-xs text-slate-400">
                Your selected competitor listings are now locked for scheduled 2x/day crawling.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {candidateGroups.map((group) => (
                <div
                  key={group.competitorId}
                  className="rounded-3xl glass-card p-5 space-y-4 border border-white/[0.08]"
                >
                  {/* Store Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{group.competitorLogo}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-100 leading-tight">
                            {group.competitorName}
                          </h4>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              group.channelType === 'brand_official'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                            }`}
                          >
                            {group.channelType === 'brand_official' ? '🏷️ Brand Official Webstore' : '🛒 Marketplace Channel'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{group.competitorDomain}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectCandidate(group.competitorId, null)}
                        className={`text-xs px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
                          group.selectedCandidateId === null
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/25'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Skip this store
                      </button>
                    </div>
                  </div>

                  {/* Candidate Options */}
                  <div className="space-y-2.5">
                    {group.candidates.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-white/[0.08] text-center space-y-1">
                        <p className="text-xs font-semibold text-slate-300">
                          No live product detail listings matching ≥ 50% of title found on this domain.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Every candidate is strictly verified for HTTP 200 OK and product details. You can paste a custom URL below.
                        </p>
                      </div>
                    ) : (
                      group.candidates.map((cand) => {
                        const isSelected = group.selectedCandidateId === cand.id;

                        return (
                          <div
                            key={cand.id}
                            onClick={() => handleSelectCandidate(group.competitorId, cand.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-blue-600/15 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                                : 'bg-slate-950/60 border-white/[0.06] hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Radio indicator */}
                              <div className="pt-0.5 shrink-0">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'border-blue-400 bg-blue-500 text-white'
                                      : 'border-slate-600 bg-transparent'
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-slate-200 truncate">
                                    {cand.title}
                                  </span>
                                  <span
                                    className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                      cand.matchPercent >= 90
                                        ? 'badge-clean-emerald'
                                        : cand.matchPercent >= 80
                                        ? 'badge-clean-blue'
                                        : 'badge-clean-amber'
                                    }`}
                                  >
                                    {cand.matchPercent}% Title Match
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> PDP Verified (200 OK)
                                  </span>
                                {cand.channelType === 'brand_official' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    <ShieldCheck className="w-2.5 h-2.5" /> Official Brand
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                    Marketplace
                                  </span>
                                )}
                                {cand.isRecommended && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    Recommended
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                                <span className="font-mono truncate max-w-xs">{cand.url}</span>
                                {cand.sellerName && (
                                  <span className="text-slate-400">
                                    Sold by: <strong className="text-slate-300">{cand.sellerName}</strong>
                                  </span>
                                )}
                                <a
                                  href={cand.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5 shrink-0"
                                >
                                  Preview <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Price & Stock info */}
                          <div className="text-right shrink-0 pl-7 sm:pl-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-slate-100">
                                {currentTenant.currencySymbol}
                                {cand.price.toFixed(2)}
                              </span>
                              {cand.regularPrice && cand.regularPrice > cand.price && (
                                <span className="line-through text-slate-500 text-xs">
                                  {currentTenant.currencySymbol}
                                  {cand.regularPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {cand.discountPercent && cand.discountPercent > 0 && (
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                  {cand.discountPercent}% OFF
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                  cand.stockStatus === 'in_stock'
                                    ? 'badge-clean-emerald'
                                    : 'badge-clean-rose'
                                }`}
                              >
                                {cand.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }))}
                  </div>

                  {/* Custom URL Input Option */}
                  <div className="pt-1 flex items-center gap-2 text-xs">
                    <span className="text-slate-400 shrink-0 flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      Or paste custom URL:
                    </span>
                    <input
                      type="url"
                      placeholder={`https://${group.competitorDomain}/product/custom-id`}
                      value={customUrls[group.competitorId] || ''}
                      onChange={(e) => handleCustomUrlChange(group.competitorId, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] bg-slate-950/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Selected <strong className="text-white font-semibold">{selectedCount}</strong> competitor URLs to monitor
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isSaved || selectedCount === 0}
              className="btn-primary-clean flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg transition-all disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Confirm & Start Monitoring Selected URLs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
