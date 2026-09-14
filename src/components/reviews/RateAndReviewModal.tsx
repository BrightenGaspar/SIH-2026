'use client';

import React, { useState, useEffect } from 'react';
import { ratingService } from '@/services/ratingService';
import { 
  RatingEligibilityResponse, 
  UserRole, 
  CategoryRatings 
} from '@/types/review';
import { StarRating } from '@/components/common/StarRating';
import { Button } from '@/components/common/Button';
import { useI18n } from '@/context/I18nContext';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ThumbsUp
} from 'lucide-react';

interface RateAndReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  orderItemId?: string;
  productId?: string;
  productName?: string;
  raterUserId: string;
  raterRole: UserRole;
  raterDisplayName: string;
  targetUserId?: string;
  targetRole?: UserRole;
  targetName?: string;
  onRatingSuccess?: () => void;
}

export default function RateAndReviewModal({
  isOpen,
  onClose,
  transactionId,
  orderItemId,
  productId,
  productName,
  raterUserId,
  raterRole,
  raterDisplayName,
  targetUserId,
  targetRole = 'FARMER',
  targetName: initialTargetName,
  onRatingSuccess,
}: RateAndReviewModalProps) {
  const { t } = useI18n();

  const [checking, setChecking] = useState(true);
  const [eligibility, setEligibility] = useState<RatingEligibilityResponse | null>(null);
  
  // Rating Form States
  const [rating, setRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [freshnessRating, setFreshnessRating] = useState<number>(5);
  const [communicationRating, setCommunicationRating] = useState<number>(5);
  const [timelinessRating, setTimelinessRating] = useState<number>(5);
  const [review, setReview] = useState<string>('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setChecking(true);
    setSubmitError('');
    setSubmittedSuccess(false);

    ratingService.checkEligibility(transactionId, raterUserId, targetUserId, targetRole)
      .then((res) => {
        if (isMounted) {
          setEligibility(res);
          setChecking(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setEligibility({
            eligible: false,
            reason: err?.message || 'Unable to check rating eligibility from backend.',
            transactionId,
            targetUserId: targetUserId || '',
            targetRole,
            targetName: initialTargetName || 'Participant',
            badgeType: 'VERIFIED_TRANSACTION',
            alreadyRated: false,
          });
          setChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, transactionId, raterUserId, targetUserId, targetRole, initialTargetName]);

  if (!isOpen) return null;

  const targetDisplayName = eligibility?.targetName || initialTargetName || 'Participant';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility || !eligibility.eligible) return;

    setSubmitting(true);
    setSubmitError('');

    const categoryRatings: CategoryRatings = {};
    if (targetRole === 'FARMER') {
      categoryRatings.productQuality = qualityRating;
      categoryRatings.freshness = freshnessRating;
      categoryRatings.communication = communicationRating;
    } else if (targetRole === 'LOGISTICS') {
      categoryRatings.timeliness = timelinessRating;
      categoryRatings.communication = communicationRating;
    } else {
      categoryRatings.communication = communicationRating;
    }

    const res = await ratingService.submitRating({
      transactionId,
      orderItemId,
      productId,
      productName,
      raterUserId,
      raterRole,
      raterDisplayName,
      ratedUserId: eligibility.targetUserId || targetUserId || '',
      ratedRole: targetRole,
      rating,
      categoryRatings,
      review,
    });

    setSubmitting(false);

    if (res.success) {
      setSubmittedSuccess(true);
      if (onRatingSuccess) onRatingSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setSubmitError(res.error || 'Failed to submit rating. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Verified Trust & Safety Review
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {targetRole === 'FARMER' ? 'Rate Farmer & Harvest Quality' : targetRole === 'LOGISTICS' ? 'Rate Logistics Carrier' : 'Rate Buyer Transaction'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluating: <strong className="text-slate-800 dark:text-slate-200">{targetDisplayName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Loading State */}
        {checking && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-emerald-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Validating completed transaction with backend registry...
            </p>
          </div>
        )}

        {/* 2. Ineligible or Already Rated Notice */}
        {!checking && eligibility && !eligibility.eligible && (
          <div className="py-8 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {eligibility.alreadyRated ? 'Already Rated' : 'Rating Not Available'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {eligibility.reason}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={onClose} className="mt-2">
              Close
            </Button>
          </div>
        )}

        {/* 3. Submitted Success Toast */}
        {!checking && submittedSuccess && (
          <div className="py-10 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Rating Submitted Successfully!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your verified review has been confirmed by the backend and updated on the public trust ledger.
            </p>
          </div>
        )}

        {/* 4. Active Rating Form */}
        {!checking && eligibility && eligibility.eligible && !submittedSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Verified Badge Header */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-bold">
                {eligibility.badgeType === 'VERIFIED_PURCHASE' ? '✓ Verified Purchase (Delivered Order)' : eligibility.badgeType === 'VERIFIED_SERVICE' ? '✓ Verified Logistics Trip' : '✓ Verified Completed Transaction'}
              </span>
            </div>

            {/* Main 1-5 Star Selection */}
            <div className="text-center py-2 space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Overall Rating *
              </label>
              <div className="flex justify-center">
                <StarRating
                  rating={rating}
                  size="lg"
                  interactive={true}
                  onRatingChange={setRating}
                />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Average (3/5)' : rating === 2 ? 'Below Expectation (2/5)' : 'Poor (1/5)'}
              </span>
            </div>

            {/* Role Specific Category Ratings */}
            {targetRole === 'FARMER' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-slate-600 dark:text-slate-400 block font-semibold">Crop Freshness</span>
                  <StarRating rating={freshnessRating} size="sm" interactive={true} onRatingChange={setFreshnessRating} />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-slate-600 dark:text-slate-400 block font-semibold">Produce Quality</span>
                  <StarRating rating={qualityRating} size="sm" interactive={true} onRatingChange={setQualityRating} />
                </div>
              </div>
            )}

            {targetRole === 'LOGISTICS' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-slate-600 dark:text-slate-400 block font-semibold">Timeliness & ETA</span>
                  <StarRating rating={timelinessRating} size="sm" interactive={true} onRatingChange={setTimelinessRating} />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-slate-600 dark:text-slate-400 block font-semibold">Cold-Chain Handling</span>
                  <StarRating rating={qualityRating} size="sm" interactive={true} onRatingChange={setQualityRating} />
                </div>
              </div>
            )}

            {/* Written Review */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Written Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                placeholder={targetRole === 'FARMER' ? 'Share your feedback on produce freshness, grading accuracy, and packaging...' : 'Share details on the transaction and service...'}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 outline-none transition resize-none"
              />
            </div>

            {/* Would Recommend Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                Would you transact with this {targetRole === 'FARMER' ? 'Farmer' : targetRole === 'LOGISTICS' ? 'Carrier' : 'Buyer'} again?
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    wouldRecommend
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    !wouldRecommend
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submitting} className="min-w-[120px]">
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </span>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}