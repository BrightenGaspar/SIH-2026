import { apiClient } from '@/lib/apiClient';
import { 
  CreateRatingPayload, 
  RatingEligibilityResponse, 
  RatingReview, 
  ParticipantRatingSummary,
  UserRole
} from '@/types/review';

export const ratingService = {
  /**
   * Check if authenticated user is backend-eligible to rate a transaction participant
   */
  async checkEligibility(
    transactionId: string, 
    raterUserId: string, 
    targetUserId?: string, 
    targetRole: UserRole = 'FARMER'
  ): Promise<RatingEligibilityResponse> {
    try {
      return await apiClient<RatingEligibilityResponse>('/api/ratings/eligibility', {
        method: 'GET',
        params: {
          transactionId,
          raterUserId,
          targetUserId,
          targetRole,
        },
      });
    } catch (err: any) {
      return {
        eligible: false,
        reason: err?.message || 'Ratings unavailable from server.',
        transactionId,
        targetUserId: targetUserId || '',
        targetRole,
        targetName: 'Participant',
        badgeType: 'VERIFIED_TRANSACTION',
        alreadyRated: false,
      };
    }
  },

  /**
   * Submit a verified rating and review
   */
  async submitRating(payload: CreateRatingPayload): Promise<{ success: boolean; review?: RatingReview; message?: string; error?: string }> {
    try {
      const res = await apiClient<{ success: boolean; review: RatingReview; message: string }>('/api/ratings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to submit rating. Please try again.',
      };
    }
  },

  /**
   * Fetch reviews for a specific produce product
   */
  async getReviewsForProduct(productId: string): Promise<{ reviews: RatingReview[]; summary: ParticipantRatingSummary }> {
    try {
      return await apiClient<{ reviews: RatingReview[]; summary: ParticipantRatingSummary }>('/api/ratings', {
        method: 'GET',
        params: { productId },
      });
    } catch {
      return {
        reviews: [],
        summary: {
          userId: 'unknown',
          role: 'FARMER',
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          verifiedTransactionsCount: 0,
        },
      };
    }
  },

  /**
   * Fetch rating summary & reviews for a Farmer, Buyer, or Logistics Operator
   */
  async getReviewsForUser(userId: string, role?: UserRole): Promise<{ reviews: RatingReview[]; summary: ParticipantRatingSummary }> {
    try {
      return await apiClient<{ reviews: RatingReview[]; summary: ParticipantRatingSummary }>('/api/ratings', {
        method: 'GET',
        params: { targetUserId: userId, role },
      });
    } catch {
      return {
        reviews: [],
        summary: {
          userId,
          role: role || 'FARMER',
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          verifiedTransactionsCount: 0,
        },
      };
    }
  },
};
