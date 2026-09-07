import { MarketPrice, PriceTrendPoint } from "@/types/farmer";
import { apiClient } from "@/lib/apiClient";
import { mockMarketPrices, mockPriceTrendData } from "./mockData/mockPrices";

export const marketPriceService = {
  async getMarketPrices(): Promise<MarketPrice[]> {
    try {
      return await apiClient<MarketPrice[]>('/api/farmer/market-prices', { method: 'GET' });
    } catch {
      return mockMarketPrices;
    }
  },

  async getPriceTrends(commodity: string): Promise<PriceTrendPoint[]> {
    try {
      return await apiClient<PriceTrendPoint[]>('/api/farmer/price-trends', {
        method: 'GET',
        params: { commodity },
      });
    } catch {
      return mockPriceTrendData;
    }
  }
};
