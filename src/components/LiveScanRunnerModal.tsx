'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Zap,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Activity,
  TrendingDown,
  PackageX,
  BellRing,
} from 'lucide-react';
import { ScanJob } from '@/types';

interface LiveScanRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveScanRunnerModal: React.FC<LiveScanRunnerModalProps> = ({ isOpen, onClose }) => {
  const { runInstantScan, isScanning, scanProgress, currentTenant } = useApp();
  const [completedJob, setCompletedJob] = useState<ScanJob | null>(null);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    setCompletedJob(null);
    const result = await runInstantScan();
    setCompletedJob(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Live Competitor Crawler & Monitor</h2>
              <p className="text-xs text-slate-400">
                Trigger simulated scheduled sweep for {currentTenant.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isScanning}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Banner */}
          <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Schedule Mode: 2x Daily Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Next automated crawl scheduled for{' '}
                <strong className="text-slate-200">{currentTenant.nextScanAt}</strong>
              </p>
            </div>

            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="btn-primary-clean flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all disabled:opacity-40 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Crawling In Progress...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Scan Now
                </>
              )}
            </button>
          </div>

          {/* Progress bar if scanning */}
          {isScanning && (
            <div className="space-y-2 p-5 rounded-3xl bg-slate-950/90 border border-blue-500/30">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-blue-400 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  {scanProgress.message}
                </span>
                <span className="text-slate-200 font-mono">{scanProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${scanProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary if completed */}
          {completedJob && !isScanning && (
            <div className="p-5 rounded-3xl bg-emerald-500/[0.06] border border-emerald-500/25 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                Crawl Batch Successfully Finalized
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">SKUs Scanned</span>
                  <span className="text-lg font-black text-slate-100">{completedJob.productsScanned}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">URLs Crawled</span>
                  <span className="text-lg font-black text-slate-100">{completedJob.competitorPagesCrawled}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Price Shifts</span>
                  <span className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {completedJob.priceChangesFound}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Stock Events</span>
                  <span className="text-lg font-black text-rose-400 flex items-center justify-center gap-1">
                    <PackageX className="w-4 h-4" />
                    {completedJob.stockChangesFound}
                  </span>
                </div>
              </div>

              {completedJob.alertsTriggered > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-500/[0.06] border border-blue-500/20 flex items-center gap-2.5 text-xs text-blue-300">
                  <BellRing className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Generated <strong className="text-white">{completedJob.alertsTriggered} actionable alerts</strong>.
                    Review in the Alert Rules & Feed tab to reprice.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Crawler Log Terminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Live Engine Execution Logs
              </span>
              <span className="text-[11px] text-slate-400">Residential Proxies: Active</span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-950 border border-white/[0.06] font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto text-slate-300">
              {completedJob ? (
                completedJob.logItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500">{item.timestamp}</span>
                    <span
                      className={`font-semibold ${
                        item.level === 'warn'
                          ? 'text-amber-400'
                          : item.level === 'success'
                          ? 'text-emerald-400'
                          : item.level === 'error'
                          ? 'text-rose-400'
                          : 'text-blue-400'
                      }`}
                    >
                      [{item.level.toUpperCase()}]
                    </span>
                    <span className="text-slate-300">{item.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic py-2">
                  Crawler engine idle. Click &quot;Run Scan Now&quot; above to execute live competitor checks.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-slate-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
