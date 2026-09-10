'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  TrendingUp, 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle2, 
  DollarSign, 
  Package, 
  Flame, 
  CloudRain,
  ChevronRight,
  Info
} from 'lucide-react';
import { calculateWeatherShock } from '@/services/weatherShockService';
import { calculateProfitability } from '@/services/profitabilityService';
import { evaluateStorageVsSell } from '@/services/storageOptimizerService';
import { cn } from '@/lib/utils';

export function WhatIfSimulator() {
  // Configurable dynamic inputs
  const [expectedHarvestKg, setExpectedHarvestKg] = useState<number>(1000);
  const [damagePercent, setDamagePercent] = useState<number>(40);
  const [expectedDemandKg, setExpectedDemandKg] = useState<number>(1000);
  const [baseMarketPrice, setBaseMarketPrice] = useState<number>(42.0);
  const [priceElasticity, setPriceElasticity] = useState<number>(0.65);
  const [productionCost, setProductionCost] = useState<number>(18000);
  const [recoveryCost, setRecoveryCost] = useState<number>(2000);
  const [transportCost, setTransportCost] = useState<number>(1500);
  const [storageDays, setStorageDays] = useState<number>(5);
  const [maxConfiguredPrice, setMaxConfiguredPrice] = useState<number>(60.0);

  // Quick preset scenarios
  const applyPreset = (presetName: 'benchmark' | 'cyclone' | 'surplus' | 'demandDrop') => {
    if (presetName === 'benchmark') {
      setExpectedHarvestKg(1000);
      setDamagePercent(40);
      setExpectedDemandKg(1000);
      setBaseMarketPrice(42.0);
      setPriceElasticity(0.65);
      setProductionCost(18000);
      setRecoveryCost(2000);
      setTransportCost(1500);
      setStorageDays(5);
    } else if (presetName === 'cyclone') {
      setExpectedHarvestKg(1500);
      setDamagePercent(65);
      setExpectedDemandKg(1200);
      setBaseMarketPrice(45.0);
      setPriceElasticity(0.75);
      setProductionCost(24000);
      setRecoveryCost(4500);
      setTransportCost(2000);
      setStorageDays(3);
    } else if (presetName === 'surplus') {
      setExpectedHarvestKg(2000);
      setDamagePercent(5);
      setExpectedDemandKg(1400);
      setBaseMarketPrice(38.0);
      setPriceElasticity(0.50);
      setProductionCost(22000);
      setRecoveryCost(500);
      setTransportCost(2500);
      setStorageDays(7);
    } else if (presetName === 'demandDrop') {
      setExpectedHarvestKg(1000);
      setDamagePercent(40);
      setExpectedDemandKg(700);
      setBaseMarketPrice(42.0);
      setPriceElasticity(0.65);
      setProductionCost(18000);
      setRecoveryCost(2000);
      setTransportCost(1500);
      setStorageDays(5);
    }
  };

  // Pure dynamic calculations
  const dynamicResults = useMemo(() => {
    const damagedKg = Math.round((expectedHarvestKg * damagePercent) / 100);

    const shock = calculateWeatherShock({
      commodity: 'Tomato (Hybrid Desi)',
      expectedHarvestKg,
      damagedHarvestKg: damagedKg,
      expectedMarketDemandKg: expectedDemandKg,
      baseMarketPrice,
      priceElasticity,
      maxConfiguredPrice,
      totalProductionCost: productionCost,
      recoveryCost,
      transportCost,
      weatherEventType: 'Excessive Rainfall',
    });

    const profit = calculateProfitability({
      marketableQuantityKg: shock.marketableSupplyKg,
      sellingPricePerKg: shock.safetyClampedPredictedPrice,
      productionCost,
      recoveryCost,
      transportCost,
    });

    const storage = evaluateStorageVsSell({
      commodity: 'Tomato (Hybrid Desi)',
      marketableQuantityKg: shock.marketableSupplyKg,
      currentSellingPrice: shock.safetyClampedPredictedPrice,
      projectedFuturePrice: Number((shock.safetyClampedPredictedPrice * 1.08).toFixed(2)),
      storageDays,
    });

    return { shock, profit, storage, damagedKg };
  }, [
    expectedHarvestKg,
    damagePercent,
    expectedDemandKg,
    baseMarketPrice,
    priceElasticity,
    productionCost,
    recoveryCost,
    transportCost,
    storageDays,
    maxConfiguredPrice,
  ]);

  const { shock, profit, storage, damagedKg } = dynamicResults;

  return (
    <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5'>
        <div>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
              <Sliders className='w-4 h-4' />
            </div>
            <h2 className='text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white'>
              Interactive What-If Market & Weather Simulator
            </h2>
          </div>
          <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1'>
            Adjust parameters to see dynamic real-time recalculations of price shocks, sustainable floor, and profit margins.
          </p>
        </div>

        {/* Presets */}
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-xs font-semibold text-slate-400'>Presets:</span>
          <button
            type='button'
            onClick={() => applyPreset('benchmark')}
            className='px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition'
          >
            ★ SIH Benchmark (40% Loss)
          </button>
          <button
            type='button'
            onClick={() => applyPreset('demandDrop')}
            className='px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition'
          >
            Lower Demand (700 kg)
          </button>
          <button
            type='button'
            onClick={() => applyPreset('cyclone')}
            className='px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition'
          >
            Severe Cyclone (65% Loss)
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Dynamic Live Outputs */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        
        {/* Left Column: Sliders (5 cols) */}
        <div className='lg:col-span-5 space-y-5 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between'>
            <span>Simulation Parameters</span>
            <button 
              onClick={() => applyPreset('benchmark')} 
              className='text-emerald-600 dark:text-emerald-400 flex items-center gap-1 normal-case hover:underline font-medium'
            >
              <RotateCcw className='w-3 h-3' /> Reset to Benchmark
            </button>
          </h3>

          {/* 1. Weather Damage % */}
          <div className='space-y-1.5'>
            <div className='flex justify-between text-xs font-semibold'>
              <span className='text-slate-700 dark:text-slate-300 flex items-center gap-1'>
                <CloudRain className='w-3.5 h-3.5 text-blue-500' /> Crop Damage Rate:
              </span>
              <span className='font-bold text-rose-600 dark:text-rose-400'>
                {damagePercent}% ({damagedKg} kg lost)
              </span>
            </div>
            <input
              type='range'
              min='0'
              max='90'
              step='5'
              value={damagePercent}
              onChange={(e) => setDamagePercent(Number(e.target.value))}
              className='w-full accent-rose-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer'
            />
            <div className='flex justify-between text-[10px] text-slate-400'>
              <span>0% (No loss)</span>
              <span>40% (Benchmark)</span>
              <span>90% (Catastrophic)</span>
            </div>
          </div>

          {/* 2. Expected Harvest Quantity */}
          <div className='space-y-1.5'>
            <div className='flex justify-between text-xs font-semibold'>
              <span className='text-slate-700 dark:text-slate-300 flex items-center gap-1'>
                <Package className='w-3.5 h-3.5 text-emerald-500' /> Expected Harvest:
              </span>
              <span className='font-bold text-slate-900 dark:text-white'>{expectedHarvestKg} kg</span>
            </div>
            <input
              type='range'
              min='200'
              max='5000'
              step='100'
              value={expectedHarvestKg}
              onChange={(e) => setExpectedHarvestKg(Number(e.target.value))}
              className='w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer'
            />
          </div>

          {/* 3. Market Demand */}
          <div className='space-y-1.5'>
            <div className='flex justify-between text-xs font-semibold'>
              <span className='text-slate-700 dark:text-slate-300 flex items-center gap-1'>
                <TrendingUp className='w-3.5 h-3.5 text-amber-500' /> Regional Market Demand:
              </span>
              <span className='font-bold text-slate-900 dark:text-white'>{expectedDemandKg} kg</span>
            </div>
            <input
              type='range'
              min='200'
              max='5000'
              step='100'
              value={expectedDemandKg}
              onChange={(e) => setExpectedDemandKg(Number(e.target.value))}
              className='w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer'
            />
          </div>

          {/* 4. Base Market Price */}
          <div className='space-y-1.5'>
            <div className='flex justify-between text-xs font-semibold'>
              <span className='text-slate-700 dark:text-slate-300 flex items-center gap-1'>
                <DollarSign className='w-3.5 h-3.5 text-emerald-500' /> Normal Mandi Benchmark:
              </span>
              <span className='font-bold text-emerald-600 dark:text-emerald-400'>₹{baseMarketPrice.toFixed(2)}/kg</span>
            </div>
            <input
              type='range'
              min='20'
              max='80'
              step='1'
              value={baseMarketPrice}
              onChange={(e) => setBaseMarketPrice(Number(e.target.value))}
              className='w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer'
            />
          </div>

          {/* 5. Price Elasticity */}
          <div className='space-y-1.5'>
            <div className='flex justify-between text-xs font-semibold'>
              <span className='text-slate-700 dark:text-slate-300'>Price Elasticity Factor:</span>
              <span className='font-bold text-blue-600 dark:text-blue-400'>{priceElasticity.toFixed(2)}</span>
            </div>
            <input
              type='range'
              min='0.20'
              max='1.00'
              step='0.05'
              value={priceElasticity}
              onChange={(e) => setPriceElasticity(Number(e.target.value))}
              className='w-full accent-blue-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer'
            />
          </div>

          {/* Cost details collapsible */}
          <div className='pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3'>
            <div className='text-[11px] font-bold uppercase text-slate-400'>Incurred Operational Costs</div>
            <div className='grid grid-cols-3 gap-2'>
              <div>
                <label className='text-[10px] text-slate-500 block'>Production</label>
                <input
                  type='number'
                  value={productionCost}
                  onChange={(e) => setProductionCost(Number(e.target.value))}
                  className='w-full text-xs font-bold p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                />
              </div>
              <div>
                <label className='text-[10px] text-slate-500 block'>Recovery</label>
                <input
                  type='number'
                  value={recoveryCost}
                  onChange={(e) => setRecoveryCost(Number(e.target.value))}
                  className='w-full text-xs font-bold p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                />
              </div>
              <div>
                <label className='text-[10px] text-slate-500 block'>Transport</label>
                <input
                  type='number'
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value))}
                  className='w-full text-xs font-bold p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Calculated Dynamic Outputs (7 cols) */}
        <div className='lg:col-span-7 space-y-4'>
          
          {/* Top Metric Cards */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <div className='bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800'>
              <span className='text-[10px] uppercase font-bold text-slate-400 block'>Marketable Crop</span>
              <span className='text-lg font-black text-slate-900 dark:text-white mt-1 block'>
                {shock.marketableSupplyKg} <span className='text-xs font-normal text-slate-400'>kg</span>
              </span>
              <span className='text-[11px] text-slate-500 block mt-0.5'>{100 - shock.damageRatePercent}% of harvest</span>
            </div>

            <div className='bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800'>
              <span className='text-[10px] uppercase font-bold text-slate-400 block'>Market Shortage</span>
              <span className='text-lg font-black text-rose-600 dark:text-rose-400 mt-1 block'>
                {shock.marketShortagePercent}%
              </span>
              <span className='text-[11px] text-slate-500 block mt-0.5'>Supply/Demand: {shock.supplyDemandRatio.toFixed(2)}</span>
            </div>

            <div className='bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800'>
              <span className='text-[10px] uppercase font-bold text-slate-400 block'>Shock Multiplier</span>
              <span className='text-lg font-black text-blue-600 dark:text-blue-400 mt-1 block'>
                {shock.shockMultiplier}x
              </span>
              <span className='text-[11px] text-slate-500 block mt-0.5'>Elasticity: {shock.priceElasticity}</span>
            </div>

            <div className='bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60'>
              <span className='text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block'>Min. Sustainable</span>
              <span className='text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1 block'>
                ₹{shock.minimumSustainablePrice.toFixed(2)}
              </span>
              <span className='text-[10px] text-emerald-600/80 block mt-0.5'>Cost break-even floor</span>
            </div>
          </div>

          {/* Dynamic Price Hero Box */}
          <div className='bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-5 text-white shadow-lg space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <span className='text-emerald-200 text-xs font-bold uppercase tracking-wider block'>
                  Dynamic AI Calculated Selling Price
                </span>
                <div className='flex items-baseline gap-2 mt-1'>
                  <span className='text-3xl sm:text-4xl font-black tracking-tight'>
                    ₹{shock.safetyClampedPredictedPrice.toFixed(2)}
                  </span>
                  <span className='text-emerald-200 text-sm font-semibold'>/ kg</span>
                  {shock.isClamped && (
                    <span className='bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full'>
                      Safety Clamped at ₹{shock.maxConfiguredPrice}/kg
                    </span>
                  )}
                </div>
              </div>

              <div className='bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-right'>
                <span className='text-[10px] text-emerald-100 uppercase block font-semibold'>Dynamic Selling Range</span>
                <span className='text-sm font-extrabold text-white'>
                  ₹{shock.recommendedSellingRange.min.toFixed(2)} - ₹{shock.recommendedSellingRange.max.toFixed(2)}
                </span>
              </div>
            </div>

            <p className='text-xs text-emerald-100/90 leading-relaxed border-t border-white/15 pt-3'>
              {shock.narrative}
            </p>
          </div>

          {/* Financial Breakdown Grid */}
          <div className='bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3'>
            <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block'>
              Dynamic Financial Balance & Profitability
            </span>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs'>
              <div className='p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Marketable Revenue</span>
                <span className='font-extrabold text-slate-900 dark:text-white text-sm'>
                  ₹{shock.financialImpact.grossRevenueOnMarketableCrop.toLocaleString()}
                </span>
              </div>

              <div className='p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Total Incurred Costs</span>
                <span className='font-extrabold text-slate-900 dark:text-white text-sm'>
                  ₹{shock.financialImpact.totalCostsIncurred.toLocaleString()}
                </span>
              </div>

              <div className='p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800'>
                <span className='text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold'>Net Farmer Profit</span>
                <span className={cn(
                  'font-black text-sm',
                  shock.financialImpact.netProfitOnMarketableCrop >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                )}>
                  {shock.financialImpact.netProfitOnMarketableCrop >= 0 ? '+' : ''}₹{shock.financialImpact.netProfitOnMarketableCrop.toLocaleString()}
                </span>
              </div>

              <div className='p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900'>
                <span className='text-[10px] text-rose-600 dark:text-rose-400 block font-semibold'>Crop Loss Exposure</span>
                <span className='font-black text-sm text-rose-600 dark:text-rose-400'>
                  -₹{shock.financialImpact.revenueLostFromDestroyedCrop.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Sell vs Store Action Callout */}
          <div className='p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-start gap-3'>
            <div className='w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5'>
              <TrendingUp className='w-4 h-4' />
            </div>
            <div className='text-xs space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='font-bold uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-300'>
                  Storage Optimizer Recommendation:
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full font-black text-[10px]',
                  storage.action === 'STORE' ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-200 text-blue-900'
                )}>
                  {storage.action.replace('_', ' ')}
                </span>
              </div>
              <p className='text-slate-600 dark:text-slate-300 leading-relaxed'>
                {storage.reasoning}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
