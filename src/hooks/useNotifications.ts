'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface InAppNotification {
  id: string;
  user_id: string;
  type:
    | 'new_listing'
    | 'order_received'
    | 'order_accepted'
    | 'order_rejected'
    | 'order_preparing'
    | 'ready_for_pickup'
    | 'dispatch_ready'
    | 'driver_assigned'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'order_completed'
    | string;
  title: string;
  body: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface UseNotificationsResult {
  items: InAppNotification[];
  unread: number;
  isLoading: boolean;
  activeToast: InAppNotification | null;
  dismissToast: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Optional audio chime on notification arrival via Web Audio API synth (zero external mp3 needed)
function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
}

export function useNotifications(userId?: string): UseNotificationsResult {
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<InAppNotification | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const triggerToast = useCallback(
    (notif: InAppNotification) => {
      setActiveToast(notif);
      playNotificationChime();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 5500);
    },
    []
  );

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setItems(data as InAppNotification[]);
      }
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }

    // Initial load
    load();

    // Supabase Realtime channel scoped strictly to this authenticated user
    const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as InAppNotification;
          if (!newNotif) return;
          setItems((prev) => {
            // Deduplicate if already present
            if (prev.some((item) => item.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          triggerToast(newNotif);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as InAppNotification;
          if (!updated) return;
          setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
        }
      )
      .subscribe((status) => {
        // Automatically refetch on reconnect (critical for mobile network resiliency)
        if (status === 'SUBSCRIBED') {
          load();
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [userId, load, triggerToast]);

  const unread = items.filter((i) => !i.read_at).length;

  const markRead = async (id: string) => {
    const now = new Date().toISOString();
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read_at: now } : i))
    );

    try {
      await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', id);
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((i) => !i.read_at).map((i) => i.id);
    if (unreadIds.length === 0) return;

    const now = new Date().toISOString();
    // Optimistic UI update
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at || now })));

    try {
      await supabase
        .from('notifications')
        .update({ read_at: now })
        .in('id', unreadIds);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  return {
    items,
    unread,
    isLoading,
    activeToast,
    dismissToast,
    markRead,
    markAllRead,
    refresh: load,
  };
}
