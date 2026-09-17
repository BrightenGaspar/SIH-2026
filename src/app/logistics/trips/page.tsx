'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { logisticsService, FLEET_DRIVERS_QUEUE } from '@/services/logisticsService';
import { ConsolidatedTrip } from '@/types/logistics';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { 
  Truck, 
  ArrowRight, 
  Navigation, 
  CheckCircle2, 
  Sparkles, 
  Flag, 
  Radio, 
  Bell, 
  Loader2, 
  Check, 
  Clock 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import RateAndReviewModal from '@/components/reviews/RateAndReviewModal';
import ReportModal from '@/components/reports/ReportModal';
import { UserRole, ReportType } from '@/types/review';

export default function LogisticsTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<ConsolidatedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingTripId, setAcceptingTripId] = useState<string | null>(null);
  const [justAcceptedTripId, setJustAcceptedTripId] = useState<string | null>(null);

  // Rating and Report Modal States
  const [selectedRatingTrip, setSelectedRatingTrip] = useState<{
    transactionId: string;
    targetUserId: string;
    targetRole: UserRole;
    targetName: string;
    productName?: string;
  } | null>(null);

  const [selectedReportData, setSelectedReportData] = useState<{
    reportType: ReportType;
    transactionId?: string;
    reportedName: string;
  } | null>(null);

  const loadTrips = async () => {
    try {
      const data = await logisticsService.getTrips();
      setTrips(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();

    // Realtime subscription on public.logistics_assignments and public.logistics_trips
    const channel = supabase
      .channel('realtime-logistics-trips')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_assignments',
        },
        async () => {
          const fresh = await logisticsService.getTrips();
          setTrips(fresh);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_trips',
        },
        async () => {
          const fresh = await logisticsService.getTrips();
          setTrips(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAcceptDelivery = async (tripId: string) => {
    try {
      setAcceptingTripId(tripId);
      const success = await logisticsService.acceptDispatchTrip(tripId, FLEET_DRIVERS_QUEUE[0]);
      if (success) {
        setJustAcceptedTripId(tripId);
        const fresh = await logisticsService.getTrips();
        setTrips(fresh);
      }
    } finally {
      setAcceptingTripId(null);
    }
  };

  // Separate pending dispatch requests from ongoing/completed trips
  const pendingRequests = trips.filter(
    (t) => t.status === 'DISPATCH_OFFERED' || (t.status as string) === 'DISPATCH_REQUESTED'
  );
  const activeTrips = trips.filter(
    (t) => t.status !== 'DISPATCH_OFFERED' && (t.status as string) !== 'DISPATCH_REQUESTED'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Active Consolidated Trips</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor multi-stop farm pickups, transit progress, driver phone GPS beacon pings, and APMC destination arrivals.
        </p>
      </div>

      {/* Just Accepted Notification Banner */}
      {justAcceptedTripId && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Haul Accepted Successfully!</h4>
              <p className="text-xs text-slate-400">
                Driver Mohammed Ismail (TS 08 UB 4192) assigned. Live GPS tracking is ready.
              </p>
            </div>
          </div>
          <Link href={`/logistics/track/${justAcceptedTripId}`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold whitespace-nowrap shadow-md">
              <Radio className="w-4 h-4 mr-1.5 animate-pulse" />
              <span>Launch Driver Phone GPS</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Real-time Incoming Dispatch Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Incoming Delivery Requests ({pendingRequests.length})
            </h2>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <Card 
                key={req.id} 
                className="p-5 border-2 border-cyan-500/40 bg-cyan-950/10 dark:bg-cyan-950/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-lg shadow-cyan-950/20"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {req.tripCode || req.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      Awaiting Carrier Acceptance
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {req.sourceHub} &rarr; {req.destinationHub}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                    <div>
                      <span className="block text-slate-500">Produce & Weight</span>
                      <strong className="text-slate-200">{req.commodity} ({req.totalKg.toLocaleString()} kg)</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Distance & ETA</span>
                      <strong className="text-slate-200">{req.totalDistanceKm || 75} km &bull; ~2 hrs</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Suggested Carrier</span>
                      <strong className="text-cyan-300">TS 08 UB 4192 (Tata 407 Reefer)</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptDelivery(req.id)}
                    disabled={acceptingTripId === req.id}
                    className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 px-6"
                  >
                    {acceptingTripId === req.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    <span>Accept Delivery</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active and Ongoing Trips List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-500" />
          Active Fleet Shipments ({activeTrips.length})
        </h2>

        {loading ? (
          <Card className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-sm">Connecting to Supabase Realtime & loading fleet trips...</p>
          </Card>
        ) : activeTrips.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300 dark:border-slate-800">
            <Truck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Shipments Right Now</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              When farmers confirm orders and declare harvest ready for pickup, new delivery dispatches will appear here immediately via Realtime.
            </p>
          </Card>
        ) : (
          activeTrips.map((trip) => (
            <Card key={trip.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-emerald-500/50 transition">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{trip.tripCode}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold">
                    {trip.status}
                  </span>
                  <span className="text-xs text-slate-400">&bull; Carrier: {trip.vehicle.vehicleNumber}</span>
                  {trip.vehicle.driverName && (
                    <span className="text-xs text-slate-400">&bull; Driver: {trip.vehicle.driverName}</span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{trip.sourceHub} &rarr; {trip.destinationHub}</h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="block text-slate-400">Commodity</span>
                    <strong className="text-slate-900 dark:text-white">{trip.commodity} ({trip.totalKg.toLocaleString()} kg)</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400">Reefer Climate</span>
                    <strong className="text-slate-400">
                      {trip.coldChainTemp != null ? `${trip.coldChainTemp}°C` : 'No live sensor connected'}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-slate-400">Distance</span>
                    <strong className="text-slate-900 dark:text-white">{trip.distanceCompletedKm} / {trip.totalDistanceKm || 75} km</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400">ETA</span>
                    <strong className="text-amber-500">{trip.estimatedArrival || 'In Transit'}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 min-w-[200px]">
                <Link href={`/logistics/track/${trip.id}`}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold w-full shadow-md shadow-emerald-600/20">
                    <Radio className="w-4 h-4 mr-1.5 animate-pulse" />
                    <span>Open Phone GPS Beacon</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href={`/consumer/tracking/${trip.id}`}>
                  <Button size="sm" variant="outline" className="text-slate-700 dark:text-slate-300 font-medium w-full border-slate-200 dark:border-slate-700">
                    <Navigation className="w-4 h-4 mr-1.5 text-amber-500" />
                    <span>Public Fleet Map</span>
                  </Button>
                </Link>

                {/* Rate Participants or Report */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRatingTrip({
                        transactionId: trip.id,
                        targetUserId: trip.farmerId || 'farmer_direct',
                        targetRole: 'FARMER',
                        targetName: `${trip.sourceHub} Dispatcher`,
                        productName: trip.commodity,
                      });
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 text-[11px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Rate Farmer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReportData({
                        reportType: 'LOGISTICS_SERVICE',
                        transactionId: trip.id,
                        reportedName: `Trip #${trip.tripCode} (${trip.sourceHub} -> ${trip.destinationHub})`,
                      });
                    }}
                    title="Report incident or payment dispute"
                    className="p-1 rounded-lg border border-slate-700 hover:bg-rose-950/40 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Reciprocal Rate Modal */}
      {selectedRatingTrip && (
        <RateAndReviewModal
          isOpen={true}
          onClose={() => setSelectedRatingTrip(null)}
          transactionId={selectedRatingTrip.transactionId}
          targetUserId={selectedRatingTrip.targetUserId}
          targetRole={selectedRatingTrip.targetRole}
          targetName={selectedRatingTrip.targetName}
          productName={selectedRatingTrip.productName}
          raterUserId={user?.id || 'logistics_operator'}
          raterRole="LOGISTICS"
          raterDisplayName={user?.name || 'AgriFlow Reefer Carrier Ops'}
        />
      )}

      {/* Report Modal */}
      {selectedReportData && (
        <ReportModal
          isOpen={true}
          onClose={() => setSelectedReportData(null)}
          reportType={selectedReportData.reportType}
          transactionId={selectedReportData.transactionId}
          reportedName={selectedReportData.reportedName}
          reporterUserId={user?.id || 'logistics_operator'}
          reporterRole="LOGISTICS"
          reporterDisplayName={user?.name || 'AgriFlow Reefer Carrier Ops'}
        />
      )}
    </div>
  );
}
