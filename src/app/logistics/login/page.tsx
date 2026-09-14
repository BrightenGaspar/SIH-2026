'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import { ArrowLeft, Truck } from 'lucide-react';

export default function LogisticsLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      
      <div className="max-w-md w-full mx-auto">
        <Link href="/logistics" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Logistics Portal
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8">
        <Card className="bg-white border-slate-200 p-6 sm:p-8 shadow-xs rounded-2xl">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
              <Truck className="w-7 h-7 text-amber-600" />
            </div>
          </div>

          <PhoneAuthForm
            role="logistics"
            redirectUrl="/logistics/dashboard"
            roleTitle="Logistics Operator Login"
            roleSubtitle="Manage reefer dispatch fleets, driver assignments, and live telemetry."
            themeColor="amber"
          />

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>New carrier or fleet operator? </span>
            <Link href="/logistics/register" className="text-amber-600 font-bold hover:underline">
              Create Fleet Account
            </Link>
          </div>

        </Card>
      </div>

      <div className="text-center text-xs text-slate-400">
        AgriFlow AI &bull; Road Freight Logistics Portal
      </div>

    </div>
  );
}

