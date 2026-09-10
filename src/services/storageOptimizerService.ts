import { StorageOptimizationInput, StorageOptimizationResult, SellStoreAction } from '@/types/intelligence';
import { getCropColdChainProfile } from '@/config/cropThresholds';

export function evaluateStorageVsSell(input: StorageOptimizationInput): StorageOptimizationResult {
  const cropProfile = getCropColdChainProfile(input.commodity);
  const qty = Math.max(1, input.marketableQuantityKg);
  const currentPrice = Math.max(1, input.currentSellingPrice);
  const futurePrice = Math.max(1, input.projectedFuturePrice);
  const days = Math.max(1, input.storageDays || 5);
  
  const dailyStorageRate = input.dailyStorageRatePerKg ?? cropProfile.dailyStorageRatePerKg;
  const dailySpoilageRate = input.expectedDailySpoilageRatePercent ?? cropProfile.dailySpoilageRatePercent;
  const transCurrent = input.transportCostCurrent ?? 1500;
  const transStorage = input.transportCostStorage ?? 1800; // Slight handling/double-haul

  // 1. Sell Now Realization
  const sellNowGross = Number((qty * currentPrice).toFixed(2));
  const sellNowNet = Number((sellNowGross - transCurrent).toFixed(2));
  const sellNowPerKg = Number((sellNowNet / qty).toFixed(2));

  // 2. Store Future Realization
  const totalSpoilagePercent = Math.min(25, days * dailySpoilageRate);
  const spoilageLossKg = Number(((qty * totalSpoilagePercent) / 100).toFixed(2));
  const survivingQty = Number((qty - spoilageLossKg).toFixed(2));
  const spoilageLossVal = Number((spoilageLossKg * futurePrice).toFixed(2));

  const totalStorageCost = Number((qty * dailyStorageRate * days).toFixed(2));
  const storeGross = Number((survivingQty * futurePrice).toFixed(2));
  const totalStoreExpenses = Number((totalStorageCost + transStorage).toFixed(2));
  const storeNet = Number((storeGross - totalStoreExpenses).toFixed(2));
  const storeNetPerKg = Number((storeNet / qty).toFixed(2));

  const netDiff = Number((storeNet - sellNowNet).toFixed(2));
  const advPerKg = Number((storeNetPerKg - sellNowPerKg).toFixed(2));

  let action: SellStoreAction = 'SELL_NOW';
  let reasoning = '';

  if (advPerKg > 1.50 && days <= cropProfile.maxSafeTransitHours / 24) {
    action = 'STORE';
    reasoning = Storing for  days yields +₹/kg higher net farmer realization after factoring ₹ cold-storage fees and ₹ (%) spoilage risk. Future price upside (₹/kg vs ₹/kg) comfortably overcomes holding costs.;
  } else if (advPerKg < -0.50) {
    action = 'SELL_NOW';
    reasoning = Immediate spot sale recommended. Holding for  days would erode net realization by ₹/kg due to cumulative spoilage ( kg lost) and ₹ in storage fees that the projected market price cannot offset.;
  } else {
    action = 'WAIT';
    reasoning = Marginal financial delta (+₹/kg). Storing carries operational risks without significant premium. Recommended to sell immediately unless premium buyer contract is confirmed.;
  }

  return {
    action,
    sellNowRealization: {
      pricePerKg: currentPrice,
      grossRevenue: sellNowGross,
      costs: transCurrent,
      netFarmerRealization: sellNowNet,
      netPerKg: sellNowPerKg,
    },
    storeFutureRealization: {
      projectedPricePerKg: futurePrice,
      storedQuantityAfterSpoilageKg: survivingQty,
      spoilageLossKg,
      spoilageLossValue: spoilageLossVal,
      totalStorageCost,
      grossRevenue: storeGross,
      costs: totalStoreExpenses,
      netFarmerRealization: storeNet,
      netPerKg: storeNetPerKg,
    },
    netDifference: netDiff,
    advantagePerKg: advPerKg,
    storageDaysRecommended: action === 'STORE' ? days : 0,
    reasoning,
  };
}
