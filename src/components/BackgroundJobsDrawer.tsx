'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  StopCircle,
  Activity,
  Layers,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface BackgroundJobsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundJobsDrawer: React.FC<BackgroundJobsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    backgroundJobs,
    queueMetrics,
    triggerBackgroundScan,
    cancelBackgroundJob,
    currentTenant,
  } = useApp();

  if (!isOpen) return null;

  const activeJobs = backgroundJobs.filter((j) => j.status === 'processing' || j.status === 'queued');
  const pastJobs = backgroundJobs.filter((j) => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-white/[0.08] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  Background Worker Manager
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-400">
                  Asynchronous task queue & crawler pacing
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Worker Metrics Bar */}
          <div className="p-4 bg-slate-950/80 border-b border-white/[0.06] grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Workers</span>
              <span className="font-mono text-sm font-black text-blue-400">
                {queueMetrics.activeWorkers} / {queueMetrics.maxConcurrency}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">In Queue</span>
              <span className="font-mono text-sm font-black text-amber-400">
                {queueMetrics.queueDepth}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Server Load</span>
              <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Activity className="w-3 h-3" />
                {queueMetrics.serverLoadStatus === 'optimal' ? 'Optimal' : 'Paced'}
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="p-4 bg-slate-950/40 border-b border-white/[0.06] flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 leading-snug">
              Enqueue crawler scan without freezing main endpoint:
            </span>
            <button
              onClick={() => triggerBackgroundScan('manual_instant')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              Enqueue Scan
            </button>
          </div>

          {/* Job List Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Active / Queued Jobs */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Active Background Tasks ({activeJobs.length})</span>
                {activeJobs.length > 0 && (
                  <span className="text-blue-400 text-[10px] font-normal flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Paced Crawler Active
                  </span>
                )}
              </div>

              {activeJobs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1 opacity-70" />
                  No jobs currently running. Queue is idle.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-2xl bg-slate-950/90 border border-blue-500/30 text-xs space-y-2 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 truncate pr-2">{job.title}</span>
                        <button
                          onClick={() => cancelBackgroundJob(job.id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
                          title="Cancel Job"
                        >
                          <StopCircle className="w-3 h-3" /> Cancel
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/[0.04]">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span className="truncate max-w-[240px] text-slate-300">
                          {job.currentTaskDescription || 'Processing...'}
                        </span>
                        <span className="font-mono text-blue-400 font-bold shrink-0">
                          {job.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Job History */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Recent Task History
              </div>

              {pastJobs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] text-center text-xs text-slate-500">
                  No completed jobs recorded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {pastJobs.slice(0, 8).map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-2xl bg-slate-950/50 border border-white/[0.05] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate pr-2">
                          {job.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : job.status === 'cancelled'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      {job.resultSummary && (
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          {typeof job.resultSummary.priceChangesFound === 'number' && (
                            <span className="text-amber-300">
                              {job.resultSummary.priceChangesFound} Price Shifts
                            </span>
                          )}
                          {typeof job.resultSummary.alertsTriggered === 'number' && (
                            <span className="text-rose-400">
                              {job.resultSummary.alertsTriggered} Alerts
                            </span>
                          )}
                          {typeof job.resultSummary.matchesSaved === 'number' && (
                            <span className="text-purple-300">
                              {job.resultSummary.matchesSaved} Stores Mapped
                            </span>
                          )}
                          {job.resultSummary.durationMs && (
                            <span className="text-slate-500 font-mono ml-auto">
                              {(job.resultSummary.durationMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                        <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
                        <span className="font-mono text-slate-600">ID: {job.id.substring(0, 12)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
