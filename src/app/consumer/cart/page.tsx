'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Truck, 
  ShieldCheck, 
  TrendingUp, 
  MapPin, 
  Sparkles 
} from 'lucide-react';

export default function ConsumerCartPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { 
    items, 
    removeFromCart, 
    incrementQuantity, 
    decrementQuantity, 
    clearCart,
    subtotal, 
    roadLogisticsFee, 
    platformFee, 
    total, 
    totalWeightKg, 
    estimatedFarmerRealization 
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Sourcing Cart is Empty</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Select fresh AI-graded produce directly from our partner FPOs and smallholder farmers.
        </p>
        <Link
          href="/consumer/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          Browse Farm Marketplace <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const farmerPercentage = total > 0 ? Math.round((estimatedFarmerRealization / total) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Order Review
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-0.5">
            Sourcing Cart ({items.length} Items)
          </h1>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-7 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-zinc-100 dark:border-zinc-800 shrink-0"
                />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Grade {item.product.grade}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-500" /> {item.product.farmerStory.farmerName} • {item.product.farmerStory.district}
                  </p>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mt-1">
                    ₹{item.selectedTierPricePerKg} / kg
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100 dark:border-zinc-800">
                {/* Stepper */}
                <div className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1 bg-zinc-50 dark:bg-zinc-800">
                  <button
                    type="button"
                    onClick={() => decrementQuantity(item.product.id)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center hover:bg-zinc-200"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xs font-bold">
                    {item.quantityKg} kg
                  </span>
                  <button
                    type="button"
                    onClick={() => incrementQuantity(item.product.id)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center hover:bg-zinc-200"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-zinc-900 dark:text-white block">
                    ₹{(item.selectedTierPricePerKg * item.quantityKg).toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/consumer/marketplace"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Procurement Summary
            </h3>

            <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>Total Net Produce Weight:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{totalWeightKg.toLocaleString('en-IN')} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Produce Sourcing Subtotal:</span>
                <span className="font-bold text-zinc-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-cyan-500" />
                  Road Freight ({totalWeightKg >= 1500 ? 'Tata 407 Reefer' : totalWeightKg >= 300 ? 'Mahindra Bolero' : 'Tata Ace'}):
                </span>
                <span className="font-bold text-zinc-900 dark:text-white">₹{roadLogisticsFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Quality AI & Smart Escrow Fee:</span>
                <span className="font-bold text-zinc-900 dark:text-white">₹{platformFee.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-baseline text-sm">
                <span className="font-bold text-zinc-900 dark:text-white">Total Sourcing Amount:</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Direct Farmer Realization Callout */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Direct Farmer Payout:
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  ₹{estimatedFarmerRealization.toLocaleString('en-IN')} ({farmerPercentage}%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
                This transaction bypasses 5 intermediate mandi broker cuts, guaranteeing higher realized revenue directly into the farmer's bank account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/consumer/checkout')}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all duration-200"
            >
              Proceed to Delivery Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
