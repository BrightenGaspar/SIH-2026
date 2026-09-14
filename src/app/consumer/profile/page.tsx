'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { BuyerType, ProduceGrade } from '@/types/consumer';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
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
  Save,
  Loader2
} from 'lucide-react';

export default function ConsumerProfilePage() {
  const { t } = useI18n();
  const { currentUser, currentProfile, consumerUser, updateConsumerProfile } = useAuth();

  const activeConsumerName = currentUser?.name || consumerUser?.name || currentProfile?.full_name || 'Consumer';
  const activeInitials = currentUser?.initials || (activeConsumerName ? activeConsumerName[0].toUpperCase() : 'C');

  const [name, setName] = useState(activeConsumerName);
  const [phone, setPhone] = useState(currentUser?.phone || consumerUser?.phone || currentProfile?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || consumerUser?.email || currentProfile?.email || '');
  const [location, setLocation] = useState(currentUser?.place || consumerUser?.location || currentProfile?.place || '');
  const [buyerType, setBuyerType] = useState<BuyerType>(consumerUser?.buyerType || 'bulk-buyer');
  const [preferredGrade, setPreferredGrade] = useState<ProduceGrade>(consumerUser?.preferredGrade || 'A');
  const [typicalKg, setTypicalKg] = useState<number>(consumerUser?.typicalOrderSizeKg || 5000);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize form state whenever currentUser or currentProfile loads/updates
  useEffect(() => {
    if (currentUser || currentProfile) {
      setName(currentUser?.name || currentProfile?.full_name || 'Consumer');
      setPhone(currentUser?.phone || currentProfile?.phone || '');
      setEmail(currentUser?.email || currentProfile?.email || '');
      setLocation(currentUser?.place || currentProfile?.place || '');
    }
  }, [currentUser, currentProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full Name / Organization is required.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const ok = await updateConsumerProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        place: location.trim(),
        buyerType,
        preferredGrade,
        typicalOrderSizeKg: typicalKg,
      });
      if (ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMsg('Failed to update profile. Please try again.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Account & Warehousing
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
          Buyer Profile & Sourcing Rules
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure default logistics corridors, quality grade standards, and entity contact details.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>Profile updated successfully! Top-right identity has been updated.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-xs">
              {activeInitials}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{name}</h2>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full capitalize">
                {buyerType.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name / Organization
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary City / State
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Buyer Category
              </label>
              <select
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value as BuyerType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 transition"
              >
                <option value="bulk-buyer">Bulk Commercial Buyer (Wholesale/Mandi)</option>
                <option value="restaurant">Restaurant & Cloud Kitchen</option>
                <option value="retailer">Retailer & Supermarket</option>
                <option value="institution">Institutional Buyer (Canteen/Hostel)</option>
                <option value="household">Direct Household Buyer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Produce Quality Standard
              </label>
              <select
                value={preferredGrade}
                onChange={(e) => setPreferredGrade(e.target.value as ProduceGrade)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 transition"
              >
                <option value="A">Grade A Premium (Uniform / Export Quality)</option>
                <option value="B">Grade B Value (Commercial Processing)</option>
                <option value="Organic Certified">Organic Certified (Zero Chemical)</option>
              </select>
            </div>
          </div>

          {/* Saved Delivery Addresses */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-500" />
              Saved Delivery Hubs & Corridors
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Main Commercial Hub (Default)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {location ? `${location} Wholesale Logistics Corridor` : 'Plot 42, Bowenpally Wholesale Corridor, Hyderabad, Telangana'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-100">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">All changes update immediately in Supabase database.</span>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Account Deletion Area */}
      <DeleteAccountSection />

    </div>
  );
}
