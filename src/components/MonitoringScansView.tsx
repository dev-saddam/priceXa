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
  const { currentTenant, scanJobs, isScanning, refreshBackendData } = useApp();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(scanJobs[0]?.id || null);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronFeedback, setCronFeedback] = useState<string | null>(null);

  const tenantJobs = scanJobs.filter(
    (job) => job.tenantId === currentTenant.id || job.tenantId === 'all'
  );

  const handleTriggerCron = async (slot: 'am' | 'pm') => {
    setIsCronRunning(true);
    setCronFeedback(`Triggering ${slot.toUpperCase()} Cron Crawl sweep...`);

    try {
      const res = await fetch(`/api/cron/crawl?slot=${slot}&tenantId=${currentTenant.id}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setCronFeedback(
          `✓ ${data.slot} completed in ${(data.durationMs / 1000).toFixed(1)}s! Discovered ${data.priceChangesDetected} price shifts & ${data.alertsGenerated} alerts.`
        );
        await refreshBackendData();
      } else {
        setCronFeedback(`Cron execution error: ${data.error || 'Failed to execute crawl'}`);
      }
    } catch (err: any) {
      setCronFeedback(`Network error triggering cron: ${err.message}`);
    } finally {
      setIsCronRunning(false);
      setTimeout(() => setCronFeedback(null), 8000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Twice-a-Day Crawl Engine
            <span className="badge-clean-emerald text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cron 2x/Day Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated crawler sweeps competitor stores at 08:00 AM and 08:00 PM via Vercel Cron & Inngest
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTriggerCron('am')}
            disabled={isCronRunning || isScanning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            title="Trigger the 08:00 AM morning cron sweep on-demand"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            {isCronRunning ? 'Running Cron...' : 'Run Morning Cron (8 AM)'}
          </button>

          <button
            onClick={onOpenScanRunner}
            disabled={isScanning || isCronRunning}
            className="btn-primary-clean flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            {isScanning ? 'Scan In Progress...' : 'Run Instant Crawl'}
          </button>
        </div>
      </div>

      {/* Cron Feedback Banner */}
      {cronFeedback && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cronFeedback}</span>
          </div>
          <button onClick={() => setCronFeedback(null)} className="text-blue-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Schedule Configuration Card */}
      <div className="rounded-3xl glass-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Daily Automated Slots
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/[0.08]">
                  cron: 0 8,20 * * *
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scheduled 2x every 24 hours (Vercel Cron: <code className="text-blue-300 text-[11px]">vercel.json</code>)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Webhook Endpoint:</span>
            <code className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              /api/cron/crawl
            </code>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot 1: Morning */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold text-[10px] uppercase">
                  Slot 1 • Morning
                </span>
                <span className="text-xs font-bold text-slate-100">08:00 AM UTC</span>
              </div>
              <p className="text-xs text-slate-400">
                Morning crawl completed. Catalog prices synchronized.
              </p>
            </div>
            <button
              onClick={() => handleTriggerCron('am')}
              disabled={isCronRunning}
              className="badge-clean-emerald px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
              title="Test run Morning Cron"
            >
              <Check className="w-3.5 h-3.5" />
              Completed
            </button>
          </div>

          {/* Slot 2: Evening */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-[10px] uppercase">
                  Slot 2 • Evening
                </span>
                <span className="text-xs font-bold text-slate-100">08:00 PM UTC</span>
              </div>
              <p className="text-xs text-slate-400">
                Evening crawl queued for closing & promotional rates.
              </p>
            </div>
            <button
              onClick={() => handleTriggerCron('pm')}
              disabled={isCronRunning}
              className="badge-clean-blue px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
              title="Test run Evening Cron"
            >
              <Timer className="w-3.5 h-3.5 animate-spin" />
              Next Scheduled
            </button>
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
