'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  getProfileByUserId,
  fromDbRole,
  validateRole,
  upsertProfile,
  generateUniqueUsername,
} from '@/services/profileService';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') || searchParams.get('next');
  const codeParam = searchParams.get('code');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function handleAuthCallback() {
      try {
        // 1. If PKCE authorization code is present in URL, exchange it for a session
        if (codeParam) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (exchangeErr) {
            console.error('PKCE exchange error:', exchangeErr);
          }
        }

        // 2. Poll/wait for session to be available (handles hash fragment token parsing)
        let session = (await supabase.auth.getSession()).data.session;
        let attempts = 0;
        while (!session?.user && attempts < 10) {
          attempts++;
          await new Promise((res) => setTimeout(res, 400));
          if (isCancelled) return;
          const retry = await supabase.auth.getSession();
          if (retry.data.session?.user) {
            session = retry.data.session;
            break;
          }
        }

        const fallbackRole = validateRole(roleParam) || 'farmer';

        if (!session?.user) {
          router.replace(`/${fallbackRole}/login`);
          return;
        }

        const user = session.user;

        // 3. Fetch persistent profile from public.profiles
        let profile = await getProfileByUserId(user.id);
        const targetRole = validateRole(roleParam);
        const resolvedRole = targetRole || (profile ? fromDbRole(profile.role) : 'farmer');

        // If profile doesn't exist yet, auto-provision it immediately from Google metadata
        if (!profile) {
          const rawName =
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            (user.email ? user.email.split('@')[0] : 'AgriFlow Member');
          const generatedUsername = await generateUniqueUsername(rawName, user.id);

          const { profile: newProfile } = await upsertProfile({
            id: user.id,
            full_name: rawName,
            username: generatedUsername,
            role: resolvedRole,
            email: user.email || null,
            phone: user.phone || null,
            place: 'Chevella Mandi',
            area: 'Rangareddy District',
            state: 'Telangana',
            district: 'Rangareddy',
          });
          if (newProfile) {
            profile = newProfile;
          }
        } else if (targetRole && profile.role !== targetRole && profile.role !== 'admin') {
          // If user logged in through a specific portal (e.g. /farmer/login), ensure profile role matches
          await supabase.from('profiles').update({ role: targetRole }).eq('id', user.id);
          profile.role = targetRole;
        }

        // Direct immediately to role dashboard
        if ((profile?.role as string) === 'admin' && !targetRole) {
          router.replace('/admin');
        } else {
          router.replace(`/${resolvedRole}/dashboard`);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const error = err as Error;
        console.error('OAuth Callback handling error:', error);
        setErrorMsg(error.message || 'Failed to complete OAuth sign-in');
      }
    }

    handleAuthCallback();

    return () => {
      isCancelled = true;
    };
  }, [router, roleParam, codeParam]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-rose-200 shadow-sm text-rose-700 p-6 rounded-2xl max-w-md text-center space-y-3">
          <p className="font-bold text-sm">Authentication Error</p>
          <p className="text-xs text-rose-600">{errorMsg}</p>
          <button
            onClick={() => router.replace('/farmer/login')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
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
