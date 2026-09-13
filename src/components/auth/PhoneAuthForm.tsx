'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import {
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  User,
} from 'lucide-react';

interface PhoneAuthFormProps {
  role: 'farmer' | 'consumer' | 'logistics' | 'fpo';
  redirectUrl: string;
  roleTitle: string;
  roleSubtitle?: string;
  themeColor?: 'emerald' | 'blue' | 'amber';
}

export function PhoneAuthForm({
  role,
  redirectUrl,
  roleTitle,
  roleSubtitle,
  themeColor = 'emerald',
}: PhoneAuthFormProps) {
  const router = useRouter();
  const {
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithGoogle,
    loginWithUsernamePassword,
    isLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'PHONE' | 'GOOGLE' | 'PASSWORD'>('PHONE');

  // Phone state
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Username/Password state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step === 'OTP' && resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendCooldown]);

  const colors = {
    emerald: {
      accent: 'emerald',
      bgHover: 'hover:bg-emerald-500',
      btnBg: 'bg-emerald-600',
      tabActive: 'bg-emerald-600 text-white shadow-xs',
      borderFocus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    blue: {
      accent: 'blue',
      bgHover: 'hover:bg-blue-500',
      btnBg: 'bg-blue-600',
      tabActive: 'bg-blue-600 text-white shadow-xs',
      borderFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    amber: {
      accent: 'amber',
      bgHover: 'hover:bg-amber-400',
      btnBg: 'bg-amber-500 text-slate-950 font-bold',
      tabActive: 'bg-amber-500 text-slate-950 font-bold shadow-xs',
      borderFocus: 'focus:border-amber-500 focus:ring-amber-500/20',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  }[themeColor];

  // 1. Phone OTP: Dispatch real SMS OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const raw10 = cleanPhone.slice(-10);
    if (raw10.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    setStatusMsg('Sending SMS verification code...');
    try {
      const fullNumber = `+91${raw10}`;

      const result = await sendPhoneOtp(fullNumber, { role });
      if (!result.success) {
        setErrorMsg(result.message || 'Failed to send SMS OTP.');
        setStatusMsg('');
        return;
      }

      setSentPhone(fullNumber);
      setStep('OTP');
      setResendCooldown(45);
      setStatusMsg(result.message || `SMS verification code sent to ${fullNumber}`);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to send OTP.');
      setStatusMsg('');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Phone OTP: Verify real SMS OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }

    setSubmitting(true);
    setStatusMsg('Verifying OTP code...');
    try {
      const targetPhone = sentPhone || phoneNumber;
      const result = await verifyPhoneOtp(targetPhone, cleanOtp, role);
      setStatusMsg('OTP verified successfully! Entering dashboard...');
      const targetRole = result.role || role;
      router.push(`/${targetRole}/dashboard`);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Verification failed. Please check the OTP code.');
      setStatusMsg('');
      setSubmitting(false);
    }
  };

  // 3. Google OAuth Login
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setStatusMsg('Redirecting to Google Authentication...');
    setSubmitting(true);
    try {
      await loginWithGoogle(role);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Google sign-in failed. Please try again.');
      setSubmitting(false);
      setStatusMsg('');
    }
  };

  // 4. Username / Email + Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your Username or Email.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginWithUsernamePassword(identifier.trim(), password);
      if (res.success && res.role) {
        router.push(`/${res.role}/dashboard`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3 ${colors.badgeBg}`}>
          <ShieldCheck className="w-3.5 h-3.5" /> Supabase Cloud Authentication
        </div>
        <h2 className="text-2xl font-black text-slate-900">{roleTitle}</h2>
        {roleSubtitle && <p className="text-xs text-slate-500 mt-1">{roleSubtitle}</p>}
      </div>

      {/* Auth Method Switcher: 3 Clean Tabs */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('PHONE');
            setErrorMsg('');
            setStatusMsg('');
          }}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] sm:text-xs cursor-pointer ${
            activeTab === 'PHONE' ? colors.tabActive : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Phone OTP</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('GOOGLE');
            setErrorMsg('');
            setStatusMsg('');
          }}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] sm:text-xs cursor-pointer ${
            activeTab === 'GOOGLE' ? colors.tabActive : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('PASSWORD');
            setErrorMsg('');
            setStatusMsg('');
          }}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] sm:text-xs cursor-pointer ${
            activeTab === 'PASSWORD' ? colors.tabActive : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Password</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{statusMsg}</div>
        </div>
      )}

      {/* TAB 1: PHONE NUMBER AUTH */}
      {activeTab === 'PHONE' && (
        <>
          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-3 rounded-xl text-sm font-bold select-none">
                    🇮🇳 +91
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="98480 12345"
                      maxLength={12}
                      className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono tracking-wider placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition ${colors.borderFocus}`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We will send a 6-digit SMS verification code to this number.
                </p>
              </div>

              <Button
                type="submit"
                isLoading={submitting || isLoading}
                className={`w-full py-3.5 text-white font-bold shadow-xs cursor-pointer ${colors.btnBg} ${colors.bgHover}`}
              >
                <Phone className="w-4 h-4 mr-2" />
                <span>Send SMS OTP</span>
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Enter 6-Digit SMS OTP</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE');
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Change number
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 transition ${colors.borderFocus}`}
                />

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0 || submitting}
                    className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {resendCooldown > 0 ? (
                      <span>Resend OTP in <strong className="text-slate-800">{resendCooldown}s</strong></span>
                    ) : (
                      <span>Didn&apos;t receive SMS? <strong className="text-slate-800 hover:underline">Resend OTP</strong></span>
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={submitting || isLoading}
                className={`w-full py-3.5 text-white font-bold shadow-xs cursor-pointer ${colors.btnBg} ${colors.bgHover}`}
              >
                <span>Verify OTP & Enter</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
        </>
      )}

      {/* TAB 2: GOOGLE OAUTH */}
      {activeTab === 'GOOGLE' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Authenticate directly through your Google account. Your profile will be safely synchronized to Supabase PostgreSQL.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting || isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-3 transition border border-slate-200 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google Account</span>
          </button>
        </div>
      )}

      {/* TAB 3: USERNAME + PASSWORD */}
      {activeTab === 'PASSWORD' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Username or Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. ramesh123 or name@gmail.com"
              className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition ${colors.borderFocus}`}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition ${colors.borderFocus}`}
            />
          </div>

          <Button
            type="submit"
            isLoading={submitting || isLoading}
            className={`w-full py-3.5 text-white font-bold shadow-xs cursor-pointer ${colors.btnBg} ${colors.bgHover}`}
          >
            <KeyRound className="w-4 h-4 mr-2" />
            <span>Sign In with Password</span>
          </Button>
        </form>
      )}

      {/* Footer Info */}
      <div className="pt-2 text-center text-[11px] text-slate-400">
        Permanent user accounts linked through Supabase Auth & PostgreSQL
      </div>
    </div>
  );
}
