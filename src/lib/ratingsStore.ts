import { RatingReview } from '@/types/review';

// Global Store of Submitted Ratings (deduplicated by transactionId + raterUserId + ratedUserId)
export const submittedRatingsStore = new Map<string, any>();

// Global verified reviews repository
export const reviewsStore: RatingReview[] = [
  {
    id: 'REV-001',
    transactionId: 'ORD-HYD-5000',
    productId: 'PROD-001',
    productName: 'Hybrid Desi Tomatoes (Grade A)',
    raterUserId: 'user_consumer_demo',
    raterRole: 'BUYER',
    raterDisplayName: 'Priya S.',
    ratedUserId: 'farmer_01',
    ratedRole: 'FARMER',
    rating: 5,
    categoryRatings: {
      productQuality: 5,
      freshness: 5,
      communication: 4,
    },
    review: 'Produce was extraordinarily fresh and harvested same-day. Zero bruising in the reefer dispatch crate.',
    verificationBadge: 'VERIFIED_PURCHASE',
    isVerified: true,
    moderationStatus: 'PUBLISHED',
    createdAt: '2026-09-08 14:30',
  },
  {
    id: 'REV-002',
    transactionId: 'ORD-HYD-4892',
    productId: 'PROD-002',
    productName: 'Fresh Green Chillies (G4)',
    raterUserId: 'user_consumer_demo',
    raterRole: 'BUYER',
    raterDisplayName: 'Anand K. (Restaurant Owner)',
    ratedUserId: 'farmer_02',
    ratedRole: 'FARMER',
    rating: 4,
    categoryRatings: {
      productQuality: 4,
      freshness: 5,
      communication: 4,
    },
    review: 'Crisp chillies, good heat profile, verified direct harvest from Medak.',
    verificationBadge: 'VERIFIED_PURCHASE',
    isVerified: true,
    moderationStatus: 'PUBLISHED',
    createdAt: '2026-09-07 10:15',
  },
  {
    id: 'REV-003',
    transactionId: 'TRK-CONS-ROAD-9021',
    raterUserId: 'user_consumer_demo',
    raterRole: 'BUYER',
    raterDisplayName: 'Priya S.',
    ratedUserId: 'logistics_01',
    ratedRole: 'LOGISTICS',
    rating: 5,
    categoryRatings: {
      timeliness: 5,
      handling: 5,
      communication: 5,
    },
    review: 'The cold chain temperature was maintained at 4.2C throughout the 3-hour journey. Driver shared live OTP seamlessly.',
    verificationBadge: 'VERIFIED_SERVICE',
    isVerified: true,
    moderationStatus: 'PUBLISHED',
    createdAt: '2026-09-08 17:00',
  },
];