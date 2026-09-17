import { supabase } from '@/lib/supabase';
import { 
  CreateRatingPayload, 
  RatingEligibilityResponse, 
  RatingReview, 
  ParticipantRatingSummary,
  UserRole,
  VerificationBadgeType
} from '@/types/review';

function mapDbRowToRatingReview(
  row: any,
  reviewerProfile?: { id: string; full_name?: string; role?: string },
  orderInfo?: { commodity?: string; listing_id?: string }
): RatingReview {
  return {
    id: row.id,
    transactionId: row.order_id || row.transaction_id || '',
    productId: orderInfo?.listing_id || undefined,
    productName: orderInfo?.commodity || undefined,
    raterUserId: row.reviewer_id,
    raterRole: (reviewerProfile?.role?.toUpperCase() || 'BUYER') as UserRole,
    raterDisplayName: reviewerProfile?.full_name || 'Verified Buyer',
    ratedUserId: row.reviewee_id,
    ratedRole: 'FARMER' as UserRole,
    rating: Number(row.rating),
    categoryRatings: row.category_ratings || {},
    review: row.comment || '',
    verificationBadge: (row.verification_badge || 'VERIFIED_PURCHASE') as VerificationBadgeType,
    isVerified: row.is_verified ?? true,
    moderationStatus: (row.moderation_status || 'PUBLISHED') as any,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at,
  };
}

export const ratingService = {
  /**
   * Authoritatively check if authenticated user is backend-eligible to rate a transaction participant
   * Enforces: Delivered status, Direct participant involvement, Deduplication
   */
  async checkEligibility(
    transactionId: string, 
    raterUserId: string, 
    targetUserId?: string, 
    targetRole: UserRole = 'FARMER'
  ): Promise<RatingEligibilityResponse> {
    try {
      if (!transactionId || !raterUserId) {
        return {
          eligible: false,
          reason: 'Missing transaction or rater identification.',
          transactionId,
          targetUserId: targetUserId || '',
          targetRole,
          targetName: 'Participant',
          badgeType: 'VERIFIED_TRANSACTION',
          alreadyRated: false,
        };
      }

      // 1. Transaction must exist in authoritative public.orders
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, status, customer_id, buyer_id, farmer_id, commodity')
        .eq('id', transactionId)
        .maybeSingle();

      if (orderErr || !order) {
        return {
          eligible: false,
          reason: 'Transaction not found in order registry.',
          transactionId,
          targetUserId: targetUserId || '',
          targetRole,
          targetName: 'Participant',
          badgeType: 'VERIFIED_TRANSACTION',
          alreadyRated: false,
        };
      }

      // 2. Order MUST be Delivered
      const orderStatus = (order.status || '').toLowerCase();
      if (orderStatus !== 'delivered') {
        return {
          eligible: false,
          reason: `Rating is only available after order delivery (Current status: ${order.status}).`,
          transactionId,
          targetUserId: targetUserId || order.farmer_id,
          targetRole,
          targetName: 'Participant',
          badgeType: 'VERIFIED_PURCHASE',
          alreadyRated: false,
        };
      }

      // 3. User must have participated in the transaction
      const isConsumer = order.customer_id === raterUserId || order.buyer_id === raterUserId;
      const isFarmer = order.farmer_id === raterUserId;

      let isDriver = false;
      let driverId: string | null = null;
      let driverName = 'Logistics Carrier';

      const { data: assignment } = await supabase
        .from('logistics_assignments')
        .select('operator_id, profiles:operator_id(full_name)')
        .eq('order_id', transactionId)
        .maybeSingle();

      if (assignment) {
        driverId = assignment.operator_id;
        if (assignment.operator_id === raterUserId) isDriver = true;
        const profile = Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles;
        if (profile?.full_name) driverName = profile.full_name;
      }

      if (!isConsumer && !isFarmer && !isDriver) {
        return {
          eligible: false,
          reason: 'Only direct participants in this transaction may submit ratings.',
          transactionId,
          targetUserId: targetUserId || '',
          targetRole,
          targetName: 'Participant',
          badgeType: 'VERIFIED_TRANSACTION',
          alreadyRated: false,
        };
      }

      // Determine effective target user ID
      let effectiveTargetId = targetUserId;
      if (!effectiveTargetId) {
        if (targetRole === 'FARMER') effectiveTargetId = order.farmer_id;
        else if (targetRole === 'LOGISTICS') effectiveTargetId = driverId || undefined;
        else if (targetRole === 'BUYER' || targetRole === 'CONSUMER') effectiveTargetId = order.customer_id || order.buyer_id;
      }

      if (!effectiveTargetId) {
        return {
          eligible: false,
          reason: `Target participant not found for role ${targetRole}.`,
          transactionId,
          targetUserId: '',
          targetRole,
          targetName: 'Participant',
          badgeType: 'VERIFIED_TRANSACTION',
          alreadyRated: false,
        };
      }

      // 4. Anti-Self-Rating Guard
      if (raterUserId === effectiveTargetId) {
        return {
          eligible: false,
          reason: 'Anti-Self-Rating Guard: You cannot rate yourself.',
          transactionId,
          targetUserId: effectiveTargetId,
          targetRole,
          targetName: 'Self',
          badgeType: 'VERIFIED_TRANSACTION',
          alreadyRated: false,
        };
      }

      // 5. Deduplication Check in public.reviews
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', transactionId)
        .eq('reviewer_id', raterUserId)
        .eq('reviewee_id', effectiveTargetId)
        .maybeSingle();

      // Fetch target profile name
      let targetName = 'Participant';
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', effectiveTargetId)
        .maybeSingle();

      if (targetProfile?.full_name) {
        targetName = targetProfile.full_name;
      } else if (targetRole === 'LOGISTICS') {
        targetName = driverName;
      }

      let badgeType: VerificationBadgeType = 'VERIFIED_TRANSACTION';
      if (targetRole === 'FARMER') badgeType = 'VERIFIED_PURCHASE';
      else if (targetRole === 'LOGISTICS') badgeType = 'VERIFIED_SERVICE';

      if (existingReview) {
        return {
          eligible: false,
          reason: 'You have already submitted a rating for this completed transaction.',
          transactionId,
          targetUserId: effectiveTargetId,
          targetRole,
          targetName,
          badgeType,
          existingRatingId: existingReview.id,
          alreadyRated: true,
        };
      }

      return {
        eligible: true,
        transactionId,
        targetUserId: effectiveTargetId,
        targetRole,
        targetName,
        badgeType,
        alreadyRated: false,
      };
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
   * Submit a verified rating and review live via Phase 2 submit_verified_review RPC
   */
  async submitRating(
    payload: CreateRatingPayload
  ): Promise<{ success: boolean; review?: RatingReview; message?: string; error?: string }> {
    try {
      if (payload.raterUserId === payload.ratedUserId) {
        return { success: false, error: 'Anti-Self-Rating Guard: You cannot rate yourself.' };
      }

      const rolePerspective = payload.ratedRole === 'LOGISTICS' ? 'VERIFIED_SERVICE' : 'VERIFIED_PURCHASE';

      const { data, error } = await supabase.rpc('submit_verified_review', {
        p_order_id: payload.transactionId,
        p_reviewee_id: payload.ratedUserId,
        p_rating: payload.rating,
        p_comment: payload.review?.trim() || '',
        p_role_perspective: rolePerspective,
        p_category_ratings: payload.categoryRatings || {},
      });

      if (error) {
        let msg = error.message;
        if (error.code === '23505' || msg.includes('already submitted')) {
          msg = 'Duplicate review: You have already submitted a review for this transaction.';
        } else if (msg.includes('Anti-Self-Rating') || msg.includes('cannot review yourself')) {
          msg = 'Anti-Self-Rating Guard: You cannot review yourself.';
        } else if (msg.includes('delivered')) {
          msg = 'Reviews can only be submitted for completed/delivered orders.';
        } else if (error.code === '42501' || msg.includes('Authentication required')) {
          msg = 'Authentication required: User must be signed in to submit a review.';
        }
        return { success: false, error: msg };
      }

      const createdRow = data?.review || data;
      const mappedReview = mapDbRowToRatingReview(createdRow, {
        id: payload.raterUserId,
        full_name: payload.raterDisplayName,
        role: payload.raterRole,
      }, {
        commodity: payload.productName,
        listing_id: payload.productId,
      });

      return {
        success: true,
        review: mappedReview,
        message: 'Verified rating and review submitted successfully.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to submit rating. Please try again.',
      };
    }
  },

  /**
   * Fetch reviews for a specific produce product live from public.reviews
   */
  async getReviewsForProduct(productId: string): Promise<{ reviews: RatingReview[]; summary: ParticipantRatingSummary }> {
    const emptySummary: ParticipantRatingSummary = {
      userId: productId,
      role: 'FARMER',
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verifiedTransactionsCount: 0,
    };

    try {
      // 1. Locate orders for this listing/product
      const { data: orders } = await supabase
        .from('orders')
        .select('id, commodity, listing_id')
        .eq('listing_id', productId);

      if (!orders || orders.length === 0) {
        return { reviews: [], summary: emptySummary };
      }

      const orderIds = orders.map((o) => o.id);
      const orderMap = new Map(orders.map((o) => [o.id, o]));

      // 2. Fetch published reviews for these orders
      const { data: revs, error } = await supabase
        .from('reviews')
        .select('*')
        .in('order_id', orderIds)
        .eq('moderation_status', 'PUBLISHED')
        .order('created_at', { ascending: false });

      if (error || !revs || revs.length === 0) {
        return { reviews: [], summary: emptySummary };
      }

      // 3. Fetch profiles for reviewers
      const reviewerIds = Array.from(new Set(revs.map((r) => r.reviewer_id)));
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', reviewerIds);

      const profileMap = new Map((profs || []).map((p) => [p.id, p]));

      const mappedReviews = revs.map((r) =>
        mapDbRowToRatingReview(r, profileMap.get(r.reviewer_id), orderMap.get(r.order_id))
      );

      // Compute aggregates
      const totalReviews = mappedReviews.length;
      const sum = mappedReviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      mappedReviews.forEach((r) => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        ratingDistribution[star] = (ratingDistribution[star] || 0) + 1;
      });

      return {
        reviews: mappedReviews,
        summary: {
          userId: productId,
          role: 'FARMER',
          averageRating,
          totalReviews,
          ratingDistribution,
          verifiedTransactionsCount: totalReviews,
        },
      };
    } catch (err: any) {
      console.warn('Error fetching product reviews:', err?.message);
      return { reviews: [], summary: emptySummary };
    }
  },

  /**
   * Fetch rating summary & reviews for a Farmer, Buyer, or Logistics Operator
   */
  async getReviewsForUser(
    userId: string, 
    role?: UserRole
  ): Promise<{ reviews: RatingReview[]; summary: ParticipantRatingSummary }> {
    const emptySummary: ParticipantRatingSummary = {
      userId,
      role: role || 'FARMER',
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verifiedTransactionsCount: 0,
    };

    try {
      const { data: revs, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .eq('moderation_status', 'PUBLISHED')
        .order('created_at', { ascending: false });

      if (error || !revs || revs.length === 0) {
        return { reviews: [], summary: emptySummary };
      }

      // Fetch reviewer profiles
      const reviewerIds = Array.from(new Set(revs.map((r) => r.reviewer_id)));
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', reviewerIds);

      const profileMap = new Map((profs || []).map((p) => [p.id, p]));

      const mappedReviews = revs.map((r) =>
        mapDbRowToRatingReview(r, profileMap.get(r.reviewer_id))
      );

      const totalReviews = mappedReviews.length;
      const sum = mappedReviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      mappedReviews.forEach((r) => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        ratingDistribution[star] = (ratingDistribution[star] || 0) + 1;
      });

      return {
        reviews: mappedReviews,
        summary: {
          userId,
          role: role || 'FARMER',
          averageRating,
          totalReviews,
          ratingDistribution,
          verifiedTransactionsCount: totalReviews,
        },
      };
    } catch (err: any) {
      console.warn('Error fetching user reviews:', err?.message);
      return { reviews: [], summary: emptySummary };
    }
  },
};
