'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { User, Tractor, MapPin, Phone, Mail, ShieldCheck, Sprout } from 'lucide-react';

export default function FarmerProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Farmer / FPO Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified digital profile for institutional direct buyer matching.</p>
      </div>

      <Card className="p-8 space-y-6">
        
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-2xl">
            {user?.name ? user.name[0] : 'F'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Verified Farmer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.farmName} • {user?.farmerType}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800">
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number</span>
            <span className="text-sm font-bold text-white block">{user?.phone}</span>
          </div>

          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-emerald-400" /> Email</span>
            <span className="text-sm font-bold text-white block">{user?.email || 'N/A'}</span>
          </div>

          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location / Cluster</span>
            <span className="text-sm font-bold text-white block">{user?.location}</span>
          </div>

          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5"><Tractor className="w-3.5 h-3.5 text-emerald-400" /> Total Farm Size</span>
            <span className="text-sm font-bold text-white block">{user?.farmSize}</span>
          </div>
        </div>

        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
          <span className="font-bold text-slate-300 block flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-400" /> Registered Primary Crops:
          </span>
          <div className="flex flex-wrap gap-2">
            {user?.primaryCrops?.map((crop: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold">
                {crop}
              </span>
            ))}
          </div>
        </div>

      </Card>

    </div>
  );
}
