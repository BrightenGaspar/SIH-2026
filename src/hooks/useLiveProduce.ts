'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { consumerService, MarketplaceProduceItem } from '@/services/consumerService';
import { normalizeCategory } from '@/lib/categoryHelpers';

export interface UseLiveProduceReturn {
  items: MarketplaceProduceItem[];
  status: string;
  recentlyUpdatedIds: Set<string>;
  error: string | null;
  isLoading: boolean;
  reconnect: () => void;
}

/**
 * Custom React hook providing sub-second real-time synchronization of farmer produce inventory
 * with the consumer marketplace via Supabase Realtime (postgres_changes).
 */
export function useLiveProduce(): UseLiveProduceReturn {
  const [items, setItems] = useState<MarketplaceProduceItem[]>([]);
  const [status, setStatus] = useState<string>('CONNECTING');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reconnectKey, setReconnectKey] = useState<number>(0);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const reconnect = () => {
    setStatus('CONNECTING');
    setError(null);
    setReconnectKey((k) => k + 1);
  };

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
      setIsLoading(true);
      try {
        const list = await consumerService.listMarketplace();
        if (isMounted) {
          setItems(list);
          setError(null);
        }
      } catch (err: any) {
        console.error('useLiveProduce initial fetch error:', err);
        if (isMounted) {
          setError(err?.message || 'Database error: Unable to load produce from Supabase.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchInitial();

    // 2. Realtime WebSocket channel on the canonical live table only.
    // We intentionally do not subscribe to legacy public.produce because that can mix
    // a second source of data into the buyer marketplace and show duplicate or stale entries.
    const channel = supabase
      .channel(`produce-live-${reconnectKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produce_listings' },
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
            const qty = row.available_quantity != null ? Number(row.available_quantity) : Number(row.quantity_kg || row.quantity || 0);
            const price = row.price_per_unit != null ? Number(row.price_per_unit) : Number(row.price_per_kg || row.asking_price || 0);
            const updatedAt = row.updated_at || row.created_at || new Date().toISOString();
            const category = normalizeCategory(row.category, row.produce_name || row.crop_name, row.variety);
            const qualityGrade = (row.quality_grade || 'A').toUpperCase();

            // Trigger 1s "LIVE" pulse badge
            pulseUpdatedId(id);

            setItems((prev) => {
              const existingIndex = prev.findIndex((p) => p.id === id);
              if (existingIndex >= 0) {
                const nextList = [...prev];
                nextList[existingIndex] = {
                  ...prev[existingIndex],
                  crop_name: row.produce_name || row.crop_name || prev[existingIndex].crop_name,
                  variety: row.variety !== undefined ? row.variety : prev[existingIndex].variety,
                  category,
                  quality_grade: qualityGrade,
                  quantity_kg: qty,
                  price_per_kg: price > 0 ? price : prev[existingIndex].price_per_kg,
                  location: row.location_address || row.location || prev[existingIndex].location,
                  updated_at: updatedAt,
                  shelf_life_days: row.shelf_life_days ?? prev[existingIndex].shelf_life_days,
                  is_cold_chain: Boolean(
                    row.is_cold_chain ||
                    row.cold_chain_eligible ||
                    ['Vegetables', 'Fruits'].includes(category)
                  ),
                };
                return nextList
                  .filter((p) => p.quantity_kg > 0)
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
              } else if (qty > 0) {
                // New listing inserted via produce_listings
                const newItem: MarketplaceProduceItem = {
                  id,
                  farmer_id: row.farmer_id,
                  crop_name: row.produce_name || row.crop_name || 'Farm Harvest',
                  variety: row.variety || null,
                  category,
                  quality_grade: qualityGrade,
                  quantity_kg: qty,
                  price_per_kg: price,
                  location: row.location_address || row.location || 'Local FPO Hub',
                  harvest_date: row.harvest_date || null,
                  image_url: row.image_url || null,
                  updated_at: updatedAt,
                  created_at: row.created_at,
                  farmer_name: 'Verified Kisan Partner',
                  shelf_life_days: row.shelf_life_days ?? 7,
                  is_cold_chain: Boolean(
                    row.is_cold_chain ||
                    row.cold_chain_eligible ||
                    ['Vegetables', 'Fruits'].includes(category)
                  ),
                };
                return [newItem, ...prev]
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
              }
              return prev;
            });
          }
        }
      )
      .subscribe((channelStatus) => {
        if (isMounted) {
          setStatus(channelStatus);
          if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
            setError('Realtime sync is offline. Click reconnect to restore live sync.');
          }
        }
      });

    // Cleanup: removeChannel on unmount and clear pulse timers
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [reconnectKey]);

  return { items, status, recentlyUpdatedIds, error, isLoading, reconnect };
}

export default useLiveProduce;
