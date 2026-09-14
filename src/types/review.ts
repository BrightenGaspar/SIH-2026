/**
 * AgriFlow Trust & Safety Models
 * Reciprocal Verified Ratings, Reviews, and User/Resource Reporting System
 */

export type UserRole = 'FARMER' | 'CONSUMER' | 'BUYER' | 'LOGISTICS';

export type ModerationStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REJECTED';

export type VerificationBadgeType = 
  | 'VERIFIED_PURCHASE'     // Buyer rating Farmer & Produce item
  | 'VERIFIED_TRANSACTION'  // Farmer rating Buyer
  | 'VERIFIED_SERVICE';     // Participant rating Logistics Operator or Logistics rating Participant

export interface CategoryRatings {
  productQuality?: number;     // 1-5 (Farmer/Product)
  freshness?: number;          // 1-5 (Farmer/Product)
  communication?: number;      // 1-5 (All participants)
  timeliness?: number;         // 1-5 (Logistics)
  handling?: number;           // 1-5 (Logistics)
  orderClarity?: number;       // 1-5 (Buyer)
  paymentExperience?: number;  // 1-5 (Buyer)
}

export interface RatingReview {
  id: string;
  transactionId: string;           // Order ID or Trip ID
  orderItemId?: string;            // Specific produce item if applicable
  productId?: string;              // Specific product ID
  productName?: string;            // Produce crop name
  raterUserId: string;             // Submitter
  raterRole: UserRole;             // Rater portal type
  raterDisplayName: string;        // Safe public display name (e.g. Ramesh R. or Hyderabad Retailer)
  ratedUserId: string;             // Participant being evaluated
  ratedRole: UserRole;             // Role of evaluated user
  rating: number;                  // Overall 1 to 5 stars
  categoryRatings?: CategoryRatings;
  review?: string;                 // Written feedback
  verificationBadge: VerificationBadgeType;
  isVerified: boolean;             // Backend confirmed transaction participation
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface RatingEligibilityRequest {
  transactionId: string;
  raterUserId: string;
  ratedUserId: string;
}

export interface RatingEligibilityResponse {
  eligible: boolean;
  reason?: string;
  transactionId: string;
  targetUserId: string;
  targetRole: UserRole;
  targetName: string;
  badgeType: VerificationBadgeType;
  existingRatingId?: string;
  alreadyRated: boolean;
}

export interface ParticipantRatingSummary {
  userId: string;
  role: UserRole;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedTransactionsCount: number;
  categoryAverages?: {
    quality?: number;
    freshness?: number;
    communication?: number;
    timeliness?: number;
    handling?: number;
  };
}

// ============================================================================
// [REPORT] USER & RESOURCE REPORTING MODELS
// ============================================================================

export type ReportType = 'USER' | 'PRODUCT' | 'ORDER' | 'REVIEW' | 'LOGISTICS_SERVICE';

export type ReportReason = 
  | 'FRAUD_SUSPICIOUS'
  | 'MISLEADING_INFO'
  | 'POOR_UNSAFE_PRODUCT'
  | 'HARASSMENT_ABUSE'
  | 'PAYMENT_ISSUE'
  | 'DELIVERY_ISSUE'
  | 'SPAM_IRRELEVANT'
  | 'FAKE_REVIEW'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface ReportEntity {
  id: string;
  reporterUserId: string;
  reporterRole: UserRole;
  reporterDisplayName?: string;
  reportedUserId?: string;
  reportedRole?: UserRole;
  reportType: ReportType;
  reason: ReportReason;
  description?: string;
  transactionId?: string;
  productId?: string;
  orderItemId?: string;
  reviewId?: string;
  status: ReportStatus;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRatingPayload {
  transactionId: string;
  orderItemId?: string;
  productId?: string;
  productName?: string;
  raterUserId: string;
  raterRole: UserRole;
  raterDisplayName: string;
  ratedUserId: string;
  ratedRole: UserRole;
  rating: number;
  categoryRatings?: CategoryRatings;
  review?: string;
}

export interface CreateReportPayload {
  reporterUserId: string;
  reporterRole: UserRole;
  reporterDisplayName?: string;
  reportedUserId?: string;
  reportedRole?: UserRole;
  reportType: ReportType;
  reason: ReportReason;
  description?: string;
  transactionId?: string;
  productId?: string;
  orderItemId?: string;
  reviewId?: string;
}
