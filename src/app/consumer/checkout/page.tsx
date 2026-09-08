'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { consumerService } from '@/services/consumerService';
import { 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Wallet, 
  Banknote,
  Sparkles,
  Lock
} from 'lucide-react';

export default function ConsumerCheckoutPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { consumerUser } = useAuth();
  const { 
    items, 
    subtotal, 
    roadLogisticsFee, 
    platformFee, 
    total, 
    totalWeightKg, 
    estimatedFarmerRealization, 
    clearCart 
  } = useCart();

  const [deliveryName, setDeliveryName] = useState(consumerUser?.name || 'Rajesh Varma');
  const [deliveryPhone, setDeliveryPhone] = useState(consumerUser?.phone || '+91 98480 88776');
  const [deliveryAddress, setDeliveryAddress] = useState(
    consumerUser?.savedAddresses?.[0]?.address || 'Plot 42, Bowenpally Wholesale Corridor'
  );
  const [deliveryCity, setDeliveryCity] = useState(consumerUser?.savedAddresses?.[0]?.city || 'Hyderabad');
  const [deliveryPincode, setDeliveryPincode] = useState(consumerUser?.savedAddresses?.[0]?.pincode || '500011');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Demo Cash'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreatedSuccess, setOrderCreatedSuccess] = useState<string | null>(null);

  if (items.length === 0 && !orderCreatedSuccess) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">No active items for checkout</h2>
        <p className="text-xs text-zinc-500">Please add produce from the marketplace before checking out.</p>
        <Link href="/consumer/marketplace" className="inline-flex px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
          Go to Marketplace
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const newOrder = await consumerService.createOrder({
        items,
        totalQuantityKg: totalWeightKg,
        subtotal,
        roadLogisticsFee,
        platformFee,
        totalAmount: total,
        deliveryAddress: {
          name: deliveryName,
          phone: deliveryPhone,
          address: deliveryAddress,
          city: deliveryCity,
          district: deliveryCity,
          state: 'Telangana',
          pincode: deliveryPincode,
        },
        paymentMethod,
        isBulkOrder: totalWeightKg >= 100,
        estimatedDeliveryDate: 'Tomorrow by 08:30 AM',
      });

      clearCart();
      setOrderCreatedSuccess(newOrder.id);
      setTimeout(() => {
        router.push(`/consumer/orders`);
      }, 2000);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Secure Escrow Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-0.5">
            Confirm Sourcing Order
          </h1>
        </div>

        <Link
          href="/consumer/cart"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-emerald-600"
        >
          <ArrowLeft className="w-4 h-4" /> Edit Cart
        </Link>
      </div>

      {orderCreatedSuccess ? (
        <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-center max-w-lg mx-auto space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
          <h2 className="text-xl font-black text-emerald-900 dark:text-emerald-200">
            Order Successfully Placed & Escrow Locked!
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Order Reference: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{orderCreatedSuccess}</strong>
          </p>
          <p className="text-xs text-zinc-500">
            Tata 407 Reefer route has been provisioned. Redirecting to your live order management...
          </p>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Hub Location */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Delivery Destination & Contact
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Recipient / Business Name
                  </label>
                  <input
                    type="text"
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Delivery Address / Mandi Warehouse Corridor
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    City / District
                  </label>
                  <input
                    type="text"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Smart Escrow Simulated Payment Mode */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  Smart Escrow Settlement Method
                </h3>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  Funds Released on Delivery
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'UPI' as const, label: 'Instant UPI / QR', icon: Wallet, desc: 'Google Pay, PhonePe, BHIM' },
                  { id: 'Card' as const, label: 'Corporate Card / NetBanking', icon: CreditCard, desc: 'Visa, Master, RuPay, RTGS' },
                  { id: 'Demo Cash' as const, label: 'Demo Cash On Delivery', icon: Banknote, desc: 'Physical verification demo' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-500' : 'text-zinc-400'}`} />
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                          {m.label}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {m.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-snug text-[11px]">
                  <strong>Escrow Protection:</strong> Payment remains locked in AgriFlow Smart Escrow until the truck arrives and produce delivery is verified at your gate.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Confirmation CTA */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
                Summary & Escrow Value
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {it.product.name} ({it.quantityKg} kg)
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      ₹{(it.selectedTierPricePerKg * it.quantityKg).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                <div className="flex justify-between">
                  <span>Gross Produce Sourcing:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Road Freight (Tata 407 Reefer):</span>
                  <span className="font-bold text-zinc-900 dark:text-white">₹{roadLogisticsFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform & Smart Escrow Fee:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">₹{platformFee.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-zinc-900 dark:text-white">Total Payable:</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/30 text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Guaranteed Farmer Share
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  ₹{estimatedFarmerRealization.toLocaleString('en-IN')} will be disbursed directly to farmer bank accounts upon receipt.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Processing Escrow Smart Lock...' : `Lock Escrow & Dispatch Order (₹${total.toLocaleString('en-IN')})`}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
