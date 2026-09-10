'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  CloudRain, 
  Building2, 
  Navigation, 
  Thermometer, 
  ShieldAlert, 
  RotateCcw,
  Sliders,
  QrCode,
  ArrowRight,
  HelpCircle,
  Truck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { runUnifiedIntelligencePipeline } from '@/services/intelligenceCoordinator';
import { detectFoodLossRisk } from '@/services/foodLossService';
import { DecisionSummaryHero } from '@/components/intelligence/DecisionSummaryHero';
import { ExplainableAICard } from '@/components/common/ExplainableAICard';
import { WhatIfSimulator } from '@/components/intelligence/WhatIfSimulator';
import { SmartBuyerRankingCard } from '@/components/intelligence/SmartBuyerRankingCard';
import { DestinationOptimizerCard } from '@/components/intelligence/DestinationOptimizerCard';
import { CropQualityModal } from '@/components/intelligence/CropQualityModal';
import { FoodLossAlertCard } from '@/components/intelligence/FoodLossAlertCard';
import { cn } from '@/lib/utils';

export default function FarmerIntelligencePage() {
  const [commodity, setCommodity] = useState('Tomato (Hybrid Desi)');
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'buyers' | 'coldchain'>('overview');

  // Unified master reactive pipeline
  const pipelineData = useMemo(() => {
    return runUnifiedIntelligencePipeline({
      commodity,
      expectedHarvestKg: 1000,
      damagedHarvestKg: 400,
      expectedMarketDemandKg: 1000,
      baseMarketPrice: 42.0,
      priceElasticity: 0.65,
      totalProductionCost: 18000,
      recoveryCost: 2000,
      transportCost: 1500,
      storageDays: 5,
    });
  }, [commodity]);

  const lossRisk = useMemo(() => {
    return detectFoodLossRisk('LOT-2026-7842', commodity, pipelineData.harvestOverview.marketableKg, 4);
  }, [commodity, pipelineData.harvestOverview.marketableKg]);

  const explainableFactors = [
    {
      name: 'Cost-Based Recovery Baseline',
      weight: '40% Weight',
      value: ₹/kg,
      impact: Floor: ₹/kg,
      direction: 'neutral' as const,
    },
    {
      name: 'Weather Shock Shortage Index',
      weight: 'Regional',
      value: +% Shortage,
      impact: +% Shock Multiplier,
      direction: 'up' as const,
    },
    {
      name: 'Quality Grade Factor',
      weight: 'Grade B',
      value: '1.00x Base',
      impact: 'Standard Desi Hybrid Spec',
      direction: 'neutral' as const,
    },
    {
      name: 'Forward Mandi Elasticity',
      weight: 'Elasticity 0.65',
      value: 'High Buyer Inelasticity',
      impact: ₹/kg Dynamic Price,
      direction: 'up' as const,
    },
  ];

  return (
    <div className='space-y-8 pb-12 animate-in fade-in'>
      
      {/* Top Banner & Control Bar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800'>
              AgriFlow Decision Engine
            </span>
            <span className='text-xs text-slate-400'>&bull; Real-time Dynamic Pipeline</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1'>
            Central AI Decision Center
          </h1>
          <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5'>
            Integrated intelligence uniting weather shocks, crop damage, reference pricing, smart buyers, and cold chain.
          </p>
        </div>

        <div className='flex items-center gap-2.5 flex-wrap'>
          <Link
            href='/traceability/LOT-2026-7842'
            className='px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition'
          >
            <QrCode className='w-4 h-4' />
            <span>Traceability Pass</span>
          </Link>
          <Link
            href='/farmer/weather-shock'
            className='px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900 font-bold text-xs flex items-center gap-1.5 transition'
          >
            <CloudRain className='w-4 h-4' />
            <span>Weather Shock Hub</span>
          </Link>
        </div>
      </div>

      {/* Navigation Pill Tabs */}
      <div className='flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto'>
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0',
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Sparkles className='w-3.5 h-3.5' /> AI Decision Summary
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0',
            activeTab === 'simulator'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Sliders className='w-3.5 h-3.5' /> What-If Simulator
        </button>

        <button
          onClick={() => setActiveTab('buyers')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0',
            activeTab === 'buyers'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Building2 className='w-3.5 h-3.5' /> Direct Buyers & Mandis
        </button>

        <button
          onClick={() => setActiveTab('coldchain')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0',
            activeTab === 'coldchain'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Thermometer className='w-3.5 h-3.5' /> Cold-Chain & Spoilage
        </button>
      </div>

      {/* Primary Section 34 Decision Card Hero */}
      <DecisionSummaryHero 
        data={pipelineData} 
        onOpenQualityModal={() => setQualityModalOpen(true)} 
      />

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className='space-y-6'>
          
          {/* Explainable AI & Food Loss Safeguard Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            <div className='lg:col-span-7'>
              <ExplainableAICard
                confidenceScore={94}
                factors={explainableFactors}
                explanationNarrative={pipelineData.weatherShock.narrative}
                minimumSustainablePrice={pipelineData.weatherShock.minimumSustainablePrice}
                unclampedPrice={pipelineData.weatherShock.unclampedPredictedPrice}
                clampedPrice={pipelineData.weatherShock.safetyClampedPredictedPrice}
              />
            </div>

            <div className='lg:col-span-5'>
              <FoodLossAlertCard lossRisk={lossRisk} />
            </div>
          </div>

          {/* Quick Peek: Smart Buyers & Best Mandis */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <SmartBuyerRankingCard buyers={pipelineData.allMatchedBuyers} />
            <DestinationOptimizerCard destinations={pipelineData.destinationMarkets} />
          </div>

          {/* Interactive What-If Simulator embedded */}
          <div className='pt-4'>
            <WhatIfSimulator />
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className='space-y-6'>
          <WhatIfSimulator />
        </div>
      )}

      {/* TAB CONTENT 3: BUYERS & MANDIS */}
      {activeTab === 'buyers' && (
        <div className='space-y-6'>
          <SmartBuyerRankingCard buyers={pipelineData.allMatchedBuyers} />
          <DestinationOptimizerCard destinations={pipelineData.destinationMarkets} />
        </div>
      )}

      {/* TAB CONTENT 4: COLD CHAIN & FLEET */}
      {activeTab === 'coldchain' && (
        <div className='space-y-6'>
          
          <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2'>
                  <Thermometer className='w-5 h-5 text-blue-500' />
                  IoT Cold-Chain Telemetry & Spoilage Early Warning
                </h3>
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  Live reefer truck sensors monitoring cargo temperature, humidity, and shelf life erosion
                </p>
              </div>
              <span className='px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs'>
                Status: {pipelineData.coldChainRisk.reeferStatus}
              </span>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
              <div className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Current Cargo Temp</span>
                <span className='text-lg font-black text-slate-900 dark:text-white mt-1 block'>
                  {pipelineData.coldChainRisk.currentTempCelsius}°C
                </span>
                <span className='text-[10px] text-emerald-600 dark:text-emerald-400'>Safe: 10°C - 15°C</span>
              </div>

              <div className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Relative Humidity</span>
                <span className='text-lg font-black text-slate-900 dark:text-white mt-1 block'>
                  {pipelineData.coldChainRisk.currentHumidityPercent}%
                </span>
                <span className='text-[10px] text-slate-500'>Safe: 85% - 95%</span>
              </div>

              <div className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Cold-Chain Risk Score</span>
                <span className='text-lg font-black text-blue-600 dark:text-blue-400 mt-1 block'>
                  {pipelineData.coldChainRisk.riskScore} / 100
                </span>
                <span className='text-[10px] text-slate-500'>Level: {pipelineData.coldChainRisk.riskLevel}</span>
              </div>

              <div className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Est. Shelf Life Loss</span>
                <span className='text-lg font-black text-rose-600 dark:text-rose-400 mt-1 block'>
                  {pipelineData.coldChainRisk.predictedShelfLifeLossHours} Hours
                </span>
                <span className='text-[10px] text-slate-500'>Accelerated by heat drift</span>
              </div>
            </div>

            <div className='p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center justify-between gap-3 text-xs'>
              <div>
                <span className='font-bold text-emerald-800 dark:text-emerald-300 block'>Reefer Telemetry Advice</span>
                <p className='text-slate-600 dark:text-slate-300 mt-0.5'>{pipelineData.coldChainRisk.recommendedAction}</p>
              </div>
              <Link
                href='/logistics'
                className='px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0 transition'
              >
                Track Live Reefer
              </Link>
            </div>
          </div>

          <FoodLossAlertCard lossRisk={lossRisk} />
        </div>
      )}

      {/* Optical CV Quality Modal */}
      <CropQualityModal
        isOpen={qualityModalOpen}
        onClose={() => setQualityModalOpen(false)}
        cropName={commodity}
        quantityKg={pipelineData.harvestOverview.marketableKg}
      />

    </div>
  );
}
