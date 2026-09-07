'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { consumerService } from '@/services/consumerService';
import { ProductDetails } from '@/types/consumer';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import KnowYourFarmerModal from '@/components/consumer/KnowYourFarmerModal';
import PriceBreakdownCard from '@/components/consumer/PriceBreakdownCard';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag, 
  Check, 
  TrendingUp, 
  Snowflake, 
  Award, 
  Clock, 
  Info,
  CheckCircle2
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useI18n();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);

  useEffect(() => {
    async function load() {
      if (params.id) {
        setLoading(true);
        const item = await consumerService.getProductById(params.id as string);
        if (item) {
          setProduct(item);
          setQuantity(item.minOrderQuantityKg || 1);
        }
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400">Loading verified harvest details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Produce Not Found</h2>
        <p className="text-xs text-zinc-500">The product batch requested may have expired or sold out.</p>
        <Link href="/consumer/marketplace" className="inline-flex px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Calculate current price per kg based on volume tiers
  const getActivePricePerKg = () => {
    if (!product.bulkTiers || product.bulkTiers.length === 0) return product.pricePerKg;
    const matchedTier = [...product.bulkTiers]
      .reverse()
      .find(tier => quantity >= tier.minKg && (tier.maxKg === null || quantity <= tier.maxKg));
    return matchedTier ? matchedTier.pricePerKg : product.pricePerKg;
  };

  const activePricePerKg = getActivePricePerKg();
  const totalPrice = activePricePerKg * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back to Marketplace */}
      <Link
        href="/consumer/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image & Quality Report */}
        <div className="lg:col-span-6 space-y-6">
          <div className="relative rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 aspect-[4/3] shadow-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-zinc-900/90 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md shadow-sm">
                Grade {product.grade}
              </span>
              {product.isColdChainEligible && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <Snowflake className="w-3.5 h-3.5" /> Cold-Chain
                </span>
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/60 backdrop-blur-md text-white flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {product.freshness}
              </span>
              <span className="font-bold text-emerald-400">
                Batch #{product.harvestBatchNumber || 'AGRI-2026-09'}
              </span>
            </div>
          </div>

          {/* AI Quality Inspection Certificate */}
          {product.qualityInspectionReport && (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  AI Computer-Vision Quality Assessment
                </h4>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  Passed (98.4%)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <span className="text-[10px] text-zinc-400 block">Color Uniformity</span>
                  <span className="text-sm font-black text-zinc-900 dark:text-white">{product.qualityInspectionReport.colorScore}/100</span>
                </div>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <span className="text-[10px] text-zinc-400 block">Firmness Index</span>
                  <span className="text-sm font-black text-zinc-900 dark:text-white">{product.qualityInspectionReport.firmnessScore}/100</span>
                </div>
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <span className="text-[10px] text-zinc-400 block">Surface Defect</span>
                  <span className="text-sm font-black text-emerald-500">{product.qualityInspectionReport.defectPercentage}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Transparent Price Breakdown */}
          <PriceBreakdownCard
            breakdown={product.priceBreakdown}
            produceName={product.name}
          />
        </div>

        {/* Right Column: Product Meta, Bulk Tiers & Checkout */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Farmer Provenance Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={product.farmerStory.farmerPhoto}
                alt={product.farmerStory.farmerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/40"
              />
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                  {product.farmerStory.farmerName} ({product.farmerStory.farmOrFpoName})
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-500" /> {product.farmerStory.generalLocation}, {product.farmerStory.state}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFarmerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-zinc-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors shadow-sm"
            >
              Know Farmer
            </button>
          </div>

          {/* Bulk Tier Pricing */}
          {product.bulkTiers && product.bulkTiers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Wholesale Volume Price Tiers
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {product.bulkTiers.map((tier, i) => {
                  const isCurrent = quantity >= tier.minKg && (tier.maxKg === null || quantity <= tier.maxKg);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuantity(tier.minKg)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40'
                      }`}
                    >
                      <span className="text-[11px] text-zinc-500 block">
                        {tier.minKg} - {tier.maxKg ? `${tier.maxKg} kg` : '+ kg'}
                      </span>
                      <span className="text-sm font-black text-zinc-900 dark:text-white block mt-0.5">
                        ₹{tier.pricePerKg} <span className="text-[10px] font-normal text-zinc-400">/kg</span>
                      </span>
                      {tier.savingsPercent > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          Save {tier.savingsPercent}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sourcing Specs */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 block">Available Volume</span>
              <span className="font-bold text-zinc-900 dark:text-white">{product.availableQuantityKg.toLocaleString('en-IN')} kg</span>
            </div>
            <div>
              <span className="text-zinc-400 block">Optimal Temp</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{product.optimalStorageTempCelsius || 8}°C (Reefer Safe)</span>
            </div>
            <div>
              <span className="text-zinc-400 block">Shelf Life</span>
              <span className="font-bold text-zinc-900 dark:text-white">{product.shelfLifeDays || 7} Days</span>
            </div>
            <div>
              <span className="text-zinc-400 block">Minimum Order</span>
              <span className="font-bold text-zinc-900 dark:text-white">{product.minOrderQuantityKg || 1} kg</span>
            </div>
          </div>

          {/* Action Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-zinc-400 block">Total Order Price</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1 font-semibold">
                  (₹{activePricePerKg}/kg)
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(product.minOrderQuantityKg || 1, quantity - (quantity > 100 ? 50 : 1)))}
                  className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  -
                </button>
                <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800">
                  <input
                    type="number"
                    min={product.minOrderQuantityKg || 1}
                    max={product.availableQuantityKg}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(product.minOrderQuantityKg || 1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-transparent text-center font-bold text-sm text-zinc-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-xs text-zinc-400">kg</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.availableQuantityKg, quantity + (quantity >= 100 ? 50 : 1)))}
                  className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                {isAdded ? `Added ${quantity}kg` : 'Add to Cart'}
              </button>

              <button
                type="button"
                onClick={() => {
                  addToCart(product, quantity);
                  router.push('/consumer/checkout');
                }}
                className="py-3.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs shadow-md transition-colors"
              >
                Direct Sourcing Order
              </button>
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
    </div>
  );
}
