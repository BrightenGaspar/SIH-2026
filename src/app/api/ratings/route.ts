import { NextRequest, NextResponse } from 'next/server';
import { CreateRatingPayload } from '@/types/review';
import { ratingService } from '@/services/ratingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');
    const productId = searchParams.get('productId');
    const role = searchParams.get('role');

    if (productId) {
      const result = await ratingService.getReviewsForProduct(productId);
      return NextResponse.json(result);
    }

    if (targetUserId) {
      const result = await ratingService.getReviewsForUser(targetUserId, role as any);
      return NextResponse.json(result);
    }

    // Default fallback to all reviews for user
    const result = await ratingService.getReviewsForUser(targetUserId || 'all', role as any);
    return NextResponse.json(result);
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

    // 2. Submit rating through authoritative ratingService & Phase 2 RPC
    const res = await ratingService.submitRating(body);

    if (!res.success) {
      const status = res.error?.includes('Duplicate') ? 409 : (res.error?.includes('yourself') ? 403 : 400);
      return NextResponse.json({ error: res.error }, { status });
    }

    return NextResponse.json({
      success: true,
      review: res.review,
      message: res.message || 'Verified rating and review submitted successfully.',
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit rating' }, { status: 500 });
  }
}
