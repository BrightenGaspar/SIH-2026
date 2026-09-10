'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/context/I18nContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/validators';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ArrowLeft, CheckCircle2, Languages, Globe } from 'lucide-react';

export default function FarmerRegisterPage() {
  const router = useRouter();
  const { register: registerFarmer } = useAuth();
  const { setLanguage, t } = useI18n();
  const [step, setStep] = useState(1);

  const { register, handleSubmit, trigger, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: 'Venkatesh Rao',
      phone: '9848099881',
      email: 'venkatesh@chevellafarms.in',
      farmName: 'Chevella Agro Cluster',
      state: 'Telangana',
      district: 'Rangareddy',
      village: 'Chevella Rural',
      preferredLanguage: 'te',
      farmSize: '8.5 Acres',
      primaryCrops: 'Tomato, Green Chilli, Cotton',
      farmerType: 'FPO',
    },
  });

  const selectedLang = watch('preferredLanguage');

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setValue('preferredLanguage', lang);
    setLanguage(lang);
  };

  const nextStep = async () => {
    if (step === 1) {
      const valid = await trigger(['fullName', 'phone', 'email', 'farmerType', 'preferredLanguage']);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await trigger(['farmName', 'state', 'district', 'village', 'farmSize']);
      if (valid) setStep(3);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    await registerFarmer({
      name: data.fullName,
      phone: data.phone,
      email: data.email,
      state: data.state,
      district: data.district,
      place: data.village,
      preferredLanguage: data.preferredLanguage,
      farmName: data.farmName,
      location: `${data.village}, ${data.district}, ${data.state}`,
      farmSize: data.farmSize,
      primaryCrops: data.primaryCrops.split(',').map((c) => c.trim()),
      farmerType: data.farmerType,
    });
    router.push('/farmer/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      
      <div className="max-w-xl w-full mx-auto">
        <Link href="/farmer" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </Link>
      </div>

      <div className="max-w-xl w-full mx-auto my-6">
        <Card className="bg-slate-900 border-slate-800 p-8 shadow-2xl">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight">{t('createAccount')}</h1>
            <p className="text-xs text-slate-400 mt-1">Join the demand-led agricultural direct network.</p>
          </div>

          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            {[
              { num: 1, label: 'Personal & Language' },
              { num: 2, label: 'Farm & Location' },
              { num: 3, label: 'Crops & Finish' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-950'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-xs font-semibold text-slate-400 hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Step 1: Personal & Preferred Language */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number (10 Digits) *</label>
                    <input
                      type="text"
                      {...register('phone')}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Farmer Category *</label>
                  <select
                    {...register('farmerType')}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="Individual Farmer">Individual Farmer</option>
                    <option value="FPO">Farmer Producer Organization (FPO)</option>
                    <option value="Farmer Group">Self Help / Farmer Group</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-emerald-400" />
                    <span>Preferred Language (ప్రాధాన్య భాష / भाषा) *</span>
                  </label>
                  <select
                    {...register('preferredLanguage')}
                    onChange={(e) => handleLanguageSelect(e.target.value as SupportedLanguage)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none font-bold"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-900 text-white font-medium">
                        {l.nativeLabel} - {l.label}
                      </option>
                    ))}
                  </select>
                  {errors.preferredLanguage && <p className="text-[11px] text-rose-400 mt-1">{errors.preferredLanguage.message}</p>}
                </div>

                <Button type="button" onClick={nextStep} className="w-full py-3 mt-4">
                  {t('next')}: Location Details &rarr;
                </Button>
              </div>
            )}

            {/* Step 2: Location & Farm Details */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Farm / FPO Unit Name *</label>
                  <input
                    type="text"
                    {...register('farmName')}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  {errors.farmName && <p className="text-[11px] text-rose-400 mt-1">{errors.farmName.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('state')} *</label>
                    <input
                      type="text"
                      {...register('state')}
                      placeholder="e.g. Telangana / Andhra Pradesh"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.state && <p className="text-[11px] text-rose-400 mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('district')} *</label>
                    <input
                      type="text"
                      {...register('district')}
                      placeholder="e.g. Rangareddy"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.district && <p className="text-[11px] text-rose-400 mt-1">{errors.district.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('place')} *</label>
                    <input
                      type="text"
                      {...register('village')}
                      placeholder="e.g. Chevella / Shadnagar"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.village && <p className="text-[11px] text-rose-400 mt-1">{errors.village.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Farm Land Size *</label>
                    <input
                      type="text"
                      {...register('farmSize')}
                      placeholder="e.g. 10 Acres"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.farmSize && <p className="text-[11px] text-rose-400 mt-1">{errors.farmSize.message}</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                    {t('back')}
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-1">
                    {t('next')}: Crops &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Produce Info */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Primary Cultivated Crops *</label>
                  <input
                    type="text"
                    {...register('primaryCrops')}
                    placeholder="e.g. Tomato, Green Chilli, Onion"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  {errors.primaryCrops && <p className="text-[11px] text-rose-400 mt-1">{errors.primaryCrops.message}</p>}
                </div>

                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-emerald-400 block mb-1">✓ Setup Complete</span>
                  <p>Language & location preferences will be synchronized with your account profile across all your devices.</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">
                    {t('back')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="flex-1">
                    {t('createAccount')} & {t('dashboard')}
                  </Button>
                </div>
              </div>
            )}

          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <Link href="/farmer/login" className="text-emerald-400 font-bold hover:underline">
              {t('login')} Here
            </Link>
          </div>

        </Card>
      </div>

      <div className="text-center text-xs text-slate-500">
        AgriFlow AI &bull; Multilingual Road Freight & Direct Agriculture Platform
      </div>

    </div>
  );
}

