'use client';

import React, { useState } from 'react';
import { Camera, CheckCircle2, Sparkles, X, ShieldAlert, Tag, ArrowRight } from 'lucide-react';
import { evaluateProduceQuality } from '@/services/qualityService';
import { QualityInspectionResult } from '@/types/intelligence';
import { cn } from '@/lib/utils';

interface CropQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropName?: string;
  quantityKg?: number;
  onListingCreated?: (listing: any) => void;
}

export function CropQualityModal({
  isOpen,
  onClose,
  cropName = 'Tomato (Hybrid Desi)',
  quantityKg = 600,
  onListingCreated,
}: CropQualityModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<QualityInspectionResult | null>(() => 
    evaluateProduceQuality(cropName, quantityKg)
  );

  if (!isOpen) return null;

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setInspectionResult(evaluateProduceQuality(cropName, quantityKg));
      setIsScanning(false);
    }, 900);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in'>
      <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5'>
        
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
              <Sparkles className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-base font-bold text-slate-900 dark:text-white'>
                Computer-Vision Produce Quality Inspection
              </h3>
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                Automated optical grading & smart listing generator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Camera Viewport Simulation */}
        <div className='relative h-56 rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-4'>
          {/* Simulated scanning reticle */}
          <div className='absolute inset-6 border border-emerald-500/40 rounded-xl pointer-events-none'>
            <div className='absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400' />
            <div className='absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400' />
            <div className='absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400' />
            <div className='absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400' />
          </div>

          <Camera className={cn('w-10 h-10 text-emerald-400 mb-2', isScanning && 'animate-pulse')} />
          <span className='text-xs font-bold text-white uppercase tracking-wider'>
            {isScanning ? 'Analyzing Fruit Geometry & Surface...' : 'Simulated Mobile Optical Lens Active'}
          </span>
          <span className='text-[11px] text-slate-400 mt-1'>
            Detecting color reflectance, surface blemish index, and diameter ratio
          </span>

          <button
            type='button'
            onClick={handleScan}
            disabled={isScanning}
            className='mt-4 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition'
          >
            {isScanning ? 'Processing...' : 'Capture & Inspect Batch'}
          </button>
        </div>

        {/* Result Metrics */}
        {inspectionResult && (
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-2.5 text-xs'>
              <div className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Optical Grade</span>
                <span className='text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block'>
                  {inspectionResult.assignedGrade}
                </span>
                <span className='text-[10px] text-slate-400'>{inspectionResult.confidenceScore}% Confidence</span>
              </div>

              <div className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Blemish Rate</span>
                <span className='text-base font-black text-slate-900 dark:text-white mt-0.5 block'>
                  {inspectionResult.blemishRatePercent}%
                </span>
                <span className='text-[10px] text-slate-400'>Diameter: {inspectionResult.averageDiameterMm}mm</span>
              </div>

              <div className='p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800'>
                <span className='text-[10px] text-slate-400 block'>Color Maturity</span>
                <span className='text-base font-black text-slate-900 dark:text-white mt-0.5 block'>
                  {inspectionResult.colorMaturityPercent}%
                </span>
                <span className='text-[10px] text-slate-400'>{inspectionResult.shelfLifeRemainingDays} days safe life</span>
              </div>
            </div>

            {/* 1-Click Pre-filled Listing */}
            <div className='p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3'>
              <div>
                <span className='text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider block'>
                  Verified Pre-filled Listing
                </span>
                <span className='text-xs font-extrabold text-slate-900 dark:text-white block'>
                  {inspectionResult.prefilledListing.title} - {quantityKg} kg
                </span>
                <span className='text-[11px] text-slate-600 dark:text-slate-300'>
                  Suggested price: ₹{inspectionResult.prefilledListing.suggestedListingPrice}/kg
                </span>
              </div>

              <button
                type='button'
                onClick={() => {
                  if (onListingCreated) onListingCreated(inspectionResult.prefilledListing);
                  onClose();
                }}
                className='px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shrink-0'
              >
                <Tag className='w-3.5 h-3.5' /> Auto-Publish Listing
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
