'use client';

import React, { useState, useEffect } from 'react';
import { logisticsService, FLEET_DRIVERS_QUEUE, FleetDriverCandidate } from '@/services/logisticsService';
import { supabase } from '@/lib/supabase';
import { ConsolidatedTrip } from '@/types/logistics';
import { 
  Bell, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ThermometerSnowflake, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface DriverDispatchModalProps {
  onTripAccepted?: (trip: ConsolidatedTrip) => void;
}

export function DriverDispatchModal({ onTripAccepted }: DriverDispatchModalProps) {
  const [pendingTrip, setPendingTrip] = useState<ConsolidatedTrip | null>(null);
  const [driverIndex, setDriverIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isDeclining, setIsDeclining] = useState<boolean>(false);

  const currentDriver: FleetDriverCandidate = FLEET_DRIVERS_QUEUE[driverIndex] || FLEET_DRIVERS_QUEUE[0];

  // Realtime subscription for incoming dispatch offers (zero polling loop)
  useEffect(() => {
    let isMounted = true;

    const checkDispatch = async () => {
      try {
        const trip = await logisticsService.getPendingDispatchTrip();
        if (isMounted) {
          if (trip) {
            setPendingTrip(trip);
            setIsOpen(true);
          } else if (!isAccepting && !isDeclining) {
            setIsOpen(false);
          }
        }
      } catch {
        // ignore fetch error
      }
    };

    checkDispatch();

    const channel = supabase
      .channel('realtime-driver-dispatch-modal')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logistics_assignments' },
        () => {
          checkDispatch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          checkDispatch();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isAccepting, isDeclining]);

  const handleAccept = async () => {
    if (!pendingTrip) return;
    setIsAccepting(true);
    setStatusMessage(`Assigning haul to ${currentDriver.name} (${currentDriver.vehicleNumber})...`);

    try {
      await logisticsService.acceptDispatchTrip(pendingTrip.id, currentDriver);
      setStatusMessage(`✓ Haul Confirmed! Vehicle assigned and cold-chain route active.`);
      
      setTimeout(() => {
        setIsAccepting(false);
        setIsOpen(false);
        setPendingTrip(null);
        if (onTripAccepted) {
          onTripAccepted({
            ...pendingTrip,
            status: 'IN TRANSIT',
            vehicle: {
              ...pendingTrip.vehicle,
              driverName: currentDriver.name,
              driverPhone: currentDriver.phone,
              vehicleNumber: currentDriver.vehicleNumber,
              vehicleType: currentDriver.vehicleType as any,
              status: 'In Transit',
            },
          });
        }
      }, 1500);
    } catch {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!pendingTrip) return;
    setIsDeclining(true);
    const declinedName = currentDriver.name;

    try {
      const { nextDriver, nextIndex } = await logisticsService.declineDispatchTrip(pendingTrip.id, driverIndex);
      setDriverIndex(nextIndex);
      setStatusMessage(`❌ ${declinedName} declined. Cascading dispatch offer to Driver #${nextIndex + 1} (${nextDriver.name})...`);

      setTimeout(() => {
        setIsDeclining(false);
        setStatusMessage(null);
      }, 1800);
    } catch {
      setIsDeclining(false);
    }
  };

  if (!isOpen || !pendingTrip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border-2 border-amber-500/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Pulsing Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-950"></span>
            </span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider">Live Driver Dispatch Broadcast</div>
              <h3 className="text-base font-black leading-tight">New Consignment Available</h3>
            </div>
          </div>
          <div className="bg-slate-950/20 px-2.5 py-1 rounded-full text-xs font-black">
            Trip #{pendingTrip.id.slice(-6)}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Cascade Status Flash Notice */}
          {statusMessage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs font-bold text-amber-900 dark:text-amber-300 animate-pulse flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Commodity & Route Card */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Consignment Cargo</span>
                <h4 className="text-lg font-black text-zinc-900 dark:text-white mt-0.5">
                  {pendingTrip.commodity}
                </h4>
              </div>
              <span className="text-sm font-black px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {pendingTrip.totalKg.toLocaleString()} kg
              </span>
            </div>

            {/* Route */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium text-zinc-400">Pickup:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{pendingTrip.sourceHub}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium text-zinc-400">Destination:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{pendingTrip.destinationHub}</span>
              </div>
            </div>

            {/* Specs row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-center">
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Distance</span>
                <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">{pendingTrip.totalDistanceKm} km</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Cold Chain</span>
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-1">
                  <ThermometerSnowflake className="w-3 h-3" /> 2-8°C
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Driver Pay</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {formatINR(Math.round(pendingTrip.totalKg * 1.4 + 2000))}
                </span>
              </div>
            </div>
          </div>

          {/* Currently Offered Candidate Driver Card */}
          <div className="p-4 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Offered to Driver ({driverIndex + 1} of {FLEET_DRIVERS_QUEUE.length} in Queue)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                Auto-Cascades on Decline
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-zinc-900 dark:text-white">{currentDriver.name}</div>
                <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                  <span>{currentDriver.vehicleNumber}</span>
                  <span>•</span>
                  <span>{currentDriver.vehicleType}</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  📍 {currentDriver.currentLocation}
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
              className="py-3 px-4 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>{isDeclining ? 'Re-routing...' : 'Decline (Next Driver)'}</span>
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={isDeclining || isAccepting}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAccepting ? 'Confirming...' : 'Accept & Start Haul'}</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-zinc-400">
            If you decline, the haul automatically alerts the next available driver in the fleet queue until accepted.
          </p>
        </div>
      </div>
    </div>
  );
}
