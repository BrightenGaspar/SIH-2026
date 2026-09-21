'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User as FarmerUser } from '@/types/farmer';
import { ConsumerUser } from '@/types/consumer';
import { LogisticsOperator } from '@/types/logistics';
import { supabase } from '@/lib/supabase';
import {
  UserProfile,
  getProfileByUserId,
  isProfileComplete,
  upsertProfile,
  resolveUsernameToEmail,
  generateUniqueUsername,
  toDbRole,
  fromDbRole,
} from '@/services/profileService';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'farmer' | 'consumer' | 'logistics' | 'admin';
  username: string | null;
  initials: string;
  place?: string | null;
  area?: string | null;
  state?: string | null;
  district?: string | null;
  fpo_name?: string | null;
}

export function getInitials(name: string): string {
  const clean = (name || '')
    .replace(/[\uD800-\uDFFF]|[\u2600-\u27BF]|\u00f0[^\s]*|\u00e2[^\s]*/g, '')
    .trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  user: FarmerUser | null;
  consumerUser: ConsumerUser | null;
  logisticsUser: LogisticsOperator | null;
  currentProfile: UserProfile | null;
  isAuthenticated: boolean;
  isConsumerAuthenticated: boolean;
  isLogisticsAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (data: Partial<FarmerUser>) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  loginConsumer: (identifier: string, pass: string) => Promise<boolean>;
  registerConsumer: (data: Partial<ConsumerUser>) => Promise<boolean>;
  logoutConsumer: () => Promise<void>;
  loginLogistics: (identifier: string, pass: string) => Promise<boolean>;
  registerLogistics: (data: Partial<LogisticsOperator>) => Promise<boolean>;
  logoutLogistics: () => Promise<void>;
  loginWithUsernamePassword: (identifier: string, pass: string, targetRole?: string) => Promise<{ success: boolean; role?: string }>;
  updateFarmerLanguage: (lang: string) => Promise<boolean>;
  updateConsumerLanguage: (lang: string) => Promise<boolean>;
  updateLogisticsLanguage: (lang: string) => Promise<boolean>;
  updateFarmerProfile: (data: Partial<FarmerUser>) => Promise<boolean>;
  updateConsumerProfile: (data: Partial<ConsumerUser>) => Promise<boolean>;
  updateLogisticsProfile: (data: Partial<LogisticsOperator>) => Promise<boolean>;
  refreshUserProfile: () => Promise<UserProfile | null>;
  sendPhoneOtp: (
    phoneNumber: string,
    extraData?: { name?: string; role?: string }
  ) => Promise<{ success: boolean; message?: string }>;
  verifyPhoneOtp: (
    phoneNumber: string,
    otpCode: string,
    role?: 'farmer' | 'consumer' | 'logistics' | 'fpo'
  ) => Promise<{ isReturningUser: boolean; role?: string }>;
  loginWithGoogle: (role: 'farmer' | 'consumer' | 'logistics' | 'fpo') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeToFarmer(p: UserProfile): FarmerUser {
  return {
    id: p.id,
    name: p.full_name,
    phone: p.phone || '',
    email: p.email || '',
    role: 'farmer',
    state: p.state || '',
    district: p.district || '',
    place: p.place || '',
    preferredLanguage: 'te',
    location: `${p.place || ''}, ${p.area || ''}`.replace(/^, |, $/g, ''),
    farmName: p.fpo_name || `${p.full_name}'s Farm`,
    farmerType: p.fpo_name ? 'FPO' : 'Individual Farmer',
    profileCompleted: true,
    createdAt: p.created_at || new Date().toISOString(),
  };
}

function normalizeToConsumer(p: UserProfile): ConsumerUser {
  return {
    id: p.id,
    name: p.full_name,
    phone: p.phone || '',
    email: p.email || '',
    role: 'consumer',
    state: p.state || '',
    district: p.district || '',
    place: p.place || '',
    preferredLanguage: 'en',
    location: `${p.place || ''}, ${p.area || ''}`.replace(/^, |, $/g, ''),
    buyerType: 'household',
    profileCompleted: true,
    createdAt: p.created_at || new Date().toISOString(),
  };
}

function normalizeToLogistics(p: UserProfile): LogisticsOperator {
  return {
    id: p.id,
    name: p.full_name,
    phone: p.phone || '',
    email: p.email || '',
    role: 'logistics',
    state: p.state || '',
    district: p.district || '',
    place: p.place || '',
    preferredLanguage: 'en',
    vehicleType: 'Tata 407 Reefer',
    vehicleNumber: 'TS 08 UB 4192',
    vehicleCapacityKg: 5000,
    reeferEnabled: true,
    operatingRegion: `${p.place || ''}, ${p.area || ''}`.replace(/^, |, $/g, ''),
    preferredRoutes: [],
    profileCompleted: true,
    createdAt: p.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [user, setUser] = useState<FarmerUser | null>(null);
  const [consumerUser, setConsumerUser] = useState<ConsumerUser | null>(null);
  const [logisticsUser, setLogisticsUser] = useState<LogisticsOperator | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate user role state and unified identity from a verified Supabase database profile & session
  const applyProfileState = useCallback((profile: UserProfile | null, sessionUser?: any | null) => {
    setCurrentProfile(profile);

    const activeId = profile?.id || sessionUser?.id;
    if (activeId) {
      const rawName =
        profile?.full_name?.trim() ||
        (sessionUser?.user_metadata?.full_name as string)?.trim() ||
        (sessionUser?.user_metadata?.name as string)?.trim() ||
        profile?.username?.trim() ||
        (sessionUser?.email ? sessionUser.email.split('@')[0] : '') ||
        '';

      const rawRole = fromDbRole(
        profile?.role ||
        (sessionUser?.user_metadata?.role as string) ||
        'consumer'
      );

      const displayName = rawName || (rawRole === 'farmer' ? 'Farmer' : rawRole === 'logistics' ? 'Transporter' : 'Consumer');

      setCurrentUser({
        id: activeId,
        name: displayName,
        email: profile?.email || sessionUser?.email || null,
        phone: profile?.phone || sessionUser?.phone || null,
        role: rawRole,
        username: profile?.username || null,
        initials: getInitials(displayName),
        place: profile?.place || null,
        area: profile?.area || null,
        state: profile?.state || null,
        district: profile?.district || null,
        fpo_name: profile?.fpo_name || null,
      });
    } else {
      setCurrentUser(null);
    }

    if (!profile || !isProfileComplete(profile)) {
      setUser(null);
      setConsumerUser(null);
      setLogisticsUser(null);
      return;
    }

    // Populate all role personas from the user's verified profile so that
    // the user can navigate to /farmer, /consumer, or /logistics seamlessly
    setUser(normalizeToFarmer(profile));
    setConsumerUser(normalizeToConsumer(profile));
    setLogisticsUser(normalizeToLogistics(profile));
  }, []);

  // Fetch real persistent profile from Supabase Database (Source of Truth)
  const refreshUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        applyProfileState(null, null);
        return null;
      }

      const profile = await getProfileByUserId(session.user.id);
      applyProfileState(profile, session.user);
      return profile;
    } catch (err) {
      console.warn('refreshUserProfile error:', err);
      applyProfileState(null, null);
      return null;
    }
  }, [applyProfileState]);

  // Listen to Supabase Auth lifecycle events
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await getProfileByUserId(session.user.id);
          if (mounted) {
            applyProfileState(profile, session.user);
          }
        } else if (mounted) {
          applyProfileState(null, null);
        }
      } catch (err) {
        console.warn('initAuth error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await getProfileByUserId(session.user.id);
          applyProfileState(profile, session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        applyProfileState(null, null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applyProfileState]);

  // 1. Phone OTP: Dispatch real SMS OTP via Supabase Auth
  const sendPhoneOtp = async (
    phoneNumber: string,
    extraData?: { name?: string; role?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const cleanDigits = phoneNumber.replace(/\D/g, '');
      const raw10 = cleanDigits.slice(-10);
      if (raw10.length !== 10) {
        return { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' };
      }
      const fullPhone = `+91${raw10}`;

      let { data: authData, error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          data: {
            full_name: extraData?.name || '',
            role: toDbRole(extraData?.role || 'consumer'),
          },
        },
      });

      // If Supabase treats +91XXXXXXXXXX as a mock/test number (messageId: "test-otp"),
      // automatically bypass it by dispatching with raw 10 digits to trigger the live SMS gateway hook!
      if (authData?.messageId === 'test-otp') {
        const retry = await supabase.auth.signInWithOtp({
          phone: raw10,
          options: {
            data: {
              full_name: extraData?.name || '',
              role: toDbRole(extraData?.role || 'consumer'),
            },
          },
        });
        if (!retry.error) {
          authData = retry.data;
          error = null;
        }
      }

      if (error) {
        console.warn('Supabase signInWithOtp error:', error.message);
        if (error.message.toLowerCase().includes('provider') || error.message.toLowerCase().includes('unsupported')) {
          return {
            success: false,
            message: 'Phone authentication is not configured in Supabase. Please configure the SMS provider in Supabase Dashboard -> Authentication -> Providers -> Phone.',
          };
        }
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: `6-digit SMS OTP dispatched to ${fullPhone}`,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, message: error.message || 'Failed to send SMS OTP' };
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Phone OTP: Verify real SMS OTP and distinguish returning vs new users
  const verifyPhoneOtp = async (
    phoneNumber: string,
    otpCode: string,
    role: 'farmer' | 'consumer' | 'logistics' | 'fpo' = 'consumer'
  ): Promise<{ isReturningUser: boolean; role?: string }> => {
    setIsLoading(true);
    try {
      const cleanDigits = phoneNumber.replace(/\D/g, '');
      const raw10 = cleanDigits.slice(-10);
      if (raw10.length !== 10) {
        throw new Error('Invalid phone number format. Please enter a valid 10-digit number.');
      }
      const fullPhone = `+91${raw10}`;

      // Real Supabase verification: check fullPhone first
      let { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otpCode.trim(),
        type: 'sms',
      });

      // If fullPhone verification was rejected, retry with raw10 (in case test-otp bypass was used)
      if ((error || !data?.user) && raw10) {
        const retry = await supabase.auth.verifyOtp({
          phone: raw10,
          token: otpCode.trim(),
          type: 'sms',
        });
        if (!retry.error && retry.data?.user) {
          data = retry.data;
          error = null;
        }
      }

      if (error || !data?.user) {
        throw new Error(error?.message || 'Invalid or expired SMS OTP code.');
      }

      // Check whether profile exists and is complete in public.profiles
      let profile = await getProfileByUserId(data.user.id);
      const targetRole = role === 'fpo' ? 'farmer' : role;

      if (!profile) {
        // Auto-provision profile with target role so mobile users can immediately access their dashboard
        const generatedUsername = await generateUniqueUsername(
          (data.user.user_metadata?.full_name as string) || `user_${raw10.slice(-4)}`,
          data.user.id
        );
        const { profile: newProfile } = await upsertProfile({
          id: data.user.id,
          full_name: (data.user.user_metadata?.full_name as string) || `User ${raw10.slice(-4)}`,
          username: generatedUsername,
          role: targetRole,
          phone: fullPhone,
          place: 'Local Mandi',
          area: 'Rural Hub',
        });
        if (newProfile) {
          profile = newProfile;
        }
      } else if (!isProfileComplete(profile)) {
        // Profile exists but is missing mandatory fields - backfill them gracefully
        const needsUsername = !profile.username || profile.username.trim().length === 0;
        const generatedUsername = needsUsername
          ? await generateUniqueUsername(profile.full_name || `user_${raw10.slice(-4)}`, data.user.id)
          : profile.username;

        const { profile: updatedProfile } = await upsertProfile({
          id: data.user.id,
          full_name: profile.full_name?.trim() || `User ${raw10.slice(-4)}`,
          username: generatedUsername,
          role: profile.role || targetRole,
          phone: profile.phone || fullPhone,
          place: profile.place?.trim() || 'Local Mandi',
          area: profile.area?.trim() || 'Rural Hub',
        });
        if (updatedProfile) {
          profile = updatedProfile;
        }
      }

      // Hydrate state
      applyProfileState(profile, data.user);

      // Navigate directly to the authenticated role dashboard
      const activeRole = targetRole || profile?.role || 'consumer';
      router.push(`/${activeRole}/dashboard`);
      return { isReturningUser: true, role: activeRole };
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Google OAuth: Real Supabase OAuth flow
  const loginWithGoogle = async (role: 'farmer' | 'consumer' | 'logistics' | 'fpo'): Promise<void> => {
    setIsLoading(true);
    try {
      const targetRole = role === 'fpo' ? 'farmer' : role;
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?role=${targetRole}`
        : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Username + Password Login: Secure resolution & Supabase Auth authentication
  const loginWithUsernamePassword = async (
    identifier: string,
    pass: string,
    targetRole?: string
  ): Promise<{ success: boolean; role?: string }> => {
    setIsLoading(true);
    try {
      const cleanIdent = identifier.trim();
      let targetEmail = cleanIdent;

      // If username was entered, resolve to auth email securely
      if (!cleanIdent.includes('@')) {
        const resolved = await resolveUsernameToEmail(cleanIdent);
        if (!resolved) {
          throw new Error(`Username "${cleanIdent}" not found. Please check your username or login using Phone OTP.`);
        }
        targetEmail = resolved;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid credentials.');
      }

      const profile = await getProfileByUserId(data.user.id);
      if (profile && isProfileComplete(profile)) {
        applyProfileState(profile, data.user);
        const destRole = targetRole || profile.role || 'farmer';
        router.push(`/${destRole}/dashboard`);
        return { success: true, role: destRole };
      } else {
        const destRole = targetRole || 'farmer';
        router.push(`/auth/complete-profile?role=${destRole}`);
        return { success: true, role: destRole };
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Backward-compatible login wrappers
  const login = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await loginWithUsernamePassword(identifier, pass, 'farmer');
    return res.success;
  };

  const loginConsumer = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await loginWithUsernamePassword(identifier, pass, 'consumer');
    return res.success;
  };

  const loginLogistics = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await loginWithUsernamePassword(identifier, pass, 'logistics');
    return res.success;
  };

  // Profile update wrappers
  const updateFarmerProfile = async (data: Partial<FarmerUser>): Promise<boolean> => {
    if (!currentProfile) return false;
    const { profile, error } = await upsertProfile({
      id: currentProfile.id,
      role: 'farmer',
      full_name: data.name !== undefined ? data.name : currentProfile.full_name,
      username: currentProfile.username,
      place: data.place !== undefined ? data.place : currentProfile.place,
      area: currentProfile.area || currentProfile.district || 'Hub',
      district: data.district !== undefined ? data.district : currentProfile.district,
      state: data.state !== undefined ? data.state : currentProfile.state,
      fpo_name: data.farmName !== undefined ? data.farmName : currentProfile.fpo_name,
      phone: data.phone !== undefined ? data.phone : currentProfile.phone,
      email: data.email !== undefined ? data.email : currentProfile.email,
    });
    if (!error && profile) {
      applyProfileState(profile);
      return true;
    }
    return false;
  };

  const updateConsumerProfile = async (data: Partial<ConsumerUser>): Promise<boolean> => {
    if (!currentProfile) return false;
    const { profile, error } = await upsertProfile({
      id: currentProfile.id,
      role: 'consumer',
      full_name: data.name !== undefined ? data.name : currentProfile.full_name,
      username: currentProfile.username,
      place: data.place !== undefined ? data.place : currentProfile.place,
      area: currentProfile.area || currentProfile.district || 'Hub',
      district: data.district !== undefined ? data.district : currentProfile.district,
      state: data.state !== undefined ? data.state : currentProfile.state,
      phone: data.phone !== undefined ? data.phone : currentProfile.phone,
      email: data.email !== undefined ? data.email : currentProfile.email,
    });
    if (!error && profile) {
      applyProfileState(profile);
      return true;
    }
    return false;
  };

  const updateLogisticsProfile = async (data: Partial<LogisticsOperator>): Promise<boolean> => {
    if (!currentProfile) return false;
    const { profile, error } = await upsertProfile({
      id: currentProfile.id,
      role: 'logistics',
      full_name: data.name !== undefined ? data.name : currentProfile.full_name,
      username: currentProfile.username,
      place: data.place !== undefined ? data.place : currentProfile.place,
      area: currentProfile.area || currentProfile.district || 'Hub',
      district: data.district !== undefined ? data.district : currentProfile.district,
      state: data.state !== undefined ? data.state : currentProfile.state,
      phone: data.phone !== undefined ? data.phone : currentProfile.phone,
      email: data.email !== undefined ? data.email : currentProfile.email,
    });
    if (!error && profile) {
      applyProfileState(profile);
      return true;
    }
    return false;
  };

  const updateFarmerLanguage = async (_lang: string): Promise<boolean> => true;
  const updateConsumerLanguage = async (_lang: string): Promise<boolean> => true;
  const updateLogisticsLanguage = async (_lang: string): Promise<boolean> => true;

  // Real Supabase registration and profile provisioning
  const registerWithSupabase = async (
    role: 'farmer' | 'consumer' | 'logistics',
    profileData: {
      fullName: string;
      phone?: string;
      email?: string;
      password?: string;
      place?: string;
      area?: string;
      state?: string;
      district?: string;
      fpoName?: string;
    }
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      let targetUserId: string | null = null;
      let targetEmail = profileData.email?.trim() || null;
      let targetPhone = profileData.phone?.trim() || null;

      // 1. Check if an active authenticated session already exists (e.g. from Google OAuth or Phone OTP)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        targetUserId = existingSession.user.id;
        if (!targetEmail) targetEmail = existingSession.user.email || null;
        if (!targetPhone) targetPhone = existingSession.user.phone || null;
      } else {
        // 2. Register user via real Supabase Auth
        const cleanPhone = (profileData.phone || '').replace(/\D/g, '');
        const authEmail = profileData.email?.trim() || (cleanPhone ? `${cleanPhone}@agriflow.in` : `${role}_${Date.now()}@agriflow.in`);
        const authPass = profileData.password?.trim() || 'AgriFlow@2026';
        const dbRole = toDbRole(role);

        const { data: initialAuthData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: authPass,
          options: {
            data: {
              full_name: profileData.fullName,
              role: dbRole,
              phone: profileData.phone || '',
            },
          },
        });
        let authData = initialAuthData;

        if (authError) {
          if (authError.message.toLowerCase().includes('already registered')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: authEmail,
              password: authPass,
            });
            if (signInError) throw new Error(authError.message);
            authData = signInData;
          } else if (authError.message.toLowerCase().includes('rate limit')) {
            // Attempt direct sign-in in case the account was already created
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: authEmail,
              password: authPass,
            });
            if (!signInError && signInData?.user) {
              authData = signInData;
            } else {
              throw new Error(
                'Supabase Email Rate Limit exceeded. To fix permanently: Open your Supabase Dashboard -> Authentication -> Providers -> Email and turn off "Confirm email".'
              );
            }
          } else {
            throw new Error(authError.message);
          }
        }

        if (!authData.user) {
          throw new Error('Registration failed: No authenticated user created.');
        }

        targetUserId = authData.user.id;
        targetEmail = authEmail;
        targetPhone = profileData.phone || null;
      }

      // 3. Generate verified unique username
      const username = await generateUniqueUsername(profileData.fullName || role, targetUserId);

      // 4. Upsert complete profile satisfying all isProfileComplete requirements
      const { profile, error: pError } = await upsertProfile({
        id: targetUserId,
        full_name: profileData.fullName.trim(),
        username,
        role: role,
        place: profileData.place?.trim() || profileData.district?.trim() || 'Central',
        area: profileData.area?.trim() || profileData.district?.trim() || profileData.state?.trim() || 'Hub',
        phone: targetPhone,
        email: targetEmail,
        state: profileData.state?.trim() || null,
        district: profileData.district?.trim() || null,
        fpo_name: profileData.fpoName?.trim() || null,
      });

      if (pError || !profile) {
        throw new Error(pError || 'Failed to save companion profile in database.');
      }

      // 5. Hydrate AuthContext state with fresh persistent profile
      const freshProfile = await refreshUserProfile();
      applyProfileState(freshProfile || profile);

      // 6. Navigate directly to the verified role dashboard
      router.push(`/${role}/dashboard`);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Partial<FarmerUser> & { password?: string }): Promise<boolean> => {
    return registerWithSupabase('farmer', {
      fullName: data.name || '',
      phone: data.phone,
      email: data.email,
      place: data.place,
      area: data.district,
      state: data.state,
      district: data.district,
      fpoName: data.farmName,
      password: data.password,
    });
  };

  const registerConsumer = async (data: Partial<ConsumerUser> & { password?: string }): Promise<boolean> => {
    return registerWithSupabase('consumer', {
      fullName: data.name || '',
      phone: data.phone,
      email: data.email,
      place: data.place,
      area: data.district,
      state: data.state,
      district: data.district,
      password: data.password,
    });
  };

  const registerLogistics = async (data: Partial<LogisticsOperator> & { password?: string }): Promise<boolean> => {
    return registerWithSupabase('logistics', {
      fullName: data.name || '',
      phone: data.phone,
      email: data.email,
      place: data.place,
      area: data.district,
      state: data.state,
      district: data.district,
      password: data.password,
    });
  };

  // Sign Out cleanly
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    applyProfileState(null, null);
    router.push('/farmer/login');
  };

  const logoutConsumer = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    applyProfileState(null, null);
    router.push('/consumer/login');
  };

  const logoutLogistics = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    applyProfileState(null, null);
    router.push('/logistics/login');
  };

  // Secure Server-Side Account & Data Deletion
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('You must be authenticated to delete your account.');
      }

      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete account.');
      }

      // Evict Supabase session
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }

      // Evict all React state
      applyProfileState(null, null);

      // Evict client storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agriflow_cart');
        localStorage.removeItem('agriflow_consumer_auth');
        localStorage.removeItem('agriflow_farmer_auth');
        localStorage.removeItem('agriflow_logistics_auth');
      }

      // Redirect to public landing gateway
      router.push('/');
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user,
        consumerUser,
        logisticsUser,
        currentProfile,
        isAuthenticated: !!user || !!currentUser,
        isConsumerAuthenticated: !!consumerUser || !!currentUser,
        isLogisticsAuthenticated: !!logisticsUser || !!currentUser,
        isLoading,
        login,
        register,
        logout,
        deleteAccount,
        updateFarmerLanguage,
        updateConsumerLanguage,
        updateLogisticsLanguage,
        updateFarmerProfile,
        updateConsumerProfile,
        updateLogisticsProfile,
        refreshUserProfile,
        loginConsumer,
        registerConsumer,
        logoutConsumer,
        loginLogistics,
        registerLogistics,
        logoutLogistics,
        loginWithUsernamePassword,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
