'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { farmerService } from '@/services/farmerService';
import { Produce } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FarmerImpactCard } from '@/components/farmer/FarmerImpactCard';
import { BestTimeToSellCard } from '@/components/farmer/BestTimeToSellCard';
import { GroupSellingCard } from '@/components/farmer/GroupSellingCard';
import {
  TrendingUp,
  AlertTriangle,
  Sprout,
  Plus,
  ArrowRight,
  Truck,
  MapPin,
  Thermometer,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [produceList, setProduceList] = useState<Produce[]>([]);

  useEffect(() => {
    setProduceList(farmerService.getProduceList());
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Farmer Command Center</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Namaste, {user?.name || 'Farmer'} 🌾</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {user?.farmName} • {user?.location}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/farmer/produce">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              <span>Add Produce</span>
            </Button>
          </Link>
          <Link href="/farmer/demand-map">
            <Button variant="secondary" size="sm">
              <MapPin className="w-4 h-4" />
              <span>Demand Map</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* TODAY'S TOP OPPORTUNITY ALERT */}
      <div className="bg-gradient-to-r from-emerald-900/60 to-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-2xl flex-shrink-0">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">High Opportunity</span>
              <span className="text-xs font-bold text-emerald-300">Hyderabad Urban Corridor</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">Tomato demand is 18% above local supply (1,800 kg deficit)</h2>
            <p className="text-xs text-slate-300">Bowenpally direct buyer offering <strong>₹42.00/kg</strong> vs current mandi ₹38.00/kg.</p>
          </div>
        </div>
        <Link href="/farmer/recommendations">
          <Button variant="primary" size="sm" className="flex-shrink-0">
            <span>View Opportunity</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* SIH Realization & Impact Advantage */}
      <FarmerImpactCard />

      {/* 2-Column AI & Group Selling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BestTimeToSellCard />
        <GroupSellingCard />
      </div>

      {/* Active Road Logistics Live Telemetry Widget */}
      <Card className="bg-slate-900/90 border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Active Road Logistics Dispatch</h3>
              <p className="text-xs text-slate-400">Tata 407 Reefer (TS 08 UB 4192) • Driver: Mohammed Ismail</p>
            </div>
          </div>
          <Link href="/farmer/tracking/TRK-RD-9021">
            <Button variant="outline" size="sm">
              <span>View Live Road Tracking</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block">Current Status</span>
            <span className="text-sm font-bold text-amber-400 block mt-0.5">In Transit (ORR Tollway)</span>
            <span className="text-[10px] text-slate-400">Speed: 52 km/h</span>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block">Cold-Chain Temp</span>
            <span className="text-sm font-bold text-emerald-400 block mt-0.5 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5" /> 6.2°C (Optimal)
            </span>
            <span className="text-[10px] text-slate-400">Target: 6.0°C</span>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block">Remaining Safe Window</span>
            <span className="text-sm font-bold text-white block mt-0.5">04h 32m</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Low Spoilage Risk</span>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block">Estimated Arrival (ETA)</span>
            <span className="text-sm font-bold text-white block mt-0.5">Today, 05:45 PM</span>
            <span className="text-[10px] text-slate-400">Bowenpally Hub Gate 3</span>
          </div>
        </div>
      </Card>

      {/* My Produce Snapshot Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Current Produce Inventory</h3>
          </div>
          <Link href="/farmer/produce" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            View All ({produceList.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Crop</th>
                <th className="pb-3 font-semibold">Quantity</th>
                <th className="pb-3 font-semibold">Grade</th>
                <th className="pb-3 font-semibold">Expected Realization</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {produceList.slice(0, 3).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 font-bold text-slate-900 dark:text-white">{item.crop}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{item.quantity.toLocaleString()} {item.unit}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold text-[10px]">
                      Grade {item.grade}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatINR(item.expectedPrice)}/{item.unit}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{item.location}</td>
                  <td className="py-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
