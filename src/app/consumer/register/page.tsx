'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BuyerType, ProduceGrade } from '@/types/consumer';
import { 
  UserPlus, 
  Store, 
  MapPin, 
  Building2, 
  Utensils, 
  ShoppingBag, 
  Home, 
  Landmark, 
  Check, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

export default function ConsumerRegisterPage() {
  const router = useRouter();
  const { registerConsumer } = useAuth();

  const [step, setStep] = useState(1);
  const [buyerType, setBuyerType] = useState<BuyerType>('bulk-buyer');
  const [name, setName] = useState('Rajesh Varma');
  const [phone, setPhone] = useState('+91 98480 88776');
  const [email, setEmail] = useState('rajesh.varma@southern-procure.in');
  const [address, setAddress] = useState('Plot 42, Bowenpally Wholesale Corridor');
  const [city, setCity] = useState('Hyderabad');
  const [district, setDistrict] = useState('Hyderabad');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('500011');
  const [preferredGrade, setPreferredGrade] = useState<ProduceGrade>('A');
  const [typicalOrderSizeKg, setTypicalOrderSizeKg] = useState<number>(5000);
  const [loading, setLoading] = useState(false);

  const buyerOptions: { type: BuyerType; label: string; desc: string; icon: any; defaultKg: number }[] = [
    { type: 'bulk-buyer', label: 'Bulk Commercial Buyer', desc: 'Wholesale mandi, food processing, distribution', icon: Building2, defaultKg: 5000 },
    { type: 'restaurant', label: 'Restaurant / Cloud Kitchen', desc: 'HoReCa daily scheduled harvest procurement', icon: Utensils, defaultKg: 150 },
    { type: 'retailer', label: 'Retailer / Supermarket', desc: 'Grocery shop or modern trade supermarket', icon: ShoppingBag, defaultKg: 500 },
    { type: 'institution', label: 'Institutional Buyer', desc: 'Canteen, hospital, hostel, or corporate kitchen', icon: Landmark, defaultKg: 1000 },
    { type: 'household', label: 'Conscious Household', desc: 'Family fresh produce direct from local farms', icon: Home, defaultKg: 10 }
  ];

  const handleSelectBuyerType = (option: typeof buyerOptions[0]) => {
    setBuyerType(option.type);
    setTypicalOrderSizeKg(option.defaultKg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerConsumer({
        name,
        phone,
        email,
        buyerType,
        location: `${city}, ${state}`,
        preferredGrade,
        typicalOrderSizeKg,
        savedAddresses: [
          {
            id: 'addr-primary',
            label: 'Primary Delivery Location',
            address,
            city,
            district,
            state,
            pincode,
            isDefault: true
          }
        ]
      });
      router.push('/consumer/dashboard');
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
          Create Buyer Account
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Step {step} of 3 • {step === 1 ? 'Select Buyer Type' : step === 2 ? 'Contact & Delivery Location' : 'Sourcing Preferences'}
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step >= s ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              How will you use AgriFlow?
            </h2>

            <div className="space-y-2.5">
              {buyerOptions.map((opt) => {
                const isSelected = buyerType === opt.type;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleSelectBuyerType(opt)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {opt.desc}
                      </p>
                      <span className="inline-block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        Typical volume: ~{opt.defaultKg.toLocaleString('en-IN')} kg / order
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors"
            >
              Continue to Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Contact & Road Sourcing Hub
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name / Entity Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Delivery Address / Warehouse Corridor
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                Next: Quality Preferences <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Sourcing & Quality Preferences
            </h2>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Preferred AI Produce Quality Grade
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { grade: 'A' as ProduceGrade, label: 'Grade A Premium', sub: 'Export standard' },
                  { grade: 'B' as ProduceGrade, label: 'Grade B Value', sub: 'Budget friendly' },
                  { grade: 'Organic Certified' as ProduceGrade, label: 'Organic Certified', sub: 'Zero chemicals' },
                ].map((g) => (
                  <button
                    key={g.grade}
                    type="button"
                    onClick={() => setPreferredGrade(g.grade)}
                    className={`p-3 rounded-xl border text-center transition-colors ${
                      preferredGrade === g.grade
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-xs block font-bold">{g.label}</span>
                    <span className="text-[10px] text-zinc-400">{g.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Typical Sourcing Quantity Per Order (kg)
              </label>
              <input
                type="number"
                min={1}
                value={typicalOrderSizeKg}
                onChange={(e) => setTypicalOrderSizeKg(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                AgriFlow automatically provisions Tata Ace, Bolero, or Tata 407 Reefer trucks based on this quantity.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {loading ? 'Setting up account...' : 'Complete Registration & Open Dashboard'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have a buyer account?{' '}
          <Link href="/consumer/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
