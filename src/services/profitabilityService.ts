import { ProfitabilityInput, ProfitabilityResult } from '@/types/intelligence';

export function calculateProfitability(input: ProfitabilityInput): ProfitabilityResult {
  const marketableQty = Math.max(0, input.marketableQuantityKg);
  const sellingPrice = Math.max(0, input.sellingPricePerKg);
  const prodCost = Math.max(0, input.productionCost);
  const recCost = Math.max(0, input.recoveryCost ?? 0);
  const transCost = Math.max(0, input.transportCost ?? 0);
  const storCost = Math.max(0, input.storageCost ?? 0);
  const handCost = Math.max(0, input.handlingCost ?? 0);

  const totalCost = Number((prodCost + recCost + transCost + storCost + handCost).toFixed(2));
  const grossRevenue = Number((marketableQty * sellingPrice).toFixed(2));
  const netProfit = Number((grossRevenue - totalCost).toFixed(2));

  // Division by zero guard
  const breakEvenPricePerKg = marketableQty > 0 ? Number((totalCost / marketableQty).toFixed(2)) : 0;
  const profitMarginPercent = grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(2)) : (totalCost > 0 ? -100 : 0);

  const isViable = netProfit > 0;
  let marginHealth: 'EXCELLENT' | 'HEALTHY' | 'SLIM' | 'LOSS_MAKING' = 'LOSS_MAKING';
  if (profitMarginPercent >= 25) {
    marginHealth = 'EXCELLENT';
  } else if (profitMarginPercent >= 12) {
    marginHealth = 'HEALTHY';
  } else if (profitMarginPercent > 0) {
    marginHealth = 'SLIM';
  }

  return {
    marketableQuantityKg: marketableQty,
    sellingPricePerKg: sellingPrice,
    grossRevenue,
    totalCost,
    netProfit,
    breakEvenPricePerKg,
    profitMarginPercent,
    isViable,
    marginHealth,
  };
}
