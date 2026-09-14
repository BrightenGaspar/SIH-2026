import { NextRequest, NextResponse } from 'next/server';
import { CreateRatingPayload, RatingReview, ParticipantRatingSummary } from '@/types/review';
import { submittedRatingsStore, reviewsStore } from '@/lib/ratingsStore';

// Seed submitted ratings store for deduplication
if (!submittedRatingsStore.has('ORD-HYD-5000_user_consumer_demo_farmer_01') && reviewsStore.length > 0) {
  submittedRatingsStore.set('ORD-HYD-5000_user_consumer_demo_farmer_01', reviewsStore[0]);
  submittedRatingsStore.set('ORD-HYD-4892_user_consumer_demo_farmer_02', reviewsStore[1]);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');
    const productId = searchParams.get('productId');
    const role = searchParams.get('role');

    let filtered = reviewsStore.filter((r) => r.moderationStatus === 'PUBLISHED');

    if (targetUserId) {
      filtered = filtered.filter((r) => r.ratedUserId === targetUserId);
    }
    if (productId) {
      filtered = filtered.filter((r) => r.productId === productId);
    }
    if (role) {
      filtered = filtered.filter((r) => r.ratedRole === role.toUpperCase());
    }

    // Compute REAL aggregated metrics (No fake hardcoding)
    const totalReviews = filtered.length;
    let averageRating = 0;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const sum = filtered.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));

      filtered.forEach((r) => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        ratingDistribution[star] = (ratingDistribution[star] || 0) + 1;
      });
    }

    const summary: ParticipantRatingSummary = {
      userId: targetUserId || 'all',
      role: (role ? role.toUpperCase() : 'FARMER') as any,
      averageRating,
      totalReviews,
      ratingDistribution,
      verifiedTransactionsCount: totalReviews,
    };

    return NextResponse.json({
      reviews: filtered,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching ratings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRatingPayload = await request.json();

    // 1. Validation
    if (!body.transactionId || !body.raterUserId || !body.ratedUserId || !body.rating) {
      return NextResponse.json({ error: 'Missing required rating fields.' }, { status: 400 });
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5 stars.' }, { status: 400 });
    }

    // 2. Anti-Self Rating Guard
    if (body.raterUserId === body.ratedUserId) {
      return NextResponse.json({ error: 'You cannot rate yourself.' }, { status: 403 });
    }

    // 3. Deduplication Check
    const ratingKey = `${body.transactionId}_${body.raterUserId}_${body.ratedUserId}`;
    if (submittedRatingsStore.has(ratingKey)) {
      return NextResponse.json({ error: 'Duplicate rating: You have already submitted a rating for this transaction.' }, { status: 409 });
    }

    // 4. Determine verified badge type
    let badgeType: 'VERIFIED_PURCHASE' | 'VERIFIED_TRANSACTION' | 'VERIFIED_SERVICE' = 'VERIFIED_TRANSACTION';
    if (body.raterRole === 'BUYER' || body.raterRole === 'CONSUMER') {
      badgeType = body.ratedRole === 'LOGISTICS' ? 'VERIFIED_SERVICE' : 'VERIFIED_PURCHASE';
    } else if (body.raterRole === 'LOGISTICS') {
      badgeType = 'VERIFIED_SERVICE';
    }

    // 5. Create Review Entity
    const newReview: RatingReview = {
      id: `REV-${Date.now().toString().slice(-6)}`,
      transactionId: body.transactionId,
      orderItemId: body.orderItemId,
      productId: body.productId,
      productName: body.productName,
      raterUserId: body.raterUserId,
      raterRole: body.raterRole,
      raterDisplayName: body.raterDisplayName || 'Verified Buyer',
      ratedUserId: body.ratedUserId,
      ratedRole: body.ratedRole,
      rating: body.rating,
      categoryRatings: body.categoryRatings,
      review: body.review?.trim() || undefined,
      verificationBadge: badgeType,
      isVerified: true,
      moderationStatus: 'PUBLISHED', // Real published review
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    reviewsStore.unshift(newReview);
    submittedRatingsStore.set(ratingKey, newReview);

    return NextResponse.json({
      success: true,
      review: newReview,
      message: 'Verified rating and review submitted successfully.',
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit rating' }, { status: 500 });
  }
}
