'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { BuyerType, ProduceGrade } from '@/types/consumer';
import { 
  User, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Sparkles,
  Save
} from 'lucide-react';

export default function ConsumerProfilePage() {
  const { t } = useI18n();
  const { consumerUser, updateConsumerProfile } = useAuth();

  const [name, setName] = useState(consumerUser?.name || 'Rajesh Varma');
  const [phone, setPhone] = useState(consumerUser?.phone || '+91 98480 88776');
  const [email, setEmail] = useState(consumerUser?.email || 'rajesh.varma@southern-procure.in');
  const [location, setLocation] = useState(consumerUser?.location || 'Hyderabad, Telangana');
  const [buyerType, setBuyerType] = useState<BuyerType>(consumerUser?.buyerType || 'bulk-buyer');
  const [preferredGrade, setPreferredGrade] = useState<ProduceGrade>(consumerUser?.preferredGrade || 'A');
  const [typicalKg, setTypicalKg] = useState<number>(consumerUser?.typicalOrderSizeKg || 5000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConsumerProfile({
      name,
      phone,
      email,
      location,
      buyerType,
      preferredGrade,
      typicalOrderSizeKg: typicalKg,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Account & Warehousing
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-0.5">
          Buyer Profile & Sourcing Rules
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Configure default logistics corridors, quality grade standards, and entity contact details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white">{name}</h2>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full capitalize">
                {buyerType.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name / Organization
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Primary City / State
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Buyer Category
              </label>
              <select
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value as BuyerType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
              >
                <option value="bulk-buyer">Bulk Commercial Buyer (Wholesale/Mandi)</option>
                <option value="restaurant">Restaurant & Cloud Kitchen</option>
                <option value="retailer">Retailer & Supermarket</option>
                <option value="institution">Institutional Buyer (Canteen/Hostel)</option>
                <option value="household">Direct Household Buyer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Default Produce Quality Standard
              </label>
              <select
                value={preferredGrade}
                onChange={(e) => setPreferredGrade(e.target.value as ProduceGrade)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
              >
                <option value="A">Grade A Premium (Uniform / Export Quality)</option>
                <option value="B">Grade B Value (Commercial Processing)</option>
                <option value="Organic Certified">Organic Certified (Zero Chemical)</option>
              </select>
            </div>
          </div>

          {/* Saved Delivery Addresses */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Saved Delivery Hubs & Corridors
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                  Main Commercial Hub (Default)
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Plot 42, Bowenpally Wholesale Corridor, Hyderabad, Telangana - 500011
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
              </span>
            ) : (
              <span className="text-xs text-zinc-400">All changes persist in local smart storage.</span>
            )}

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Save className="w-4 h-4" /> Save Profile Preferences
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
