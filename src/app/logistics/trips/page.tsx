'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { logisticsService } from '@/services/logisticsService';
import { ConsolidatedTrip } from '@/types/logistics';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Truck, ArrowRight, Navigation, CheckCircle2, Sparkles, Flag } from 'lucide-react';
import RateAndReviewModal from '@/components/reviews/RateAndReviewModal';
import ReportModal from '@/components/reports/ReportModal';
import { UserRole, ReportType } from '@/types/review';

export default function LogisticsTripsPage() {
  const [trips, setTrips] = useState<ConsolidatedTrip[]>([]);

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

  useEffect(() => {
    logisticsService.getTrips().then(setTrips);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Active Consolidated Trips</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor multi-stop farm pickups, transit progress, and destination arrivals.
        </p>
      </div>

      <div className="space-y-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">{trip.tripCode}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-bold">
                  {trip.status}
                </span>
                <span className="text-xs text-slate-400">&bull; Carrier: {trip.vehicle.vehicleNumber}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{trip.sourceHub} &rarr; {trip.destinationHub}</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <span className="block text-slate-400">Commodity</span>
                  <strong className="text-slate-900 dark:text-white">{trip.commodity} ({trip.totalKg} kg)</strong>
                </div>
                <div>
                  <span className="block text-slate-400">Reefer Climate</span>
                  <strong className="text-emerald-500">{trip.coldChainTemp}°C (Low Risk)</strong>
                </div>
                <div>
                  <span className="block text-slate-400">Distance</span>
                  <strong className="text-slate-900 dark:text-white">{trip.distanceCompletedKm} / {trip.totalDistanceKm} km</strong>
                </div>
                <div>
                  <span className="block text-slate-400">ETA</span>
                  <strong className="text-amber-500">{trip.estimatedArrival}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Link href={`/consumer/tracking/${trip.id}`}>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold w-full">
                  <Navigation className="w-4 h-4 mr-1.5" />
                  <span>Live GPS Map</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>

              {/* Rate Participants or Report */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRatingTrip({
                      transactionId: trip.id,
                      targetUserId: 'farmer_01',
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
        ))}
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
          raterUserId="logistics_01"
          raterRole="LOGISTICS"
          raterDisplayName="AgriFlow Reefer Carrier Ops"
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
          reporterUserId="logistics_01"
          reporterRole="LOGISTICS"
          reporterDisplayName="AgriFlow Reefer Carrier Ops"
        />
      )}
    </div>
  );
}
