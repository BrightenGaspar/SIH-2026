'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common/Card';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { User, Tractor, MapPin, Phone, Mail, ShieldCheck, Sprout, Save, CheckCircle2, Loader2 } from 'lucide-react';

export default function FarmerProfilePage() {
  const { currentUser, currentProfile, user, updateFarmerProfile } = useAuth();

  const farmerName = currentUser?.name || user?.name || currentProfile?.full_name || 'Farmer';
  const farmerInitials = currentUser?.initials || farmerName[0] || 'F';

  // Form states initialized with live identity
  const [name, setName] = useState(farmerName);
  const [phone, setPhone] = useState(currentUser?.phone || user?.phone || currentProfile?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || user?.email || currentProfile?.email || '');
  const [location, setLocation] = useState(currentUser?.place || user?.location || currentProfile?.place || '');
  const [farmName, setFarmName] = useState(user?.farmName || currentProfile?.fpo_name || `${farmerName}'s Farm`);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize inputs whenever currentUser or currentProfile updates
  useEffect(() => {
    if (currentUser || currentProfile) {
      setName(currentUser?.name || currentProfile?.full_name || 'Farmer');
      setPhone(currentUser?.phone || currentProfile?.phone || '');
      setEmail(currentUser?.email || currentProfile?.email || '');
      setLocation(currentUser?.place || currentProfile?.place || '');
      setFarmName(user?.farmName || currentProfile?.fpo_name || `${currentUser?.name || 'Farmer'}'s Farm`);
    }
  }, [currentUser, currentProfile, user?.farmName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const ok = await updateFarmerProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        place: location.trim(),
        farmName: farmName.trim(),
      });
      if (ok) {
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg('Failed to update profile. Please check your connection.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Farmer / FPO Profile</h1>
          <p className="text-xs text-slate-500 mt-1">Verified digital profile for institutional direct buyer matching.</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Edit Profile
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile updated successfully! Top-right identity has been updated.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Main Profile Card */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white border border-slate-200 shadow-xs">
        
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-2xl shadow-xs">
            {farmerInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{farmerName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Verified Farmer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{farmName} &bull; {user?.farmerType || 'Individual Producer'}</p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Farm / FPO Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location / Cluster</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-600" /> Phone Number</span>
              <span className="text-sm font-bold text-slate-900 block">{phone || 'Not provided'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-emerald-600" /> Email</span>
              <span className="text-sm font-bold text-slate-900 block">{email || 'N/A'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> Location / Cluster</span>
              <span className="text-sm font-bold text-slate-900 block">{location || 'Central Mandi Hub'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Tractor className="w-3.5 h-3.5 text-emerald-600" /> Total Farm Size</span>
              <span className="text-sm font-bold text-slate-900 block">{user?.farmSize || '5.5 Acres (Direct Partner)'}</span>
            </div>
          </div>
        )}

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2 text-xs">
          <span className="font-bold text-slate-700 block flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-600" /> Registered Primary Crops:
          </span>
          <div className="flex flex-wrap gap-2">
            {(user?.primaryCrops || ['Tomato (Hybrid Desi)', 'Green Chilli (G4 Teja)', 'Red Onion (Nasik)']).map((crop: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-white text-emerald-800 border border-emerald-200 font-bold shadow-xs">
                {crop}
              </span>
            ))}
          </div>
        </div>

      </Card>

      {/* Account Deletion Area */}
      <DeleteAccountSection />

    </div>
  );
}
