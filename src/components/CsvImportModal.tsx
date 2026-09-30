'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCandidateMatcher?: (product: Product) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onOpenCandidateMatcher,
}) => {
  const { importProductsFromCsv, currentTenant } = useApp();
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ count: number; importedProducts: Product[] } | null>(null);

  if (!isOpen) return null;

  const sampleCsvTemplate = `name,brand,code,mrp,currentPrice,costPrice,category,productUrl
Apex Quantum Air Running Shoes,${currentTenant.name},APX-AIR-99,190.00,175.00,80.00,Footwear,https://store.example.com/shoes
Apex Thermal Grid Quarter Zip,${currentTenant.name},APX-QZP-21,85.00,70.00,32.00,Apparel,https://store.example.com/zip
Apex HydroSteel Insulated Bottle 1L,${currentTenant.name},APX-BTL-10,45.00,38.00,14.00,Accessories,https://store.example.com/bottle
Apex Pro Speed Jump Rope,${currentTenant.name},APX-JMP-05,30.00,24.00,8.50,Accessories,https://store.example.com/rope
Apex StormShield Performance Anorak,${currentTenant.name},APX-ANR-77,150.00,135.00,60.00,Outerwear,https://store.example.com/anorak`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTenant.slug}-catalog-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleData = () => {
    setCsvContent(sampleCsvTemplate);
    parseCsv(sampleCsvTemplate);
  };

  const parseCsv = (rawText: string) => {
    try {
      setParseError(null);
      const lines = rawText.trim().split('\n');
      if (lines.length < 2) {
        setParseError('CSV must contain a header row and at least one product row.');
        setParsedRows([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim());

        const rowObj: any = {};
        headers.forEach((header, idx) => {
          rowObj[header] = cols[idx] || '';
        });

        const product = {
          name: rowObj.name || rowObj.title || rowObj['product name'] || 'Unnamed Product',
          brand: rowObj.brand || currentTenant.name,
          code: rowObj.code || rowObj.sku || rowObj['product code'] || `SKU-${Date.now()}-${i}`,
          mrp: parseFloat(rowObj.mrp || rowObj.price || rowObj.rrp || '0') || 0,
          currentPrice: parseFloat(rowObj.currentprice || rowObj['current price'] || rowObj.mrp || '0') || 0,
          costPrice: parseFloat(rowObj.costprice || rowObj['cost price'] || rowObj.cost || '0') || 0,
          category: rowObj.category || 'General',
          productUrl: rowObj.producturl || rowObj.url || '',
        };

        rows.push(product);
      }

      setParsedRows(rows);
    } catch {
      setParseError('Failed to parse CSV. Please verify file format.');
      setParsedRows([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleCommitImport = async (autoReviewCandidateMatches: boolean = false) => {
    if (parsedRows.length === 0) return;
    const res = await importProductsFromCsv(parsedRows);
    setImportResult(res);

    if (autoReviewCandidateMatches && onOpenCandidateMatcher && res.importedProducts.length > 0) {
      setTimeout(() => {
        onClose();
        onOpenCandidateMatcher(res.importedProducts[0]);
      }, 500);
    } else {
      setTimeout(() => {
        setImportResult(null);
        setParsedRows([]);
        setCsvContent('');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Bulk Upload Products via CSV</h2>
              <p className="text-xs text-slate-400">
                Import SKUs, MRPs, Cost, and titles directly for {currentTenant.name}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importResult !== null ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-100">Import Successful!</h3>
              <p className="text-sm text-slate-400">
                Added <span className="text-emerald-400 font-semibold">{importResult.count}</span> new products to{' '}
                {currentTenant.name}&apos;s catalog.
              </p>
            </div>
          ) : (
            <>
              {/* File upload box */}
              <div className="border-2 border-dashed border-white/[0.1] hover:border-blue-500/60 rounded-3xl p-6 text-center bg-slate-950/40 transition-colors group cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors border border-white/[0.06]">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-blue-400">
                      Click to upload CSV
                    </span>
                    <span className="text-sm text-slate-400"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Supports columns: <code className="text-slate-400 font-mono">name</code>,{' '}
                    <code className="text-slate-400 font-mono">code/sku</code>, <code className="text-slate-400 font-mono">mrp</code>,{' '}
                    <code className="text-slate-400 font-mono">currentPrice</code>, <code className="text-slate-400 font-mono">costPrice</code>,{' '}
                    <code className="text-slate-400 font-mono">category</code>
                  </p>
                </div>
              </div>

              {/* Sample Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-xs">
                <span className="text-slate-400">Need a starting template?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSample}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample CSV
                  </button>
                  <button
                    onClick={handleLoadSampleData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 font-semibold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Load Sample Products (5 SKUs)
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  {parseError}
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Parsed Preview ({parsedRows.length} Items Detected)</span>
                    <span className="text-emerald-400">Format Validated</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/[0.08] bg-slate-950/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 sticky top-0 border-b border-white/[0.06]">
                        <tr>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">SKU Code</th>
                          <th className="p-2.5">MRP</th>
                          <th className="p-2.5">Current Price</th>
                          <th className="p-2.5">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-slate-300">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="p-2.5 font-medium text-slate-200">{row.name}</td>
                            <td className="p-2.5 font-mono text-slate-400">{row.code}</td>
                            <td className="p-2.5 font-bold text-slate-200">
                              {currentTenant.currencySymbol}
                              {row.mrp}
                            </td>
                            <td className="p-2.5 text-emerald-400 font-semibold">
                              {currentTenant.currencySymbol}
                              {row.currentPrice}
                            </td>
                            <td className="p-2.5 text-slate-400">{row.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {importResult === null && (
          <div className="p-4 border-t border-white/[0.06] bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {parsedRows.length > 0 ? `${parsedRows.length} products ready to import` : 'No file selected yet'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleCommitImport(false)}
                disabled={parsedRows.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-40 cursor-pointer"
              >
                Import Catalog Only
              </button>

              <button
                onClick={() => handleCommitImport(true)}
                disabled={parsedRows.length === 0}
                className="btn-primary-clean flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Import & Select Competitor URLs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
