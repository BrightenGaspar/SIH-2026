'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getProfileByUserId, isProfileComplete } from '@/services/profileService';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (!session?.user) {
          const { data: retryData } = await supabase.auth.getSession();
          if (!retryData.session?.user) {
            router.replace('/farmer/login');
            return;
          }
        }

        const user = session?.user;
        if (!user) {
          router.replace('/farmer/login');
          return;
        }

        // Fetch persistent profile from public.profiles
        const profile = await getProfileByUserId(user.id);

        if (profile && isProfileComplete(profile)) {
          // Returning user: redirect directly to saved role dashboard
          router.replace(`/${profile.role}/dashboard`);
        } else {
          // New user: redirect to Complete Profile screen with role context
          const queryRole = roleParam || profile?.role || 'consumer';
          router.replace(`/auth/complete-profile?role=${queryRole}`);
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error('OAuth Callback handling error:', error);
        setErrorMsg(error.message || 'Failed to complete OAuth sign-in');
      }
    }

    handleAuthCallback();
  }, [router, roleParam]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-rose-200 shadow-sm text-rose-700 p-6 rounded-2xl max-w-md text-center space-y-3">
          <p className="font-bold text-sm">Authentication Error</p>
          <p className="text-xs text-rose-600">{errorMsg}</p>
          <button
            onClick={() => router.replace('/farmer/login')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
      <p className="text-xs text-slate-600 font-medium">Completing secure authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-xs text-slate-600 font-medium">Loading authentication...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
