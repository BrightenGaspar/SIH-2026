'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common/Card';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Loader2,
  ThermometerSnowflake,
  Activity
} from 'lucide-react';

export default function LogisticsProfilePage() {
  const { currentUser, currentProfile, logisticsUser, updateLogisticsProfile } = useAuth();

  const operatorName = currentUser?.name || logisticsUser?.name || currentProfile?.full_name || 'Transporter';
  const operatorInitials = currentUser?.initials || (operatorName ? operatorName[0].toUpperCase() : 'L');

  const [name, setName] = useState(operatorName);
  const [phone, setPhone] = useState(currentUser?.phone || logisticsUser?.phone || currentProfile?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || logisticsUser?.email || currentProfile?.email || '');
  const [location, setLocation] = useState(currentUser?.place || logisticsUser?.operatingRegion || currentProfile?.place || '');
  const [vehicleNumber, setVehicleNumber] = useState(logisticsUser?.vehicleNumber || 'TS 08 UB 4192');
  const [vehicleType, setVehicleType] = useState(logisticsUser?.vehicleType || 'Tata 407 Reefer');

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize inputs whenever currentUser or currentProfile updates
  useEffect(() => {
    if (currentUser || currentProfile) {
      setName(currentUser?.name || currentProfile?.full_name || 'Transporter');
      setPhone(currentUser?.phone || currentProfile?.phone || '');
      setEmail(currentUser?.email || currentProfile?.email || '');
      setLocation(currentUser?.place || currentProfile?.place || '');
    }
  }, [currentUser, currentProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Operator Name is required.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const ok = await updateLogisticsProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        place: location.trim(),
      });
      if (ok) {
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Logistics Operator Profile</h1>
          <p className="text-xs text-slate-500 mt-1">Verified cold-chain fleet partner profile and corridor registrations.</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Edit Profile
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
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
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-2xl shadow-xs">
            {operatorInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{operatorName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                Verified Fleet Partner
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{vehicleType} &bull; {vehicleNumber}</p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operator Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Operating Base</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 transition"
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
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-2"
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
              <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-600" /> Phone Number</span>
              <span className="text-sm font-bold text-slate-900 block">{phone || 'Not provided'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-600" /> Email</span>
              <span className="text-sm font-bold text-slate-900 block">{email || 'N/A'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-600" /> Operating Base</span>
              <span className="text-sm font-bold text-slate-900 block">{location || 'Shadnagar Cold Hub'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-amber-600" /> Primary Vehicle</span>
              <span className="text-sm font-bold text-slate-900 block">{vehicleType} ({vehicleNumber})</span>
            </div>
          </div>
        )}

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-2 text-xs">
          <span className="font-bold text-slate-700 block flex items-center gap-1.5">
            <ThermometerSnowflake className="w-4 h-4 text-amber-600" /> Active Reefer Fleet Telemetry Status:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-white text-amber-900 border border-amber-200 font-bold shadow-xs">
              IoT Sensor: Active (Target: 4°C - 8°C)
            </span>
            <span className="px-3 py-1 rounded-lg bg-white text-emerald-800 border border-emerald-200 font-bold shadow-xs">
              GPS Link: Real-Time Active
            </span>
          </div>
        </div>
      </Card>

      {/* Account Deletion Area */}
      <DeleteAccountSection />
    </div>
  );
}
