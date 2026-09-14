'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showNumeric?: boolean;
  totalReviews?: number;
  className?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showNumeric = false,
  totalReviews,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= activeRating;
          const isHalf = !isFilled && starValue - 0.5 <= activeRating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110 focus:outline-none' : 'cursor-default'}`}
              aria-label={`${starValue} Stars`}
            >
              <Star
                className={`${starSizes[size]} transition-colors ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-transparent text-slate-300 dark:text-slate-700'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showNumeric && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
          {rating > 0 ? rating.toFixed(1) : 'No ratings yet'}
        </span>
      )}

      {totalReviews !== undefined && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          ({totalReviews > 0 ? `${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}` : '0 reviews'})
        </span>
      )}
    </div>
  );
}