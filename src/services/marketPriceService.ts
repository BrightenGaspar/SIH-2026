import { MarketPrice, PriceTrendPoint } from "@/types/farmer";
import { mockMarketPrices, mockPriceTrendData } from "./mockData/mockPrices";

export const marketPriceService = {
  getMarketPrices(): Promise<MarketPrice[]> {
    return Promise.resolve(mockMarketPrices);
  },

  getPriceTrends(commodity: string): Promise<PriceTrendPoint[]> {
    return Promise.resolve(mockPriceTrendData);
  }
};
