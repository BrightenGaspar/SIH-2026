import { RatingReview } from '@/types/review';

// Global Store of Submitted Ratings (deduplicated by transactionId + raterUserId + ratedUserId)
export const submittedRatingsStore = new Map<string, any>();

// Global verified reviews repository
export const reviewsStore: RatingReview[] = [];