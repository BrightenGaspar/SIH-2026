'use client';

import React from 'react';
import { ProduceGrade } from '@/types/consumer';
import { Sparkles, Award, Shield, CheckCircle2 } from 'lucide-react';

interface GradeFilterTabsProps {
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  counts?: {
    all: number;
    A: number;
    B: number;
    'Organic Certified': number;
  };
}

export const GradeFilterTabs: React.FC<GradeFilterTabsProps> = ({
  selectedGrade,
  onSelectGrade,
  counts,
}) => {
  const tabs = [
    { id: 'all', label: 'All Grades', icon: Sparkles },
    { id: 'A', label: 'Grade A Premium', icon: Award },
    { id: 'B', label: 'Grade B Value', icon: CheckCircle2 },
    { id: 'Organic Certified', label: 'Organic Certified', icon: Shield },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        const isSelected = selectedGrade === tab.id;
        const Icon = tab.icon;
        const count = counts ? (counts as Record<string, number>)[tab.id] : undefined;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectGrade(tab.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 flex-1 min-w-[140px] justify-center sm:justify-start ${
              isSelected
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-zinc-400'}`} />
            <span className="leading-none flex items-center gap-1.5">
              {tab.label}
              {count !== undefined && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default GradeFilterTabs;