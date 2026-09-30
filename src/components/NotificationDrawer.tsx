'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Bell,
  CheckCheck,
  TrendingDown,
  PackageX,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    currentTenant,
    markNotificationAsRead,
    markAllNotificationsRead,
    applyReprice,
    setActiveTab,
  } = useApp();

  if (!isOpen) return null;

  const tenantNotifs = notifications.filter((n) => n.tenantId === currentTenant.id);
  const unreadCount = tenantNotifs.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Price & Stock Alerts</h2>
              <p className="text-[11px] text-slate-400">
                {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} for {currentTenant.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {tenantNotifs.length === 0 ? (
            <div className="py-20 text-center space-y-2 text-slate-400">
              <CheckCheck className="w-10 h-10 mx-auto text-emerald-400/80" />
              <p className="text-sm font-semibold text-slate-200">All caught up!</p>
              <p className="text-xs text-slate-400">
                No active price drops or stock shifts detected right now.
              </p>
            </div>
          ) : (
            tenantNotifs.map((notif) => {
              const isPriceDrop = notif.newPrice < notif.myPrice && notif.myPrice > 0;
              const isStockOut = notif.stockChange?.to === 'out_of_stock';

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    !notif.read
                      ? 'bg-slate-950/80 border-blue-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-white/[0.06] text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isPriceDrop ? (
                        <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400">
                          <TrendingDown className="w-3.5 h-3.5" />
                        </div>
                      ) : isStockOut ? (
                        <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                          <PackageX className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-200 leading-tight">
                        {notif.competitorName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{notif.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                  {/* Price Comparison Snippet */}
                  {notif.newPrice > 0 && notif.myPrice > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-white/[0.06] text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Your Rate:</span>
                        <span className="font-bold text-slate-100">
                          {currentTenant.currencySymbol}
                          {notif.myPrice.toFixed(2)}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400 text-[10px] block">Competitor:</span>
                        <span className="font-bold text-rose-400">
                          {currentTenant.currencySymbol}
                          {notif.newPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Delta:</span>
                        <span className="font-semibold text-rose-400">
                          {Math.abs(notif.priceDiffPercent)}% Cheaper
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    {!notif.read ? (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        Mark as read
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Read</span>
                    )}

                    {notif.productId !== 'system' && notif.newPrice > 0 && (
                      <button
                        onClick={() => applyReprice(notif.productId, notif.newPrice)}
                        className="btn-primary-clean px-2.5 py-1 rounded-lg text-white font-semibold text-[11px] shadow-sm transition-all cursor-pointer"
                      >
                        Match {currentTenant.currencySymbol}
                        {notif.newPrice.toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-slate-950/40 text-center">
          <button
            onClick={() => {
              onClose();
              setActiveTab('alerts');
            }}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Configure Alert Rules & Triggers →
          </button>
        </div>
      </div>
    </div>
  );
};
