'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { QualityGradeResult } from '@/types/farmer';
import { farmerService } from '@/services/farmerService';
import { Upload, Sparkles, AlertTriangle } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface AIQualityGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropName: string;
  onGradeApplied: (grade: string, price: number) => void;
}

export function AIQualityGradingModal({ isOpen, onClose, cropName, onGradeApplied }: AIQualityGradingModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<QualityGradeResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(URL.createObjectURL(file));
      setAnalyzing(true);
      setError(null);
      setResult(null);
      try {
        const res = await farmerService.gradeProduceImage(file);
        setResult(res);
      } catch (err) {
        setError((err as Error).message || 'AI Grading service unavailable.');
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleApply = () => {
    if (result) {
      onGradeApplied(result.grade, result.estimatedFairRealizationMin);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Produce Quality Grading" subtitle="Computer vision inspection & defect classification">
      <div className="space-y-6">
        {/* Upload Box */}
        {!uploadedImage && !analyzing && !result && (
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-800/30 transition">
            <Upload className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
            <p className="text-sm font-bold text-white mb-1">Upload Crop Photo</p>
            <p className="text-xs text-slate-400 mb-4">Upload a high-resolution top-down or crate photo of {cropName}</p>
            <label className="inline-block">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <span className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition inline-flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Select Produce Image
              </span>
            </label>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
            {error}
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => { setUploadedImage(null); setError(null); }}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {analyzing && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-white">Running Vision Analysis Neural Network...</p>
            <p className="text-xs text-slate-400">Analyzing pigmentation, defect percentage, size uniformity, and fungal markers.</p>
          </div>
        )}

        {/* Result view */}
        {result && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Assessed Grade</span>
                <span className="text-3xl font-black text-white">Grade {result.grade}</span>
                <span className="text-xs text-slate-300 block mt-0.5">Defect Level: <strong className="text-emerald-300">{result.defectLevel}</strong></span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Estimated Fair Realization</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatINR(result.estimatedFairRealizationMin)} – {formatINR(result.estimatedFairRealizationMax)}/kg
                </span>
              </div>
            </div>

            {/* Metric scores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block">Color & Pigment:</span>
                <span className="text-sm font-bold text-emerald-400">{result.colorScore}% Uniform</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block">Size Consistency:</span>
                <span className="text-sm font-bold text-emerald-400">{result.sizeConsistencyScore}%</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block">Surface Defects:</span>
                <span className="text-sm font-bold text-emerald-400">{result.surfaceDefectsScore}% Clean</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block">Damage / Bruise:</span>
                <span className="text-sm font-bold text-emerald-400">&lt; {100 - result.damageScore}%</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block">Freshness Index:</span>
                <span className="text-sm font-bold text-emerald-400">{result.freshnessScore}/100</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block">Overall Quality:</span>
                <span className="text-sm font-bold text-emerald-400">{result.visualQualityScore}/100</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-700">
              💡 <strong>AI Analysis:</strong> {result.explanation}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-950/20 p-2.5 rounded-xl border border-amber-600/30">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{result.disclaimer}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setResult(null); setUploadedImage(null); }}>
                Re-scan Photo
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleApply}>
                Apply Grade & Pricing
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}