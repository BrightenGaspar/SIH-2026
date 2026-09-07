'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProductItem } from '@/types/consumer';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { KnowYourFarmerModal } from './KnowYourFarmerModal';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Eye, 
  TrendingUp,
  Check
} from 'lucide-react';

interface ProductCardProps {
  product: ProductItem;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const { t } = useI18n();
  const { addToCart } = useCart();
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [quantity, setQuantity] = useState<number>(product.minOrderQuantityKg || 1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'B':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Organic Certified':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <>
      <div className={`group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col ${
        viewMode === 'list' ? 'sm:flex-row' : ''
      }`}>
        {/* Top Product Image */}
        <div className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${
          viewMode === 'list' ? 'sm:w-64 h-56 sm:h-auto shrink-0' : 'h-52 w-full'
        }`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 sm:opacity-40 group-hover:opacity-70 transition-opacity" />
          
          {/* Grade Badge */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 shadow-sm ${getGradeBadgeColor(product.grade)}`}>
              Grade {product.grade}
            </span>
            {product.isColdChainEligible && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-cyan-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Cold-Chain
              </span>
            )}
          </div>

          {/* Freshness Badge */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg font-medium">
              <Calendar className="w-3 h-3 text-emerald-400" /> {product.freshness}
            </span>
            <span className="bg-emerald-600/90 text-white font-semibold px-2 py-0.5 rounded text-[11px]">
              {product.freshnessScore} Freshness
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {product.category}
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {product.name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
              {product.description}
            </p>

            {/* Farmer Connection */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowFarmerModal(true)}
                className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left group/farmer"
              >
                <img
                  src={product.farmerStory.farmerPhoto}
                  alt={product.farmerStory.farmerName}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500/30"
                />
                <div>
                  <span className="font-medium block leading-tight text-emerald-700 dark:text-emerald-400 underline-offset-2 group-hover/farmer:underline">
                    {product.farmerStory.farmerName}
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {product.farmerStory.district}, {product.farmerStory.state}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowFarmerModal(true)}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors"
              >
                {t('viewStory')}
              </button>
            </div>
          </div>

          {/* Pricing and Action */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-2xl font-black text-zinc-900 dark:text-white">
                  ₹{product.pricePerKg}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">/ kg</span>
                
                {product.bulkAvailable && (
                  <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Bulk discounts up to {Math.max(...(product.bulkTiers?.map(t => t.savingsPercent) || [0]))}%
                  </span>
                )}
              </div>

              {/* Price Transparency Trigger */}
              <button
                type="button"
                onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                className="text-xs text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 p-1 rounded transition-colors"
                title="See price breakdown"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium">{product.priceBreakdown.farmerRealizationBoostPercent}% Farmer Direct</span>
              </button>
            </div>

            {/* Quick Price Breakdown Drawer */}
            {showPriceBreakdown && (
              <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-1 text-zinc-600 dark:text-zinc-300">
                  <span>Farmer Receives (Direct):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{product.priceBreakdown.farmerReceivesPerKg}/kg</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-[11px]">
                  <span>Road Freight (Tata 407/Bolero):</span>
                  <span>₹{product.priceBreakdown.roadLogisticsPerKg}/kg</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-[11px]">
                  <span>Platform & Quality AI Fee:</span>
                  <span>₹{product.priceBreakdown.platformFeePerKg}/kg</span>
                </div>
              </div>
            )}

            {/* Quantity Stepper and Add to Cart */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-2 py-1">
                <input
                  type="number"
                  min={product.minOrderQuantityKg || 1}
                  max={product.availableQuantityKg}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.minOrderQuantityKg || 1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-transparent text-center font-bold text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
                <span className="text-[11px] text-zinc-400">kg</span>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.availableQuantityKg <= 0}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
                  isAdded 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Added ({quantity}kg)
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> {t('addToCart')}
                  </>
                )}
              </button>

              <Link
                href={`/consumer/product/${product.id}`}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                title="View Full Details"
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Know Your Farmer Modal */}
      <KnowYourFarmerModal
        isOpen={showFarmerModal}
        onClose={() => setShowFarmerModal(false)}
        farmerStory={product.farmerStory}
      />
    </>
  );
};

export default ProductCard;
