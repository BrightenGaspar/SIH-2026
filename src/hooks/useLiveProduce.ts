'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { consumerService, MarketplaceProduceItem } from '@/services/consumerService';

export interface UseLiveProduceReturn {
  items: MarketplaceProduceItem[];
  status: string;
  recentlyUpdatedIds: Set<string>;
}

/**
 * Custom React hook providing sub-second real-time synchronization of farmer produce inventory
 * with the consumer marketplace via Supabase Realtime (postgres_changes).
 */
export function useLiveProduce(): UseLiveProduceReturn {
  const [items, setItems] = useState<MarketplaceProduceItem[]>([]);
  const [status, setStatus] = useState<string>('CONNECTING');
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper to trigger 1-second pulsing "LIVE" badge for updated item
  const pulseUpdatedId = (id: string) => {
    if (!id) return;
    setRecentlyUpdatedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const existingTimer = timersRef.current.get(id);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      setRecentlyUpdatedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      timersRef.current.delete(id);
    }, 1000);

    timersRef.current.set(id, timer);
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial fetch on mount directly from live Supabase produce table
    async function fetchInitial() {
      try {
        const list = await consumerService.listMarketplace();
        if (isMounted) {
          setItems(list);
        }
      } catch (err) {
        console.error('useLiveProduce initial fetch error:', err);
      }
    }
    fetchInitial();

    // 2. Realtime WebSocket channel on public.produce
    const channel = supabase
      .channel('produce-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produce' },
        (payload: any) => {
          if (!isMounted) return;

          const eventType = payload.eventType;

          if (eventType === 'DELETE') {
            const deletedId = String(payload.old?.id);
            setItems((prev) => prev.filter((p) => p.id !== deletedId));
          } else {
            const row = payload.new;
            if (!row || !row.id) return;

            const id = String(row.id);
            const qty = row.quantity_kg != null ? Number(row.quantity_kg) : Number(row.quantity || 0);
            const price = row.price_per_kg != null ? Number(row.price_per_kg) : Number(row.asking_price || 0);
            const updatedAt = row.updated_at || row.created_at || new Date().toISOString();

            const updatedItem: MarketplaceProduceItem = {
              id,
              farmer_id: row.farmer_id,
              crop_name: row.crop_name || 'Farm Harvest',
              variety: row.variety || null,
              quantity_kg: qty,
              price_per_kg: price,
              location: row.location || 'Local FPO Hub',
              harvest_date: row.harvest_date || null,
              image_url: row.image_url || null,
              updated_at: updatedAt,
              created_at: row.created_at,
              farmer_name: 'Verified Kisan Partner',
            };

            // Trigger 1s "LIVE" pulse badge
            pulseUpdatedId(id);

            setItems((prev) => {
              const existingIndex = prev.findIndex((p) => p.id === id);
              let nextList: MarketplaceProduceItem[];

              if (existingIndex >= 0) {
                nextList = [...prev];
                nextList[existingIndex] = updatedItem;
              } else {
                nextList = [updatedItem, ...prev];
              }

              return nextList
                .filter((p) => p.quantity_kg > 0)
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            });
          }
        }
      )
      .subscribe((channelStatus) => {
        if (isMounted) {
          setStatus(channelStatus);
        }
      });

    // Cleanup: removeChannel on unmount and clear pulse timers
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  return { items, status, recentlyUpdatedIds };
}

export default useLiveProduce;
