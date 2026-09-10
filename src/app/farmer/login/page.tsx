'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import { ArrowLeft, Sprout } from 'lucide-react';

export default function FarmerLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      
      {/* Back link */}
      <div className="max-w-md w-full mx-auto">
        <Link href="/farmer" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Farmer Portal
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8">
        <Card className="bg-slate-900 border-slate-800 p-8 shadow-2xl">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
              <Sprout className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <PhoneAuthForm
            role="farmer"
            redirectUrl="/farmer/dashboard"
            roleTitle="Farmer / FPO Login"
            roleSubtitle="Manage your harvest, discover live wholesale demand, and eliminate middlemen."
            themeColor="emerald"
          />

        </Card>
      </div>

      <div className="text-center text-xs text-slate-500">
        AgriFlow AI &bull; Smart India Hackathon Verified Direct Trade System
      </div>

    </div>
  );
}
