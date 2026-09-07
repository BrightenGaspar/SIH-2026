'use client';

import React from 'react';
import { DeliveryStatus } from '@/types/delivery';
import { Truck, CheckCircle2, Clock, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

interface DeliveryStatusCardProps {
  status: DeliveryStatus;
  orderId: string;
  tripId: string;
  isFarmerView?: boolean;
}

export default function DeliveryStatusCard({
  status,
  orderId,
  tripId,
  isFarmerView = false,
}: DeliveryStatusCardProps) {
  const getHeadline = () => {
    switch (status) {
      case 'ORDER CONFIRMED':
        return isFarmerView ? 'Produce Order Confirmed' : 'Order Confirmed & Scheduled';
      case 'PICKUP SCHEDULED':
        return isFarmerView ? 'Pickup Scheduled at Farm Gate' : 'Pickup Scheduled from FPO';
      case 'DRIVER ASSIGNED':
        return 'Reefer Driver Assigned & En Route';
      case 'PICKUP STARTED':
        return isFarmerView ? 'Driver Arrived for Farm Gate Loading' : 'Loading at Regional Farm Hub';
      case 'PRODUCE PICKED UP':
        return isFarmerView ? 'Produce Loaded & Graded' : 'Harvest Loaded & Quality Graded';
      case 'IN TRANSIT':
        return isFarmerView ? 'Your Produce is on the Road' : 'Your Delivery is On the Way';
      case 'APPROACHING DESTINATION':
        return isFarmerView ? 'Shipment Approaching Destination Terminal' : 'Delivery Approaching Your Location';
      case 'ARRIVED':
        return isFarmerView ? 'Arrived at Destination Hub' : 'Carrier Arrived at Gate';
      case 'DELIVERED':
        return isFarmerView ? 'Produce Delivered & Escrow Released' : 'Order Delivered Successfully';
      default:
        return 'Live Delivery in Progress';
    }
  };

  const getBadgeColor = () => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'IN TRANSIT':
      case 'APPROACHING DESTINATION':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'ORDER CONFIRMED':
      case 'PICKUP SCHEDULED':
      case 'DRIVER ASSIGNED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getBadgeColor()}`}>
            ● {status}
          </span>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            Trip: {tripId}
          </span>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            Order: {orderId}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>SIMULATED LIVE TRACKING</span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {getHeadline()}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {isFarmerView
            ? 'Real-time telemetry and waypoint tracking for your dispatched harvest batches.'
            : 'Track your incoming farm-fresh produce with live cold-chain climate data.'}
        </p>
      </div>
    </div>
  );
}
