'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Phone, Mail, ShieldCheck, ArrowRight, RotateCcw, Sparkles, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

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
  const { sendPhoneOtp, verifyPhoneOtp, loginWithGoogle, loginWithDemo, isLoading } = useAuth();

  const [authMethod, setAuthMethod] = useState<'PHONE' | 'GOOGLE'>('PHONE');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [userName, setUserName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const colors = {
    emerald: {
      accent: 'emerald',
      bgHover: 'hover:bg-emerald-500',
      btnBg: 'bg-emerald-600',
      tabActive: 'bg-emerald-600 text-white shadow',
      borderFocus: 'focus:border-emerald-500 focus:ring-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    blue: {
      accent: 'blue',
      bgHover: 'hover:bg-blue-500',
      btnBg: 'bg-blue-600',
      tabActive: 'bg-blue-600 text-white shadow',
      borderFocus: 'focus:border-blue-500 focus:ring-blue-500',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    amber: {
      accent: 'amber',
      bgHover: 'hover:bg-amber-500',
      btnBg: 'bg-amber-600',
      tabActive: 'bg-amber-600 text-slate-950 font-bold shadow',
      borderFocus: 'focus:border-amber-500 focus:ring-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
  }[themeColor];

  // Step 1: Send SMS OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const fullNumber = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? `+${cleanPhone}` : `+91${cleanPhone.slice(-10)}`;
      const result = await sendPhoneOtp(fullNumber, { name: userName, role });
      setSentPhone(fullNumber);
      setStep('OTP');
      setStatusMsg(result.message || `6-digit SMS OTP sent to ${fullNumber}`);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Phone OTP Send Error:', error);
      setErrorMsg(error?.message || 'Failed to send OTP. You can use Quick Pitch Demo Login below.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify SMS OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyPhoneOtp(sentPhone || phoneNumber, otp.trim(), role, {
        name: userName || (role === 'farmer' ? 'Kisan Farmer' : role === 'consumer' ? 'Buyer User' : 'Logistics Carrier'),
        phone: sentPhone || phoneNumber,
      });
      router.push(redirectUrl);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('OTP Verify Error:', error);
      setErrorMsg(error?.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Google (Gmail) Sign-In
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setStatusMsg('Signing in with Google...');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle(role);
      if (res.profileCompleted) {
        router.push(redirectUrl);
      } else {
        const completeRoute = role === 'farmer' || role === 'fpo' 
          ? '/farmer/complete-profile' 
          : role === 'consumer' 
          ? '/consumer/complete-profile' 
          : '/logistics/complete-profile';
        router.push(completeRoute);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Google Sign-In Error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(error?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setStatusMsg('');
    }
  };

  // One-click Demo Pitch Login
  const handleDemoLogin = async () => {
    setSubmitting(true);
    try {
      const demoNames: Record<string, string> = {
        farmer: 'Ramesh Reddy (Shadnagar FPO)',
        consumer: 'Priya Sharma (Hyderabad Wholesale)',
        logistics: 'Gurdeep Singh (Tata Reefer Logistics)',
        fpo: 'Shadnagar Farmer Producer Org',
      };
      await loginWithDemo(role, demoNames[role] || 'Demo User', '+91 98480 12345');
      router.push(redirectUrl);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3 ${colors.badgeBg}`}>
          <ShieldCheck className="w-3.5 h-3.5" /> Supabase Cloud Authentication
        </div>
        <h2 className="text-2xl font-black text-white">{roleTitle}</h2>
        {roleSubtitle && <p className="text-xs text-slate-400 mt-1">{roleSubtitle}</p>}
      </div>

      {/* Auth Method Switcher Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setAuthMethod('PHONE');
            setErrorMsg('');
          }}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            authMethod === 'PHONE' ? colors.tabActive : 'text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Phone OTP (Primary)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod('GOOGLE');
            setErrorMsg('');
          }}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            authMethod === 'GOOGLE' ? colors.tabActive : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Gmail (Google)</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {statusMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>{statusMsg}</div>
        </div>
      )}

      {/* METHOD 1: Phone Number Authentication */}
      {authMethod === 'PHONE' && (
        <>
          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Your Name (Optional)</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={role === 'farmer' ? 'e.g. Ramesh Reddy' : 'e.g. Rahul Sharma'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 border border-slate-700 text-slate-300 px-3.5 py-3 rounded-xl text-sm font-bold select-none">
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-wider focus:outline-none focus:ring-1 transition focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Direct Supabase SMS OTP will be sent to this number.</p>
              </div>

              <Button
                type="submit"
                isLoading={submitting || isLoading}
                className={`w-full py-3.5 text-white font-bold ${colors.btnBg} ${colors.bgHover}`}
              >
                <Phone className="w-4 h-4 mr-2" />
                <span>Send SMS Verification OTP</span>
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Enter 6-Digit SMS OTP</label>
                  <button
                    type="button"
                    onClick={() => setStep('PHONE')}
                    className="text-[11px] text-slate-400 hover:text-white underline flex items-center gap-1"
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
                  placeholder="123456"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-white focus:outline-none focus:ring-2 transition focus:border-emerald-500"
                />
              </div>

              <Button
                type="submit"
                isLoading={submitting || isLoading}
                className={`w-full py-3.5 text-white font-bold ${colors.btnBg} ${colors.bgHover}`}
              >
                <span>Verify OTP & Enter</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition py-1"
              >
                Didn&apos;t receive SMS? <strong className="text-white hover:underline">Resend OTP</strong>
              </button>
            </form>
          )}
        </>
      )}

      {/* METHOD 2: Google / Gmail Authentication */}
      {authMethod === 'GOOGLE' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 text-center">
            Sign in instantly with your verified Google account. We will create and sync your {role} profile automatically.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting || isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition shadow-lg"
          >
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
            <span>Continue with Google Account</span>
          </button>
        </div>
      )}

      {/* Quick Pitch Demo Bypass */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition text-center flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Hackathon Pitch Login (One-click Demo Account)</span>
        </button>
      </div>
    </div>
  );
}
