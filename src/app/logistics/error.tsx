'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Truck, RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default function LogisticsErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Compartmentalized Error - Logistics Portal]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 sm:p-8 shadow-lg text-center space-y-5">
        
        {/* Isolated Portal Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" />
          <span>Logistics Fleet Isolated Error</span>
        </div>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Heading & Notice */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Logistics Portal Encountered an Issue
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This issue is strictly compartmentalized to the Logistics Fleet module. Farmer produce inventories, market prices, and consumer marketplace operations are completely unaffected and operational.
          </p>
        </div>

        {/* Technical Error Snippet (Safe) */}
        {error.message && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-400 text-left overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}

        {/* Recovery Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recover Logistics Portal</span>
          </button>

          <Link
            href="/logistics/dashboard"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>Fleet Dashboard</span>
          </Link>
        </div>

        <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          AgriFlow Compartmentalization Engine &bull; Fault-Isolated Logistics Domain
        </div>

      </div>
    </div>
  );
}
