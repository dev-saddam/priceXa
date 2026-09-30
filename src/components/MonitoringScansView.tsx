'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Timer,
  Zap,
  Clock,
  CheckCircle2,
  Terminal,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  PackageX,
  BellRing,
  Check,
} from 'lucide-react';

interface MonitoringScansViewProps {
  onOpenScanRunner: () => void;
}

export const MonitoringScansView: React.FC<MonitoringScansViewProps> = ({ onOpenScanRunner }) => {
  const { currentTenant, scanJobs, isScanning } = useApp();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(scanJobs[0]?.id || null);

  const tenantJobs = scanJobs.filter(
    (job) => job.tenantId === currentTenant.id || job.tenantId === 'all'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Twice-a-Day Crawl Engine
            <span className="badge-clean-emerald text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Dual Daily Sweeps Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated crawler sweeps competitor stores at 08:00 AM and 08:00 PM local time
          </p>
        </div>

        <button
          onClick={onOpenScanRunner}
          disabled={isScanning}
          className="btn-primary-clean flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          {isScanning ? 'Scan In Progress...' : 'Run Instant Crawl'}
        </button>
      </div>

      {/* Schedule Configuration Card */}
      <div className="rounded-3xl glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Daily Automated Slots</h2>
              <p className="text-xs text-slate-400">Scheduled 2x every 24 hours</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Timezone: <strong className="text-slate-200">Local (Browser)</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot 1: Morning */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold text-[10px] uppercase">
                  Slot 1 • Morning
                </span>
                <span className="text-xs font-bold text-slate-100">08:00 AM</span>
              </div>
              <p className="text-xs text-slate-400">
                Morning crawl completed. Catalog prices synchronized.
              </p>
            </div>
            <span className="badge-clean-emerald px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Completed
            </span>
          </div>

          {/* Slot 2: Evening */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-[10px] uppercase">
                  Slot 2 • Evening
                </span>
                <span className="text-xs font-bold text-slate-100">08:00 PM</span>
              </div>
              <p className="text-xs text-slate-400">
                Evening crawl queued for closing & promotional rates.
              </p>
            </div>
            <span className="badge-clean-blue px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 animate-spin" />
              Next Scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Crawl Execution History */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Crawl Batches & Telemetry ({tenantJobs.length})
        </h2>

        <div className="space-y-3">
          {tenantJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;

            return (
              <div
                key={job.id}
                className="rounded-3xl glass-card overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-white/[0.08] text-blue-400 flex items-center justify-center font-bold text-xs">
                      {job.batchType === 'scheduled_am' ? 'AM' : job.batchType === 'scheduled_pm' ? 'PM' : 'NOW'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-xs sm:text-sm">
                          {job.batchType === 'scheduled_am'
                            ? 'Morning Scheduled Sweep (08:00 AM)'
                            : job.batchType === 'scheduled_pm'
                            ? 'Evening Scheduled Sweep (08:00 PM)'
                            : 'Manual Instant Scan'}
                        </span>
                        <span className="badge-clean-emerald text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md">
                          {job.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">{job.startedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Scanned</span>
                      <span className="font-bold text-slate-200">{job.productsScanned} SKUs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Price Shifts</span>
                      <span className="font-bold text-amber-400 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />
                        {job.priceChangesFound}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Stock Shifts</span>
                      <span className="font-bold text-rose-400 flex items-center gap-0.5">
                        <PackageX className="w-3 h-3" />
                        {job.stockChangesFound}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Alerts</span>
                      <span className="font-bold text-blue-400 flex items-center gap-0.5">
                        <BellRing className="w-3 h-3" />
                        {job.alertsTriggered}
                      </span>
                    </div>

                    <div className="text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Log */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/70 border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold font-mono">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-blue-400" />
                        Execution Trace Logs
                      </span>
                      <span>Duration: {(job.durationMs / 1000).toFixed(1)}s</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/[0.06] font-mono text-[11px] space-y-1 max-h-40 overflow-y-auto">
                      {job.logItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-slate-500">{item.timestamp}</span>
                          <span
                            className={`font-semibold ${
                              item.level === 'warn'
                                ? 'text-amber-400'
                                : item.level === 'success'
                                ? 'text-emerald-400'
                                : 'text-blue-400'
                            }`}
                          >
                            [{item.level.toUpperCase()}]
                          </span>
                          <span className="text-slate-300">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
