'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DeliveryTracking } from '@/types/delivery';
import { sharedTrackingService } from '@/services/sharedTrackingService';

interface TrackingContextType {
  getTrip: (id: string) => DeliveryTracking | null;
  activeTrip: DeliveryTracking | null;
  setActiveTripId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  refreshTrip: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

const DEFAULT_TRIP_ID = 'TRK-CONS-ROAD-9021';

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [activeTripId, setActiveTripId] = useState<string>(DEFAULT_TRIP_ID);
  const [activeTrip, setActiveTrip] = useState<DeliveryTracking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = useCallback(async () => {
    if (!activeTripId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await sharedTrackingService.getTracking(activeTripId);
      setActiveTrip(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch tracking data');
      setActiveTrip(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Subscribe to real-time WebSocket updates from backend
  useEffect(() => {
    if (!activeTripId) return;

    const unsubscribe = sharedTrackingService.subscribe(
      activeTripId,
      (updatedTrip) => {
        setActiveTrip(updatedTrip);
      },
      () => {
        // Handled silently or state set
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTripId]);

  const getTrip = useCallback((id: string): DeliveryTracking | null => {
    if (id === activeTrip?.id || id === activeTrip?.tripId || id === activeTrip?.orderId) {
      return activeTrip;
    }
    return null;
  }, [activeTrip]);

  return (
    <TrackingContext.Provider
      value={{
        getTrip,
        activeTrip,
        setActiveTripId,
        isLoading,
        error,
        refreshTrip: fetchTrip,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}
