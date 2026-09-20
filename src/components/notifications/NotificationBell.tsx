'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useInAppNotifications } from '@/context/NotificationContext';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Package,
  Truck,
  ShoppingBag,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { InAppNotification } from '@/hooks/useNotifications';

function formatRelativeTime(dateString: string): string {
  try {
    const delta = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (delta < 60) return 'Just now';
    if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
    if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
    return `${Math.floor(delta / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

export function NotificationBell({ className = '' }: { className?: string }) {
  const { items, unread, markRead, markAllRead, isLoading } = useInAppNotifications();
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.read_at) {
      await markRead(notif.id);
    }
    setIsOpen(false);

    if (notif.data?.order_id) {
      if (currentUser?.role === 'farmer') {
        router.push('/farmer/orders');
      } else if (currentUser?.role === 'logistics') {
        router.push('/logistics/trips');
      } else {
        router.push(`/consumer/tracking/${notif.data.order_id}`);
      }
    } else if (notif.data?.listing_id) {
      if (currentUser?.role === 'farmer') {
        router.push('/farmer/produce');
      } else {
        router.push('/consumer/marketplace');
      }
    } else if (notif.data?.assignment_id) {
      router.push(`/logistics/track/${notif.data.assignment_id}`);
    }
  };

  const getIconForType = (type: string) => {
    if (type === 'new_listing') {
      return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    }
    if (type.includes('driver') || type.includes('transit') || type.includes('pickup') || type.includes('dispatch')) {
      return <Truck className="w-4 h-4 text-blue-500" />;
    }
    return <Package className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className="relative p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {t('notifications', 'Notifications')}
              </span>
              {unread > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {unread} new
                </span>
              )}
            </div>

            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('markAllRead', 'Mark all read')}</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading && items.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {t('loading', 'Loading notifications...')}
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t('noNotifications', 'No notifications yet')}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Real-time order and shipment updates will appear here.
                </p>
              </div>
            ) : (
              items.map((notif) => {
                const isUnread = !notif.read_at;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 cursor-pointer transition-colors flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      isUnread
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'bg-transparent opacity-85'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getIconForType(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isUnread
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {t(`notif_${notif.type}_title`, notif.title)}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 inline" />
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>

                      {isUnread && (
                        <span className="inline-block mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          • Unread
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 self-center" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
