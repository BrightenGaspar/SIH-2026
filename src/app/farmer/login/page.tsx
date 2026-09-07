'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Lock, Phone, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export default function FarmerLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '+91 98480 12345',
      password: 'demo_password',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMsg('');
      await login(data.identifier, data.password);
      router.push('/farmer/dashboard');
    } catch {
      setErrorMsg('Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      
      {/* Back link */}
      <div className="max-w-md w-full mx-auto">
        <Link href="/farmer" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Farmer Portal
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8">
        <Card className="bg-slate-900 border-slate-800 p-8 shadow-2xl">
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 font-black text-xl">
              🌾
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Farmer / FPO Login</h1>
            <p className="text-xs text-slate-400 mt-1">Manage your produce, discover demand, and improve your market realization.</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-xl mb-4 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number or Email</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('identifier')}
                  placeholder="+91 98480 12345"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              {errors.identifier && <p className="text-[11px] text-rose-400 mt-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Password or OTP</label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full py-3.5 mt-2"
            >
              <span>Login to Farmer Portal</span>
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Don&apos;t have a farmer account? </span>
            <Link href="/farmer/register" className="text-emerald-400 font-bold hover:underline">
              Register Here
            </Link>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-center">
            💡 <em>Demo pre-loaded with Ramesh Reddy (Shadnagar FPO). Click Login to enter directly.</em>
          </div>

        </Card>
      </div>

      <div className="text-center text-xs text-slate-500">
        AgriFlow AI • Smart India Hackathon Demo Prototype
      </div>

    </div>
  );
}
