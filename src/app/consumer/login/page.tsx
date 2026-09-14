'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import { Store, ArrowLeft } from 'lucide-react';

export default function ConsumerLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full mx-auto">
        <Link
          href="/consumer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Consumer Portal
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8">
        <Card className="bg-white border-slate-200 p-6 sm:p-8 shadow-xs rounded-2xl space-y-6">
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-3">
              <Store className="w-7 h-7 text-blue-600" />
            </div>
          </div>

          <PhoneAuthForm
            role="consumer"
            redirectUrl="/consumer/dashboard"
            roleTitle="Buyer Portal Login"
            roleSubtitle="Direct farm-gate access with escrow safety & quality assurance"
            themeColor="blue"
          />

          <div className="pt-2 text-center text-xs text-slate-500">
            New buyer on AgriFlow?{' '}
            <Link href="/consumer/register" className="font-bold text-blue-600 hover:underline">
              Create an Account
            </Link>
          </div>
        </Card>
      </div>

      <div className="text-center text-xs text-slate-400">
        AgriFlow AI &bull; Smart India Hackathon Verified Consumer Marketplace
      </div>
    </div>
  );
}

