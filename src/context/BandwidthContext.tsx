'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BandwidthContextType {
  isLowBandwidth: boolean;
  toggleLowBandwidth: () => void;
  toggleBandwidth: () => void;
  setLowBandwidth: (val: boolean) => void;
}

const BandwidthContext = createContext<BandwidthContextType | undefined>(undefined);

export function BandwidthProvider({ children }: { children: ReactNode }) {
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('agriflow_low_bandwidth');
    if (saved === 'true') setIsLowBandwidth(true);
  }, []);

  const toggleLowBandwidth = () => {
    setIsLowBandwidth(prev => {
      const next = !prev;
      localStorage.setItem('agriflow_low_bandwidth', String(next));
      return next;
    });
  };

  const setLowBandwidth = (val: boolean) => {
    setIsLowBandwidth(val);
    localStorage.setItem('agriflow_low_bandwidth', String(val));
  };

  return (
    <BandwidthContext.Provider value={{ isLowBandwidth, toggleLowBandwidth, toggleBandwidth: toggleLowBandwidth, setLowBandwidth }}>
      {children}
    </BandwidthContext.Provider>
  );
}

export function useBandwidth() {
  const context = useContext(BandwidthContext);
  if (!context) throw new Error('useBandwidth must be used within a BandwidthProvider');
  return context;
}
