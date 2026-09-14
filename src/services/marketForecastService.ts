import { MarketForecastResult, MarketPricePoint, DemandTrend } from '@/types/intelligence';

export function getMarketForecast(commodity: string, currentPrice: number): MarketForecastResult {
  const basePrice = Math.max(10, currentPrice || 42.0);
  const days = ['Today', '+1 Day', '+2 Days', '+3 Days', '+4 Days', '+5 Days', '+6 Days'];
  
  // Simulated dynamic forward price curve with slight upward slope due to regional tightness
  const forecast7Days: MarketPricePoint[] = days.map((dayLabel, idx) => {
    const today = new Date();
    const d = new Date(today.getTime() + (idx * 24 * 60 * 60 * 1000));
    // Upward trend: +2% per day peaking around day 4, then stabilizing
    const growth = idx === 0 ? 0 : Math.min(0.12, idx * 0.025);
    const predicted = Number((basePrice * (1 + growth)).toFixed(2));
    const low = Number((predicted * 0.95).toFixed(2));
    const high = Number((predicted * 1.05).toFixed(2));
    const volume = Math.round(12000 - (idx * 600)); // Declining regional supply drives price

    return {
      day: dayLabel,
      date: d.toISOString().split('T')[0],
      predictedPrice: predicted,
      confidenceLow: low,
      confidenceHigh: high,
      projectedVolumeKg: volume,
    };
  });

  const peakPoint = forecast7Days.reduce((prev, curr) => (curr.predictedPrice > prev.predictedPrice ? curr : prev), forecast7Days[0]);
  const trend: DemandTrend = peakPoint.predictedPrice > basePrice * 1.04 ? 'BULLISH' : 'STABLE';

  return {
    commodity,
    currentMandiPrice: basePrice,
    trend,
    forecast7Days,
    peakPriceDay: peakPoint.day,
    peakPrice: peakPoint.predictedPrice,
    recommendation: trend === 'BULLISH' 
      ? `Forward market is BULLISH: prices expected to climb up to ₹${peakPoint.predictedPrice}/kg by ${peakPoint.day}. Consider staggered selling or 3-4 day cold-storage holding if costs allow.`
      : `Market is STABLE. Spot selling at current ₹${basePrice}/kg secures immediate cash flow without storage risk.`,
  };
}
