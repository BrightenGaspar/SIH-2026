'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import { ArrowLeft, Truck } from 'lucide-react';

export default function LogisticsLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      
      <div className="max-w-md w-full mx-auto">
        <Link href="/logistics" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Logistics Portal
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8">
        <Card className="bg-slate-900 border-slate-800 p-8 shadow-2xl">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
              <Truck className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <PhoneAuthForm
            role="logistics"
            redirectUrl="/logistics/dashboard"
            roleTitle="Logistics Operator Login"
            roleSubtitle="Manage reefer dispatch fleets, driver assignments, and live telemetry."
            themeColor="amber"
          />

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>New carrier or fleet operator? </span>
            <Link href="/logistics/register" className="text-amber-400 font-bold hover:underline">
              Create Fleet Account
            </Link>
          </div>

        </Card>
      </div>

      <div className="text-center text-xs text-slate-500">
        AgriFlow AI &bull; Road Freight Logistics Portal
      </div>

    </div>
  );
}
