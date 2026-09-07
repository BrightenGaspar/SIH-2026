'use client';

import React from 'react';
import { Clock, MapPin, Navigation, TrendingUp } from 'lucide-react';

interface ETACardProps {
  estimatedArrival: string;
  etaMinutes: number;
  distanceRemainingKm: number;
  distanceCompletedKm: number;
  totalDistanceKm: number;
  progressPercentage: number;
  currentLocationName: string;
}

export default function ETACard({
  estimatedArrival,
  etaMinutes,
  distanceRemainingKm,
  distanceCompletedKm,
  totalDistanceKm,
  progressPercentage,
  currentLocationName,
}: ETACardProps) {
  const hrs = Math.floor(etaMinutes / 60);
  const mins = etaMinutes % 60;
  const timeRemainingStr = hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Estimated Arrival */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Estimated Arrival
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {timeRemainingStr}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {estimatedArrival}
          </div>
        </div>

        {/* Distance Remaining */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-500" /> Road Distance
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {distanceCompletedKm} km of {totalDistanceKm} km
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {distanceRemainingKm} <span className="text-base font-normal text-slate-500">km remaining</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
            <span>{currentLocationName}</span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
            {progressPercentage}% Completed
          </span>
        </div>
        <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
