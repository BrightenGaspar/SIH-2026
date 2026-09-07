'use client';

import React from 'react';
import { DeliveryWaypoint, DeliveryStatus } from '@/types/delivery';
import { CheckCircle2, Clock, CircleDot, Circle } from 'lucide-react';

interface TrackingTimelineProps {
  waypoints: DeliveryWaypoint[];
  status: DeliveryStatus;
  isFarmerView?: boolean;
}

export default function TrackingTimeline({
  waypoints,
  status,
  isFarmerView = false,
}: TrackingTimelineProps) {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          {isFarmerView ? 'Farm Gate to Hub Route Progression' : 'Live Delivery Milestones'}
        </h3>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Road Transport Timeline
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {waypoints.map((point, idx) => {
          const isCurrent = point.current || (status === 'DELIVERED' && idx === waypoints.length - 1);
          const isDone = point.completed || status === 'DELIVERED';

          return (
            <div key={point.id || idx} className="relative flex items-start gap-4">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? isCurrent
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                      : 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-2.5 h-2.5" />
                )}
              </div>

              {/* Waypoint details */}
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      isDone
                        ? isCurrent
                          ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                          : 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {point.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    {point.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {point.location}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
