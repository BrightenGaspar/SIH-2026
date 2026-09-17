import { NextRequest, NextResponse } from 'next/server';
import { RatingEligibilityResponse, UserRole } from '@/types/review';
import { ratingService } from '@/services/ratingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId') || '';
    const raterUserId = searchParams.get('raterUserId') || '';
    const targetUserId = searchParams.get('targetUserId') || '';
    const targetRole = (searchParams.get('targetRole') || 'FARMER').toUpperCase() as UserRole;

    if (!transactionId || !raterUserId) {
      return NextResponse.json<RatingEligibilityResponse>({
        eligible: false,
        reason: 'Missing transaction or rater identification.',
        transactionId,
        targetUserId: targetUserId || 'unknown',
        targetRole,
        targetName: 'Participant',
        badgeType: 'VERIFIED_TRANSACTION',
        alreadyRated: false,
      }, { status: 400 });
    }

    const result = await ratingService.checkEligibility(
      transactionId,
      raterUserId,
      targetUserId || undefined,
      targetRole
    );

    const status = result.eligible ? 200 : (result.alreadyRated ? 200 : (result.reason?.includes('participants') ? 403 : 200));

    return NextResponse.json<RatingEligibilityResponse>(result, { status });
  } catch (err: any) {
    return NextResponse.json({ eligible: false, reason: err?.message || 'Server eligibility check error' }, { status: 500 });
  }
}
