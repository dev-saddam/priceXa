'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, PackagePlus } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { addProduct, currentTenant } = useApp();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState(currentTenant.name);
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Footwear');
  const [mrp, setMrp] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockCount, setStockCount] = useState('50');
  const [productUrl, setProductUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !mrp) return;

    const numMrp = parseFloat(mrp) || 0;
    const numPrice = parseFloat(currentPrice) || numMrp;
    const numCost = parseFloat(costPrice) || Math.round(numMrp * 0.5);

    addProduct({
      name,
      brand: brand || currentTenant.name,
      code,
      category,
      mrp: numMrp,
      currentPrice: numPrice,
      costPrice: numCost,
      minMarginPercent: 30,
      stockStatus: parseInt(stockCount) > 0 ? 'in_stock' : 'out_of_stock',
      stockCount: parseInt(stockCount) || 0,
      productUrl,
      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Add New Product SKU</h2>
              <p className="text-xs text-slate-400">Add to catalog for {currentTenant.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Product Title / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex HyperCloud Running Shoes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SKU / Barcode Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APX-HYP-101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Footwear">Footwear</option>
                <option value="Apparel">Apparel</option>
                <option value="Accessories">Accessories</option>
                <option value="Electronics">Electronics</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                MRP ({currentTenant.currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="150.00"
                value={mrp}
                onChange={(e) => {
                  setMrp(e.target.value);
                  if (!currentPrice) setCurrentPrice(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selling Price ({currentTenant.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="139.00"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none text-emerald-400 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Base Cost ({currentTenant.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="60.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                placeholder={currentTenant.name}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Count</label>
              <input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Store URL</label>
            <input
              type="url"
              placeholder="https://yourstore.com/products/example"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-100 placeholder-slate-500 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
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
              className="btn-primary-clean px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
