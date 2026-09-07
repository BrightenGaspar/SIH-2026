'use client';

import React from 'react';
import { RoadVehicleType } from '@/types/delivery';
import { Truck, Phone, ShieldCheck, UserCheck } from 'lucide-react';

interface DriverCardProps {
  driverName: string;
  driverPhone: string;
  vehicleType: RoadVehicleType;
  vehicleNumber: string;
  isFarmerView?: boolean;
}

export default function DriverCard({
  driverName,
  driverPhone,
  vehicleType,
  vehicleNumber,
  isFarmerView = false,
}: DriverCardProps) {
  const [called, setCalled] = React.useState(false);

  const handleSimulatedCall = () => {
    setCalled(true);
    setTimeout(() => setCalled(false), 4000);
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-emerald-500" /> Carrier & Driver Info
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Verified Carrier
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Vehicle Specification</span>
            <strong className="text-sm font-black text-slate-900 dark:text-white">
              {vehicleType}
            </strong>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            {vehicleNumber}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block">Assigned Road Driver</span>
            <strong className="text-sm font-bold text-slate-900 dark:text-white">
              {driverName}
            </strong>
          </div>
          <button
            type="button"
            onClick={handleSimulatedCall}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact Driver</span>
          </button>
        </div>

        {called && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-600 dark:text-emerald-400 text-center font-bold animate-fadeIn">
            📞 Simulated Call Connected: Dialing {driverPhone} (Driver Mohammed Ismail)
          </div>
        )}
      </div>
    </div>
  );
}
