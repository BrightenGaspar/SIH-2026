import { MarketPrice, PriceTrendPoint } from "@/types/farmer";

export const marketPriceService = {
  async getMarketPrices(commodity?: string): Promise<MarketPrice[]> {
    try {
      const url = commodity 
        ? `/api/farmer/market-prices?commodity=${encodeURIComponent(commodity)}`
        : '/api/farmer/market-prices';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async getPriceTrends(commodity: string): Promise<PriceTrendPoint[]> {
    try {
      const url = `/api/farmer/price-trends?commodity=${encodeURIComponent(commodity)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  }
};