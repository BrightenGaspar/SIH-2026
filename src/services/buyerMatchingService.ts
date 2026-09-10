import { BuyerCandidate, BuyerMatchResult, ProduceQualityGrade } from '@/types/intelligence';
import { BUYER_SCORING_WEIGHTS } from '@/config/pricingConfig';

export const CANDIDATE_BUYERS: BuyerCandidate[] = [
  {
    id: 'buyer-reliance-retail',
    name: 'Reliance Fresh Distribution Center',
    company: 'Reliance Retail Ltd',
    buyerType: 'Supermarket Chain',
    offeredPricePerKg: 54.00,
    desiredQuantityKg: 3000,
    acceptedGrades: ['Grade A', 'Grade B'],
    distanceKm: 42,
    pickupOffered: true,
    paymentTermsDays: 2,
    reliabilityRating: 4.9,
    verifiedBuyer: true,
    destinationHub: 'Shamshabad Logistics Park, Hyderabad',
  },
  {
    id: 'buyer-bigbasket',
    name: 'BigBasket Fulfillment Hub',
    company: 'Supermarket Grocery Supplies',
    buyerType: 'Supermarket Chain',
    offeredPricePerKg: 53.50,
    desiredQuantityKg: 1500,
    acceptedGrades: ['Grade A'],
    distanceKm: 35,
    pickupOffered: true,
    paymentTermsDays: 1,
    reliabilityRating: 4.8,
    verifiedBuyer: true,
    destinationHub: 'Medchal Hub, Hyderabad',
  },
  {
    id: 'buyer-kisan-agro-processing',
    name: 'Kisan Agro Puree & Sauce Plant',
    company: 'Kisan Agro Foods Pvt Ltd',
    buyerType: 'Food Processor',
    offeredPricePerKg: 49.00,
    desiredQuantityKg: 8000,
    acceptedGrades: ['Grade A', 'Grade B', 'Grade C'],
    distanceKm: 65,
    pickupOffered: false,
    paymentTermsDays: 0, // Instant UPI on weighbridge
    reliabilityRating: 4.6,
    verifiedBuyer: true,
    destinationHub: 'Patancheru Industrial Area, Sangareddy',
  },
  {
    id: 'buyer-bowenpally-trader',
    name: 'Sri Lakshmi Mandi Commission Agents',
    company: 'Wholesale Trade Syndicate',
    buyerType: 'Wholesale Trader',
    offeredPricePerKg: 51.00,
    desiredQuantityKg: 5000,
    acceptedGrades: ['Grade A', 'Grade B', 'Grade C'],
    distanceKm: 28,
    pickupOffered: false,
    paymentTermsDays: 3,
    reliabilityRating: 4.3,
    verifiedBuyer: false,
    destinationHub: 'Bowenpally Wholesale Yard, Secunderabad',
  },
  {
    id: 'buyer-resident-group',
    name: 'Aparna Sarovar Consumer Collective',
    company: 'Direct Apartment Community Purchase',
    buyerType: 'Direct Consumer Group',
    offeredPricePerKg: 56.00,
    desiredQuantityKg: 500,
    acceptedGrades: ['Grade A'],
    distanceKm: 48,
    pickupOffered: false,
    paymentTermsDays: 0, // Instant
    reliabilityRating: 4.7,
    verifiedBuyer: true,
    destinationHub: 'Nallagandla, Hyderabad',
  },
];

export function matchBuyers(
  marketableQtyKg: number,
  expectedPricePerKg: number,
  grade: ProduceQualityGrade = 'Grade B',
  candidates: BuyerCandidate[] = CANDIDATE_BUYERS
): BuyerMatchResult[] {
  const results: BuyerMatchResult[] = candidates.map((buyer) => {
    // 1. Price Score (30%): ratio of offered to expected price (capped at 100)
    const priceRatio = buyer.offeredPricePerKg / Math.max(1, expectedPricePerKg);
    const priceScore = Math.min(100, Math.max(20, Math.round(priceRatio * 85)));

    // 2. Quantity Fit Score (20%): how well buyer volume covers farmer's harvest
    const qtyRatio = Math.min(buyer.desiredQuantityKg, marketableQtyKg) / Math.max(1, marketableQtyKg);
    const quantityScore = Math.round(qtyRatio * 100);

    // 3. Quality Score (15%): exact grade match
    const qualityScore = buyer.acceptedGrades.includes(grade) ? 100 : 30;

    // 4. Distance Score (10%): shorter distance or farm-gate pickup
    let distanceScore = Math.max(20, 100 - (buyer.distanceKm * 0.8));
    if (buyer.pickupOffered) distanceScore = Math.min(100, distanceScore + 20);

    // 5. Payment & Deadline Score (10%): 0 days = 100, 7 days = 60
    const deadlinePaymentScore = Math.max(30, 100 - (buyer.paymentTermsDays * 10));

    // 6. Reliability Score (15%): (rating / 5) * 100
    const reliabilityScore = Math.round((buyer.reliabilityRating / 5.0) * 100);

    // Composite Weighted Score
    const compositeScore = Math.round(
      priceScore * BUYER_SCORING_WEIGHTS.PRICE +
      quantityScore * BUYER_SCORING_WEIGHTS.QUANTITY +
      qualityScore * BUYER_SCORING_WEIGHTS.QUALITY +
      distanceScore * BUYER_SCORING_WEIGHTS.DISTANCE +
      deadlinePaymentScore * BUYER_SCORING_WEIGHTS.DEADLINE_PAYMENT +
      reliabilityScore * BUYER_SCORING_WEIGHTS.RELIABILITY
    );

    // Freight calculation
    const freightCostEst = buyer.pickupOffered ? 0 : Math.round(buyer.distanceKm * 28); // Rs 28/km truck run
    const freightPerKg = marketableQtyKg > 0 ? freightCostEst / marketableQtyKg : 0;
    const netFarmerRealizationPerKg = Number((buyer.offeredPricePerKg - freightPerKg).toFixed(2));
    const matchedVolume = Math.min(marketableQtyKg, buyer.desiredQuantityKg);
    const totalFarmerNetEarnings = Number((netFarmerRealizationPerKg * matchedVolume).toFixed(2));

    const matchHighlights: string[] = [];
    if (buyer.pickupOffered) matchHighlights.push('Farm-gate pickup (₹0 freight)');
    if (buyer.paymentTermsDays === 0) matchHighlights.push('Instant digital payout upon delivery');
    if (buyer.offeredPricePerKg >= expectedPricePerKg) matchHighlights.push(+₹/kg premium over expected);
    if (buyer.verifiedBuyer) matchHighlights.push('Verified Corporate Buyer');

    return {
      buyer,
      compositeScore,
      scoreBreakdown: {
        priceScore,
        quantityScore,
        qualityScore,
        distanceScore,
        deadlinePaymentScore,
        reliabilityScore,
      },
      freightCostEst,
      netFarmerRealizationPerKg,
      totalFarmerNetEarnings,
      isBestMatch: false,
      matchHighlights,
    };
  });

  // Sort descending by net farmer realization first, then composite score
  results.sort((a, b) => {
    if (b.netFarmerRealizationPerKg !== a.netFarmerRealizationPerKg) {
      return b.netFarmerRealizationPerKg - a.netFarmerRealizationPerKg;
    }
    return b.compositeScore - a.compositeScore;
  });

  if (results.length > 0) {
    results[0].isBestMatch = true;
  }

  return results;
}
