'use client';

import React, { useState, useEffect } from 'react';
import { ratingService } from '@/services/ratingService';
import { RatingReview, ParticipantRatingSummary } from '@/types/review';
import { StarRating } from '@/components/common/StarRating';
import ReportModal from '@/components/reports/ReportModal';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, 
  Flag, 
  MessageSquare 
} from 'lucide-react';

interface ProductReviewsSectionProps {
  productId: string;
  farmerId: string;
  farmerName: string;
  productName: string;
}

export default function ProductReviewsSection({
  productId,
  farmerId,
  farmerName,
  productName,
}: ProductReviewsSectionProps) {
  const { consumerUser } = useAuth();
  const [reviews, setReviews] = useState<RatingReview[]>([]);
  const [summary, setSummary] = useState<ParticipantRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Reporting State
  const [reportReview, setReportReview] = useState<RatingReview | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    ratingService.getReviewsForProduct(productId)
      .then((res) => {
        if (isMounted) {
          setReviews(res.reviews || []);
          setSummary(res.summary || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews([]);
          setSummary(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const totalReviews = summary?.totalReviews || reviews.length;
  const avgRating = summary?.averageRating || 0;

  return (
    <div className="space-y-6 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Trust & Quality Assurance
          </span>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">
            Verified Buyer Reviews & Farmer Rating
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            100% verified purchases backed by completed cold-chain dispatches from {farmerName}.
          </p>
        </div>
      </div>

      {/* Summary Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/60 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        
        {/* Left: Overall Score */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 space-y-1.5">
          {totalReviews > 0 ? (
            <>
              <span className="text-4xl font-black text-zinc-900 dark:text-white">
                {avgRating.toFixed(1)}
              </span>
              <StarRating rating={avgRating} size="md" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {totalReviews} Verified {totalReviews === 1 ? 'Purchase' : 'Purchases'}
              </span>
            </>
          ) : (
            <div className="py-4">
              <span className="text-sm font-bold text-zinc-400 block">No ratings yet</span>
              <span className="text-[11px] text-zinc-500 mt-1 block">Be the first to rate after completed delivery!</span>
            </div>
          )}
        </div>

        {/* Middle: Rating Distribution Breakdown */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-1.5 px-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary?.ratingDistribution?.[star as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2.5 text-xs">
                <span className="w-10 font-bold text-zinc-700 dark:text-zinc-300 shrink-0 text-right">
                  {star} Star
                </span>
                <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-[11px] font-mono text-zinc-400 text-right shrink-0">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Customer Reviews ({reviews.length})
        </h3>

        {loading && (
          <div className="p-8 text-center text-xs text-zinc-400">
            Loading verified reviews...
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">No reviews yet for this harvest batch.</p>
            <p className="text-[11px] text-zinc-500">
              Verified buyers receive a Rate & Review prompt once their order arrives at the doorstep.
            </p>
          </div>
        )}

        {!loading && reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                  {rev.raterDisplayName ? rev.raterDisplayName[0] : 'B'}
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                    {rev.raterDisplayName}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Reviewed on {rev.createdAt}
                  </span>
                </div>
              </div>

              {/* Verified Purchase Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  ✓ Verified Purchase
                </span>

                <button
                  type="button"
                  onClick={() => setReportReview(rev)}
                  title="Report inappropriate review"
                  className="p-1 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stars & Categories */}
            <div className="flex items-center gap-3">
              <StarRating rating={rev.rating} size="sm" />
              {rev.categoryRatings?.freshness && (
                <span className="text-[10px] text-zinc-400">
                  Freshness: <strong className="text-zinc-700 dark:text-zinc-300">{rev.categoryRatings.freshness}/5</strong>
                </span>
              )}
            </div>

            {/* Review Content */}
            {rev.review && (
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                "{rev.review}"
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Review Reporting Modal */}
      {reportReview && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportReview(null)}
          reportType="REVIEW"
          reporterUserId={consumerUser?.id || 'user_consumer_guest'}
          reporterRole="BUYER"
          reporterDisplayName={consumerUser?.name || 'Verified Buyer'}
          reviewId={reportReview.id}
          reportedName={`Review #${reportReview.id} by ${reportReview.raterDisplayName}`}
        />
      )}
    </div>
  );
}