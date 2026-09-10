'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/context/I18nContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { logisticsRegisterSchema, LogisticsRegisterFormData } from '@/lib/validators';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ArrowLeft, CheckCircle2, Languages, Truck } from 'lucide-react';

export default function LogisticsRegisterPage() {
  const router = useRouter();
  const { registerLogistics } = useAuth();
  const { setLanguage, t } = useI18n();
  const [step, setStep] = useState(1);

  const { register, handleSubmit, trigger, setValue, formState: { errors, isSubmitting } } = useForm<LogisticsRegisterFormData>({
    resolver: zodResolver(logisticsRegisterSchema),
    defaultValues: {
      fullName: 'Gurdeep Singh',
      phone: '9848099881',
      email: 'gurdeep@reeferfleet.in',
      state: 'Telangana',
      district: 'Rangareddy',
      place: 'Shamshabad Fleet Hub',
      preferredLanguage: 'hi',
      vehicleType: 'Tata 407 Reefer',
      vehicleNumber: 'TS 08 UB 4192',
      vehicleCapacityKg: 5000,
      reeferEnabled: true,
    },
  });

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setValue('preferredLanguage', lang);
    setLanguage(lang);
  };

  const nextStep = async () => {
    if (step === 1) {
      const valid = await trigger(['fullName', 'phone', 'email', 'preferredLanguage']);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await trigger(['state', 'district', 'place', 'vehicleType', 'vehicleNumber', 'vehicleCapacityKg']);
      if (valid) setStep(3);
    }
  };

  const onSubmit = async (data: LogisticsRegisterFormData) => {
    await registerLogistics({
      name: data.fullName,
      phone: data.phone,
      email: data.email,
      state: data.state,
      district: data.district,
      place: data.place,
      preferredLanguage: data.preferredLanguage,
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleNumber,
      vehicleCapacityKg: data.vehicleCapacityKg,
      reeferEnabled: data.reeferEnabled,
      operatingRegion: `${data.district}, ${data.state} Corridor`,
      preferredRoutes: [`${data.place} -> Hyderabad`],
    });
    router.push('/logistics/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      
      <div className="max-w-xl w-full mx-auto">
        <Link href="/logistics" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </Link>
      </div>

      <div className="max-w-xl w-full mx-auto my-6">
        <Card className="bg-slate-900 border-slate-800 p-8 shadow-2xl">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 font-black text-2xl">
              <Truck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{t('createAccount')}</h1>
            <p className="text-xs text-slate-400 mt-1">Join the AgriFlow cold-chain freight & return haul network.</p>
          </div>

          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            {[
              { num: 1, label: 'Operator Info' },
              { num: 2, label: 'Fleet & Location' },
              { num: 3, label: 'Finish' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? 'bg-amber-600 text-slate-950 ring-4 ring-amber-950'
                    : step > s.num
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-xs font-semibold text-slate-400 hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Step 1: Operator Personal & Language */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Carrier / Operator Name *</label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Mobile Number (10 Digits) *</label>
                    <input
                      type="text"
                      {...register('phone')}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-amber-400" />
                    <span>Preferred Language (पसंदीदा भाषा / Preferred Language) *</span>
                  </label>
                  <select
                    {...register('preferredLanguage')}
                    onChange={(e) => handleLanguageSelect(e.target.value as SupportedLanguage)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none font-bold"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-900 text-white font-medium">
                        {l.nativeLabel} - {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="button" onClick={nextStep} className="w-full py-3 mt-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold">
                  {t('next')}: Fleet & Location Details &rarr;
                </Button>
              </div>
            )}

            {/* Step 2: Location & Vehicle Info */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('state')} *</label>
                    <input
                      type="text"
                      {...register('state')}
                      placeholder="e.g. Telangana"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.state && <p className="text-[11px] text-rose-400 mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('district')} *</label>
                    <input
                      type="text"
                      {...register('district')}
                      placeholder="e.g. Rangareddy"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.district && <p className="text-[11px] text-rose-400 mt-1">{errors.district.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">{t('place')} (Fleet Base Hub) *</label>
                  <input
                    type="text"
                    {...register('place')}
                    placeholder="e.g. Shamshabad Fleet Hub / Hyderabad"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  {errors.place && <p className="text-[11px] text-rose-400 mt-1">{errors.place.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Vehicle Type *</label>
                    <select
                      {...register('vehicleType')}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    >
                      <option value="Tata Ace">Tata Ace (1.5 Ton)</option>
                      <option value="Tata 407 Reefer">Tata 407 Reefer (5 Ton)</option>
                      <option value="Mahindra Bolero Maxi Truck">Mahindra Bolero Maxi Truck (2.5 Ton)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('vehicleNumber')} *</label>
                    <input
                      type="text"
                      {...register('vehicleNumber')}
                      placeholder="e.g. TS 08 UB 4192"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                    {errors.vehicleNumber && <p className="text-[11px] text-rose-400 mt-1">{errors.vehicleNumber.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">{t('carrierCapacity')} (kg) *</label>
                    <input
                      type="number"
                      {...register('vehicleCapacityKg', { valueAsNumber: true })}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('reeferEnabled')}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span>Active Refrigeration (Reefer Telemetry)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                    {t('back')}
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold">
                    {t('next')} &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-4 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-amber-400 block mb-1">✓ Fleet Setup Ready</span>
                  <p>Your operating location, fleet parameters, and language preference are configured.</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">
                    {t('back')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold">
                    {t('createAccount')} & {t('dashboard')}
                  </Button>
                </div>
              </div>
            )}

          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Already have an operator account? </span>
            <Link href="/logistics/login" className="text-amber-400 font-bold hover:underline">
              {t('login')} Here
            </Link>
          </div>

        </Card>
      </div>

      <div className="text-center text-xs text-slate-500">
        AgriFlow AI &bull; Road Freight Logistics & Reefer Fleet Ops
      </div>

    </div>
  );
}
