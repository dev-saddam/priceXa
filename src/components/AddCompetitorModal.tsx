'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Crosshair, Plus, Store, ShoppingBag } from 'lucide-react';
import { ChannelType } from '@/types';

interface AddCompetitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCompetitorModal: React.FC<AddCompetitorModalProps> = ({ isOpen, onClose }) => {
  const { addCompetitor } = useApp();

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [logo, setLogo] = useState('🛒');
  const [channelType, setChannelType] = useState<ChannelType>('marketplace');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !domain) return;

    let formattedBaseUrl = baseUrl;
    if (!formattedBaseUrl) {
      formattedBaseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    }

    addCompetitor({
      name,
      domain: domain.replace(/https?:\/\//, '').replace(/\/$/, ''),
      baseUrl: formattedBaseUrl,
      logo: logo || (channelType === 'brand_official' ? '🏷️' : '🛒'),
      channelType,
      status,
    });

    onClose();
  };

  const marketplacePresets = [
    { name: 'Amazon US', domain: 'amazon.com', logo: '📦', type: 'marketplace' as const },
    { name: 'Walmart Store', domain: 'walmart.com', logo: '🛒', type: 'marketplace' as const },
    { name: 'Target Direct', domain: 'target.com', logo: '🎯', type: 'marketplace' as const },
    { name: 'Best Buy', domain: 'bestbuy.com', logo: '🏷️', type: 'marketplace' as const },
    { name: 'eBay Marketplace', domain: 'ebay.com', logo: '🌐', type: 'marketplace' as const },
  ];

  const brandOfficialPresets = [
    { name: 'Nike Official Store', domain: 'nike.com', logo: '👟', type: 'brand_official' as const },
    { name: 'Apple Direct Webstore', domain: 'apple.com', logo: '🍏', type: 'brand_official' as const },
    { name: 'Adidas Official D2C', domain: 'adidas.com', logo: '⚡', type: 'brand_official' as const },
    { name: 'Sony Direct Store', domain: 'sony.com', logo: '🎧', type: 'brand_official' as const },
    { name: 'Gymshark D2C', domain: 'gymshark.com', logo: '🦈', type: 'brand_official' as const },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Add Competitor Channel</h2>
              <p className="text-xs text-slate-400">Track e-commerce marketplaces and brand official webstores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Type Selector Tabs */}
        <div className="px-6 pt-5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Channel Category
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950/80 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setChannelType('marketplace');
                setLogo('🛒');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                channelType === 'marketplace'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              E-Commerce Marketplace
            </button>
            <button
              type="button"
              onClick={() => {
                setChannelType('brand_official');
                setLogo('🏷️');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                channelType === 'brand_official'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Brand Official Webstore
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="px-6 pt-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Quick Add {channelType === 'marketplace' ? 'Marketplaces' : 'Brand D2C Stores'}
          </label>
          <div className="flex flex-wrap gap-2">
            {(channelType === 'marketplace' ? marketplacePresets : brandOfficialPresets).map((preset) => (
              <button
                key={preset.domain}
                type="button"
                onClick={() => {
                  setName(preset.name);
                  setDomain(preset.domain);
                  setBaseUrl(`https://www.${preset.domain}`);
                  setLogo(preset.logo);
                  setChannelType(preset.type);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] hover:border-white/20 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <span>{preset.logo}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Store / Brand Name *
            </label>
            <input
              type="text"
              required
              placeholder={channelType === 'marketplace' ? 'e.g. Amazon Marketplace' : 'e.g. Nike Official Store'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Domain *</label>
              <input
                type="text"
                required
                placeholder="e.g. nike.com"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  if (!baseUrl) setBaseUrl(`https://www.${e.target.value}`);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Icon/Emoji</label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-center text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Base Store URL</label>
            <input
              type="url"
              placeholder="https://www.nike.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-clean flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Competitor Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
