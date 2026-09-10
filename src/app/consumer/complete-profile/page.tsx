'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n, SupportedLanguage, SUPPORTED_LANGUAGES } from '@/context/I18nContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { completeProfileSchema, CompleteProfileFormData } from '@/lib/validators';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Store, MapPin, Globe, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ConsumerCompleteProfilePage() {
  const router = useRouter();
  const { consumerUser, updateConsumerProfile } = useAuth();
  const { setLanguage, t } = useI18n();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: consumerUser?.name || '',
      email: consumerUser?.email || '',
      phone: consumerUser?.phone || '',
      address: consumerUser?.address || '',
      state: consumerUser?.state || 'Telangana',
      district: consumerUser?.district || 'Hyderabad',
      place: consumerUser?.place || 'Bowenpally',
      preferredLanguage: (consumerUser?.preferredLanguage as SupportedLanguage) || 'ta',
    },
  });

  const selectedLang = watch('preferredLanguage');

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setValue('preferredLanguage', lang);
    setLanguage(lang);
  };

  const onSubmit = async (data: CompleteProfileFormData) => {
    setServerError('');
    try {
      const ok = await updateConsumerProfile({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        state: data.state,
        district: data.district,
        place: data.place,
        preferredLanguage: data.preferredLanguage,
        location: `${data.place}, ${data.district}, ${data.state}`,
        profileCompleted: true,
      });
      if (ok) {
        setLanguage(data.preferredLanguage);
        router.push('/consumer/dashboard');
      } else {
        setServerError('Unable to save your profile. Please try again.');
      }
    } catch {
      setServerError('Unable to save your profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-teal-500 selection:text-white">
      <div className="max-w-xl w-full mx-auto">
        <Link href="/consumer" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-teal-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </Link>
      </div>

      <div className="max-w-xl w-full mx-auto my-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto shadow-lg">
              {consumerUser?.photoURL ? (
                <img src={consumerUser.photoURL} alt={consumerUser.name} className="w-full h-full rounded-3xl object-cover" />
              ) : (
                <Store className="w-8 h-8 text-teal-400" />
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Complete Your Buyer Profile</h1>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Add delivery details and your language to personalize wholesale rates, origin clusters, and road transit.
            </p>
          </div>

          {serverError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Full Name *</label>
              <input
                type="text"
                {...register('fullName')}
                placeholder="e.g. Priya Sharma"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
              {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
                {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="10-digit mobile number"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
                {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Delivery / Business Address *</label>
              <textarea
                rows={2}
                {...register('address')}
                placeholder="Door No, Street, Landmark"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-teal-500 rounded-xl px-4 py-2 text-sm text-white outline-none"
              />
              {errors.address && <p className="text-[11px] text-rose-400 mt-1">{errors.address.message}</p>}
            </div>

            {/* State, District, Place */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">{t('state')} *</label>
                <input
                  type="text"
                  {...register('state')}
                  placeholder="e.g. Telangana"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
                {errors.state && <p className="text-[11px] text-rose-400 mt-1">{errors.state.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">{t('district')} *</label>
                <input
                  type="text"
                  {...register('district')}
                  placeholder="e.g. Hyderabad"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
                {errors.district && <p className="text-[11px] text-rose-400 mt-1">{errors.district.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">{t('place')} *</label>
                <input
                  type="text"
                  {...register('place')}
                  placeholder="Town / Hub"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
                {errors.place && <p className="text-[11px] text-rose-400 mt-1">{errors.place.message}</p>}
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold text-zinc-300 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-400" /> {t('preferredLanguage')} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_LANGUAGES.map((l) => {
                  const isSelected = selectedLang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageSelect(l.code)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">{l.nativeLabel}</span>
                      <span className="text-[10px] opacity-80">{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3">
              <Button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2">
                <span>{isSubmitting ? 'Saving profile...' : 'Complete Profile & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

        </Card>
      </div>

      <div className="text-center text-xs text-zinc-500">
        AgriFlow AI &bull; Mobile-First Buyer Procurement Onboarding
      </div>
    </div>
  );
}
