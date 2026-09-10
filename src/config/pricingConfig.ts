export const PRICING_CONFIG = {
  // Fair Reference Price Weights
  COST_WEIGHT: 0.40,
  MARKET_WEIGHT: 0.60,
  DEFAULT_DESIRED_MARGIN: 0.20, // 20% margin on production cost

  // Quality Adjustments
  QUALITY_FACTORS: {
    'Grade A': 1.10,
    'Grade B': 1.00,
    'Grade C': 0.88,
  } as const,

  // Demand Scale Factors
  DEMAND_FACTORS: {
    HIGH: 1.08,    // Shortage > 20%
    MODERATE: 1.00,// Balanced market
    LOW: 0.92,     // Surplus > 20%
  },

  // Seasonality Multipliers
  SEASON_FACTORS: {
    PEAK_SUPPLY: 0.90,
    OFF_SEASON: 1.15,
    NORMAL: 1.00,
  },

  // Weather Shock & Elasticity Defaults
  DEFAULT_PRICE_ELASTICITY: 0.65,

  // Safety & Anti-Gouging Clamps
  DEFAULT_MAX_SAFETY_PRICE: 60.00,
  ABSOLUTE_MIN_PRICE_FLOOR: 10.00,
  MAX_SHOCK_MULTIPLIER: 2.00,

  // Selling Range Confidence Interval (+/- 4%)
  RECOMMENDED_RANGE_BAND: 0.04,

  // Default Fallback Values
  DEFAULT_COMMODITY: 'Tomato (Hybrid Desi)',
  DEFAULT_BASE_MARKET_PRICE: 42.00,
  DEFAULT_EXPECTED_HARVEST_KG: 1000,
  DEFAULT_DAMAGED_HARVEST_KG: 400,
  DEFAULT_EXPECTED_DEMAND_KG: 1000,
  DEFAULT_PRODUCTION_COST: 18000,
  DEFAULT_RECOVERY_COST: 2000,
  DEFAULT_TRANSPORT_COST: 1500,
};

export const BUYER_SCORING_WEIGHTS = {
  PRICE: 0.30,
  QUANTITY: 0.20,
  QUALITY: 0.15,
  DISTANCE: 0.10,
  DEADLINE_PAYMENT: 0.10,
  RELIABILITY: 0.15,
};
