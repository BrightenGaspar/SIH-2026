'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MarketplaceProduceItem } from '@/services/consumerService';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Check, 
  Zap, 
  Minus, 
  Plus, 
  Sparkles,
  Radio
} from 'lucide-react';

interface ProduceCardProps {
  produce: MarketplaceProduceItem;
  isRecentlyUpdated?: boolean;
}

export const ProduceCard: React.FC<ProduceCardProps> = ({ produce, isRecentlyUpdated = false }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { language } = useI18n();
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  const currentLang = language || 'en';
  const getLocalizedField = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      return field[currentLang] || field['en'] || Object.values(field)[0] || '';
    }
    return String(field);
  };

  const displayCropName = getLocalizedField(produce.crop_name);
  const displayVariety = getLocalizedField(produce.variety);
  const displayCategory = getLocalizedField(produce.category) || 'Direct Farm Produce';

  const isOutOfStock = produce.quantity_kg <= 0;
  const minQty = 1;

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => Math.max(minQty, prev - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => Math.min(produce.quantity_kg, prev + 1));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || minQty;
    setQuantity(Math.min(produce.quantity_kg, Math.max(minQty, val)));
  };

  // Adapter to convert MarketplaceProduceItem to ProductItem for CartContext
  const getProductItem = () => ({
    id: produce.id,
    name: displayCropName,
    category: displayCategory as any,
    image: produce.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
    grade: (produce.quality_grade || 'A') as any,
    gradeDescription: `Grade ${produce.quality_grade || 'A'} Certified Farm Harvest`,
    availableQuantityKg: produce.quantity_kg,
    totalQuantityKg: produce.quantity_kg,
    minOrderQuantityKg: 1,
    harvestDate: produce.harvest_date || 'Harvested Recently',
    freshness: 'Harvested Today' as const,
    freshnessScore: 'Excellent' as const,
    farmerStory: {
      id: produce.farmer_id || 'farmer_partner',
      farmerName: produce.farmer_name || 'Verified Kisan Partner',
      farmOrFpoName: 'Direct Regional Producer Co.',
      farmerPhoto: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150',
      generalLocation: produce.location || 'Nashik APMC Hub',
      district: produce.location ? produce.location.split(',')[0].trim() : 'Nashik',
      state: 'Maharashtra',
      mainCrops: [displayCropName],
      harvestDate: produce.harvest_date || 'Harvested Recently',
      soilPractices: 'Sustainable compost & drip irrigation',
      organicPractices: 'Pesticide residue tested',
      story: 'Direct harvest order delivered via integrated cold chain corridor.',
      totalAcresGrown: '4.5 Acres',
      fairPriceCommitment: 'Direct Farmer Settlement',
    },
    location: produce.location || 'Local FPO Hub',
    pricePerKg: produce.price_per_kg,
    bulkAvailable: produce.quantity_kg >= 100,
    priceBreakdown: {
      consumerPricePerKg: produce.price_per_kg,
      farmerReceivesPerKg: Math.round(produce.price_per_kg * 0.87),
      roadLogisticsPerKg: Math.round(produce.price_per_kg * 0.08),
      platformFeePerKg: Math.round(produce.price_per_kg * 0.05),
      conventionalMarketPricePerKg: Math.round(produce.price_per_kg * 1.25),
      farmerRealizationBoostPercent: 25,
    },
    description: `${displayCropName}${displayVariety ? ` (${displayVariety})` : ''} directly sourced from farm hub at ${produce.location || 'Nashik'}.`,
    isColdChainEligible: true,
    tags: ['Direct Farmgate', 'Cold Chain Transport'],
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(getProductItem(), quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(getProductItem(), quantity);
    router.push('/consumer/checkout');
  };

  return (
    <div className={`group relative bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
      isRecentlyUpdated 
        ? 'border-emerald-500 ring-2 ring-emerald-400/50 shadow-emerald-500/20' 
        : 'border-zinc-200 dark:border-zinc-800'
    }`}>
      {/* Top Image & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={produce.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'}
          alt={displayCropName}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Pulsing LIVE badge when updated via Realtime */}
        {isRecentlyUpdated && (
          <div className="absolute top-3 left-3 z-10 animate-bounce">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-lg ring-2 ring-white">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE UPDATE
            </span>
          </div>
        )}

        {/* Stock status badge */}
        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-md uppercase tracking-wider">
              Out of Stock
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-md flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-200 animate-pulse" />
              {produce.quantity_kg.toLocaleString()} kg available
            </span>
          )}
        </div>

        {/* Bottom image overlay: Location */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg font-medium">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {produce.location || 'Nashik APMC Hub'}
          </span>
          <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[11px] font-semibold text-zinc-300">
            Grade {produce.quality_grade || 'A'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {displayCategory}
              </span>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                {displayCropName}
              </h3>
            </div>
          </div>

          {displayVariety && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
              Variety: {displayVariety}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">
              Farmer: <strong className="text-zinc-900 dark:text-white">{produce.farmer_name || 'Verified Kisan Partner'}</strong>
            </span>
            <span className="text-[11px] text-zinc-400">
              {produce.harvest_date ? `Harvest: ${produce.harvest_date}` : 'Fresh Harvest'}
            </span>
          </div>
        </div>

        {/* Pricing, Stepper and Action */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-zinc-900 dark:text-white">
                ₹{produce.price_per_kg}
              </span>
              <span className="text-xs text-zinc-500 ml-1">/ kg</span>
            </div>

            {/* Live indicator tag */}
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Realtime Stock
            </span>
          </div>

          {/* Stepper [-] X kg [+] & Order Now */}
          <div className="flex items-center gap-2">
            {/* Stepper */}
            <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-1 py-1">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={isOutOfStock || quantity <= minQty}
                className="w-7 h-7 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={minQty}
                max={produce.quantity_kg}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isOutOfStock}
                className="w-12 bg-transparent text-center font-bold text-xs text-zinc-900 dark:text-white focus:outline-none disabled:opacity-40"
              />
              <span className="text-[11px] text-zinc-400 pr-1">kg</span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={isOutOfStock || quantity >= produce.quantity_kg}
                className="w-7 h-7 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Order Now button */}
            <button
              type="button"
              onClick={handleOrderNow}
              disabled={isOutOfStock}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                isOutOfStock
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-300 dark:border-zinc-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {isOutOfStock ? 'Out of Stock' : 'Order Now'}
            </button>

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`p-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center transition ${
                isOutOfStock
                  ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed'
                  : isAdded
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
              title="Add to Cart"
            >
              {isAdded ? <Check className="w-4 h-4 text-emerald-600" /> : <ShoppingBag className="w-4 h-4" />}
            </button>
          </div>

          {/* Feedback footer */}
          {isAdded && (
            <div className="text-center text-[11px] font-bold text-emerald-600">
              ✓ Added {quantity} kg to cart!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProduceCard;
