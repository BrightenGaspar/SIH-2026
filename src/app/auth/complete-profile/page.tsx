'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  checkUsernameAvailable,
  upsertProfile,
  getProfileByUserId,
  UserRole,
  validateRole,
} from '@/services/profileService';
import {
  ShieldCheck,
  User,
  MapPin,
  Lock,
  ArrowRight,
  Sprout,
  Store,
  Truck,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const validatedInitialRole = validateRole(searchParams.get('role'));

  const { refreshUserProfile } = useAuth();

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Form states - Priority 1: Explicit validated role parameter from query string, Priority 3: Fallback 'consumer'
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [place, setPlace] = useState('');
  const [area, setArea] = useState('');
  const [role, setRole] = useState<UserRole>(validatedInitialRole || 'consumer');
  const [password, setPassword] = useState('');

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Check session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace('/farmer/login');
          return;
        }

        setAuthUserId(session.user.id);
        const email = session.user.email || '';
        const phone = session.user.phone || '';
        setAuthEmail(email);
        setAuthPhone(phone);

        // Pre-fill existing metadata or partial profile row if already created by trigger
        const existingProfile = await getProfileByUserId(session.user.id);
        if (existingProfile) {
          if (existingProfile.full_name) setFullName(existingProfile.full_name);
          if (existingProfile.username) setUsername(existingProfile.username);
          if (existingProfile.place) setPlace(existingProfile.place);
          if (existingProfile.area) setArea(existingProfile.area);

          // Priority 2: Only adopt existing database profile role if NO explicit role parameter was passed in URL
          if (!validatedInitialRole) {
            const validDbRole = validateRole(existingProfile.role);
            if (validDbRole) {
              setRole(validDbRole);
            }
          }
        } else if (session.user.user_metadata?.full_name) {
          setFullName(session.user.user_metadata.full_name);
        }
      } catch (err) {
        console.warn('Session check exception:', err);
      } finally {
        setCheckingSession(false);
      }
    }
    loadSession();
  }, [router, validatedInitialRole]);

  // 2. Debounced username availability check
  const verifyUsername = useCallback(
    async (val: string) => {
      const clean = val.trim().toLowerCase();
      if (!clean) {
        setUsernameStatus('idle');
        setUsernameError('');
        return;
      }
      if (clean.length < 3) {
        setUsernameStatus('idle');
        setUsernameError('Username must be at least 3 characters.');
        return;
      }
      if (!/^[a-z0-9_.-]+$/.test(clean)) {
        setUsernameStatus('idle');
        setUsernameError('Use only lowercase letters, numbers, hyphens, and underscores.');
        return;
      }

      setUsernameStatus('checking');
      setUsernameError('');

      try {
        const isAvailable = await checkUsernameAvailable(clean, authUserId || undefined);
        if (isAvailable) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError(`Username "${clean}" is already taken.`);
        }
      } catch {
        setUsernameStatus('idle');
      }
    },
    [authUserId]
  );

  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }
    const timer = setTimeout(() => {
      verifyUsername(username);
    }, 400);
    return () => clearTimeout(timer);
  }, [username, verifyUsername]);

  // 3. Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!authUserId) {
      setFormError('Authentication session not found. Please log in again.');
      return;
    }

    if (!fullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 3) {
      setFormError('Username must be at least 3 characters long.');
      return;
    }

    if (usernameStatus === 'taken') {
      setFormError(`The username "${cleanUser}" is already taken. Please choose another.`);
      return;
    }

    if (!place.trim()) {
      setFormError('Place / City is required.');
      return;
    }

    if (!area.trim()) {
      setFormError('Area / Locality is required.');
      return;
    }

    setSubmitting(true);
    try {
      // Re-verify username availability one final time before write
      const available = await checkUsernameAvailable(cleanUser, authUserId);
      if (!available) {
        setSubmitting(false);
        setUsernameStatus('taken');
        setFormError(`Username "${cleanUser}" was just taken by another user.`);
        return;
      }

      // If user provided a password, update in Supabase Auth
      if (password.trim()) {
        const updatePayload: { password: string; email?: string } = {
          password: password.trim(),
        };

        // If user registered with phone only, attach synthetic email so username+pass auth succeeds in Supabase Auth
        if (!authEmail) {
          updatePayload.email = `${cleanUser}@agriflow.local`;
        }

        const { error: pwdErr } = await supabase.auth.updateUser(updatePayload);
        if (pwdErr) {
          console.warn('Supabase updateUser password notice:', pwdErr.message);
        }
      }

      // Upsert profile in PostgreSQL
      const { profile, error: profileErr } = await upsertProfile({
        id: authUserId,
        full_name: fullName.trim(),
        username: cleanUser,
        place: place.trim(),
        area: area.trim(),
        role: role,
        email: authEmail || (password.trim() ? `${cleanUser}@agriflow.local` : null),
        phone: authPhone || null,
      });

      if (profileErr || !profile) {
        throw new Error(profileErr || 'Failed to save profile. Please try again.');
      }

      setSuccessMessage('Profile completed successfully! Redirecting to your dashboard...');
      await refreshUserProfile();

      // Route directly to the verified role dashboard
      setTimeout(() => {
        router.push(`/${role}/dashboard`);
      }, 500);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'An error occurred while saving your profile.');
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-xs text-slate-500">Verifying secure session...</p>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full mx-auto my-auto space-y-6">
          
          {/* Card Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Complete Your Profile
              </h1>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please finish setting up your account details. This information is saved permanently and links directly to your role dashboard.
              </p>
            </div>
  
            {/* Verified Identity Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                {authEmail ? (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Verified Identity
                  </span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {authEmail || authPhone || 'Authenticated Account'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Linked
              </span>
            </div>
  
            {/* Error Alert */}
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>{formError}</div>
              </div>
            )}
  
            {/* Success Alert */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>{successMessage}</div>
              </div>
            )}
  
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Reddy or Priya Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
  
              {/* Username with Live Debounce Availability Check */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  {usernameStatus === 'checking' && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> checking...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> already taken
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. ramesh123"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition ${
                    usernameStatus === 'available'
                      ? 'border-emerald-500 focus:ring-emerald-500/20 focus:border-emerald-500'
                      : usernameStatus === 'taken'
                      ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {usernameError && (
                  <p className="text-[11px] text-rose-600 mt-1">{usernameError}</p>
                )}
              </div>
  
              {/* Place / City & Area / Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    Place / City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
  
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    Area / Locality <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Shadnagar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
  
              {/* Role Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Permanent Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Farmer */}
                  <button
                    type="button"
                    onClick={() => setRole('farmer')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'farmer'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Sprout className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs leading-tight">Farmer / FPO</span>
                  </button>
  
                  {/* Consumer */}
                  <button
                    type="button"
                    onClick={() => setRole('consumer')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'consumer'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Store className="w-5 h-5 text-blue-600" />
                    <span className="text-xs leading-tight">Consumer / Buyer</span>
                  </button>
  
                  {/* Logistics */}
                  <button
                    type="button"
                    onClick={() => setRole('logistics')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'logistics'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-amber-600" />
                    <span className="text-xs leading-tight">Logistic Operator</span>
                  </button>
                </div>
              </div>
  
              {/* Optional Password Setup */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Account Password (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">enables username + password login</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set password for username login"
                    minLength={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Managed securely by Supabase Auth. Never stored in plain text.
                </p>
              </div>
  
              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting || usernameStatus === 'taken'}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Profile & Enter Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
  
          </div>
  
          <div className="text-center text-xs text-slate-400">
            AgriFlow AI &bull; Supabase PostgreSQL Persistent User Identity
          </div>
  
        </div>
      </div>
    );
  }
  
  export default function CompleteProfilePage() {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-xs text-slate-500">Loading profile setup...</p>
          </div>
        }
      >
        <CompleteProfileContent />
      </Suspense>
    );
  }
