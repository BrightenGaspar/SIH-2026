'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications, UseNotificationsResult, InAppNotification } from '@/hooks/useNotifications';
import { useI18n } from '@/context/I18nContext';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck, Package, Truck, ShoppingBag, AlertCircle } from 'lucide-react';

const NotificationContext = createContext<UseNotificationsResult | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const notif = useNotifications(currentUser?.id);
  const { t } = useI18n();
  const router = useRouter();

  const handleToastClick = (item: InAppNotification) => {
    notif.markRead(item.id);
    notif.dismissToast();

    // Contextual routing based on notification data payload
    if (item.data?.order_id) {
      if (currentUser?.role === 'farmer') {
        router.push('/farmer/orders');
      } else if (currentUser?.role === 'logistics') {
        router.push(`/logistics/trips`);
      } else {
        router.push(`/consumer/tracking/${item.data.order_id}`);
      }
    } else if (item.data?.listing_id) {
      if (currentUser?.role === 'farmer') {
        router.push('/farmer/produce');
      } else {
        router.push(`/consumer/marketplace`);
      }
    } else if (item.data?.assignment_id) {
      router.push(`/logistics/track/${item.data.assignment_id}`);
    }
  };

  return (
    <NotificationContext.Provider value={notif}>
      {children}

      {/* Floating In-App Arrival Toast Banner */}
      {notif.activeToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
              {notif.activeToast.type === 'new_listing' ? (
                <ShoppingBag className="w-5 h-5" />
              ) : notif.activeToast.type.includes('driver') || notif.activeToast.type.includes('transit') ? (
                <Truck className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>

            <div
              className="flex-1 cursor-pointer pr-1"
              onClick={() => handleToastClick(notif.activeToast!)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {t(`notif_${notif.activeToast.type}_title`, notif.activeToast.title)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Just now</span>
              </div>
              <p className="text-sm font-medium text-slate-100 leading-snug line-clamp-2">
                {notif.activeToast.body}
              </p>
            </div>

            <button
              onClick={notif.dismissToast}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </NotificationContext.Provider>
  );
}

export function useInAppNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useInAppNotifications must be used within a NotificationProvider');
  }
  return context;
}
