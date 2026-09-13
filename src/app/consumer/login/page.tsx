'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import { Store, ArrowLeft } from 'lucide-react';

export default function ConsumerLoginPage() {
  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/consumer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Consumer Portal
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7" />
          </div>
        </div>

        <PhoneAuthForm
          role="consumer"
          redirectUrl="/consumer/dashboard"
          roleTitle="Buyer Portal Login"
          roleSubtitle="Direct farm-gate access with escrow safety & quality assurance"
          themeColor="blue"
        />

        <div className="pt-2 text-center text-xs text-zinc-400">
          New buyer on AgriFlow?{' '}
          <Link href="/consumer/register" className="font-bold text-blue-400 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-zinc-500">
        AgriFlow AI &bull; Smart India Hackathon Verified Consumer Marketplace
      </div>
    </div>
  );
}
