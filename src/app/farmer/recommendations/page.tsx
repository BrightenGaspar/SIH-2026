'use client';

import React, { useState, useEffect } from 'react';
import { aiService } from '@/services/aiService';
import { AIRecommendation } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function AIRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  useEffect(() => {
    aiService.getRecommendations().then(setRecommendations);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">AI Selling Recommendations</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Transparent multi-factor intelligence scoring based on regional supply deficits, distance, harvest freshness, and net farmer realization.
        </p>
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-6">
        {recommendations.map((rec) => (
          <Card key={rec.id} variant="highlight" className="p-6 space-y-6">
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    {rec.score}% AI Match Score
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    +{formatINR(rec.expectedImprovementPerKg)}/kg Expected Gain
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{rec.title}</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">{rec.summary}</p>
              </div>

              <Button size="md" className="flex-shrink-0">
                <span>{rec.actionText}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Explainable Factor Breakdown */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Transparent Factor Scoring Breakdown (Explainable AI)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Demand Deficit:</span>
                    <span className="font-bold text-emerald-400">{rec.factors.demandStrength}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${rec.factors.demandStrength}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Road Distance:</span>
                    <span className="font-bold text-emerald-400">{rec.factors.distanceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${rec.factors.distanceScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Freshness Window:</span>
                    <span className="font-bold text-emerald-400">{rec.factors.freshnessScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${rec.factors.freshnessScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Price Premium:</span>
                    <span className="font-bold text-emerald-400">{rec.factors.expectedPriceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${rec.factors.expectedPriceScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Net Realization:</span>
                    <span className="font-bold text-emerald-400">{rec.factors.fairRealizationScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${rec.factors.fairRealizationScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bullet reasons */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Decision Reasoning:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {rec.reasoning.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

          </Card>
        ))}
      </div>

    </div>
  );
}
