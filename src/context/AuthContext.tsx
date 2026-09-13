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
} from '@/services/profileService';

interface AuthContextType {
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
  loginConsumer: (identifier: string, pass: string) => Promise<boolean>;
  registerConsumer: (data: Partial<ConsumerUser>) => Promise<boolean>;
  logoutConsumer: () => Promise<void>;
  loginLogistics: (identifier: string, pass: string) => Promise<boolean>;
  registerLogistics: (data: Partial<LogisticsOperator>) => Promise<boolean>;
  logoutLogistics: () => Promise<void>;
  loginWithUsernamePassword: (identifier: string, pass: string) => Promise<{ success: boolean; role?: string }>;
  updateFarmerLanguage: (lang: string) => Promise<boolean>;
  updateConsumerLanguage: (lang: string) => Promise<boolean>;
  updateLogisticsLanguage: (lang: string) => Promise<boolean>;
  updateFarmerProfile: (data: Partial<FarmerUser>) => Promise<boolean>;
  updateConsumerProfile: (data: Partial<ConsumerUser>) => Promise<boolean>;
  updateLogisticsProfile: (data: Partial<LogisticsOperator>) => Promise<boolean>;
  refreshUserProfile: () => Promise<void>;
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
  const [user, setUser] = useState<FarmerUser | null>(null);
  const [consumerUser, setConsumerUser] = useState<ConsumerUser | null>(null);
  const [logisticsUser, setLogisticsUser] = useState<LogisticsOperator | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate user role state from a verified Supabase database profile
  const applyProfileState = useCallback((profile: UserProfile | null) => {
    setCurrentProfile(profile);

    if (!profile || !isProfileComplete(profile)) {
      setUser(null);
      setConsumerUser(null);
      setLogisticsUser(null);
      return;
    }

    if (profile.role === 'farmer') {
      setUser(normalizeToFarmer(profile));
      setConsumerUser(null);
      setLogisticsUser(null);
    } else if (profile.role === 'consumer') {
      setUser(null);
      setConsumerUser(normalizeToConsumer(profile));
      setLogisticsUser(null);
    } else if (profile.role === 'logistics') {
      setUser(null);
      setConsumerUser(null);
      setLogisticsUser(normalizeToLogistics(profile));
    }
  }, []);

  // Fetch real persistent profile from Supabase Database (Source of Truth)
  const refreshUserProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        applyProfileState(null);
        return;
      }

      const profile = await getProfileByUserId(session.user.id);
      applyProfileState(profile);
    } catch (err) {
      console.warn('refreshUserProfile error:', err);
      applyProfileState(null);
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
            applyProfileState(profile);
          }
        } else if (mounted) {
          applyProfileState(null);
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
          applyProfileState(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        applyProfileState(null);
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
      const fullPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : cleanDigits.length === 10
        ? `+91${cleanDigits}`
        : `+${cleanDigits}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          data: {
            full_name: extraData?.name || '',
            role: extraData?.role || 'consumer',
          },
        },
      });

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
      const fullPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : cleanDigits.length === 10
        ? `+91${cleanDigits}`
        : `+${cleanDigits}`;

      // Real Supabase verification (No fake universal OTP)
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otpCode.trim(),
        type: 'sms',
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid or expired SMS OTP code.');
      }

      // Check whether profile exists and is complete in public.profiles
      const profile = await getProfileByUserId(data.user.id);

      if (profile && isProfileComplete(profile)) {
        // Returning User: Load profile, skip Complete Profile, proceed to dashboard
        applyProfileState(profile);
        router.push(`/${profile.role}/dashboard`);
        return { isReturningUser: true, role: profile.role };
      } else {
        // New or incomplete user: Redirect to Complete Profile
        const targetRole = role === 'fpo' ? 'farmer' : role;
        router.push(`/auth/complete-profile?role=${targetRole}`);
        return { isReturningUser: false, role: targetRole };
      }
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
    pass: string
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
        applyProfileState(profile);
        router.push(`/${profile.role}/dashboard`);
        return { success: true, role: profile.role };
      } else {
        router.push('/auth/complete-profile');
        return { success: true };
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Backward-compatible login wrappers
  const login = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await loginWithUsernamePassword(identifier, pass);
    return res.success;
  };

  const loginConsumer = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await loginWithUsernamePassword(identifier, pass);
    return res.success;
  };

  const loginLogistics = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await loginWithUsernamePassword(identifier, pass);
    return res.success;
  };

  // Profile update wrappers
  const updateFarmerProfile = async (data: Partial<FarmerUser>): Promise<boolean> => {
    if (!currentProfile) return false;
    const { profile, error } = await upsertProfile({
      id: currentProfile.id,
      full_name: data.name,
      place: data.place,
      district: data.district,
      state: data.state,
      fpo_name: data.farmName,
      phone: data.phone,
      email: data.email,
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
      full_name: data.name,
      place: data.place,
      district: data.district,
      state: data.state,
      phone: data.phone,
      email: data.email,
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
      full_name: data.name,
      place: data.place,
      district: data.district,
      state: data.state,
      phone: data.phone,
      email: data.email,
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

  // Registration helpers
  const register = async (data: Partial<FarmerUser>): Promise<boolean> => {
    router.push('/farmer/login');
    return true;
  };

  const registerConsumer = async (data: Partial<ConsumerUser>): Promise<boolean> => {
    router.push('/consumer/login');
    return true;
  };

  const registerLogistics = async (data: Partial<LogisticsOperator>): Promise<boolean> => {
    router.push('/logistics/login');
    return true;
  };

  // Sign Out cleanly
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    applyProfileState(null);
    router.push('/farmer/login');
  };

  const logoutConsumer = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    applyProfileState(null);
    router.push('/consumer/login');
  };

  const logoutLogistics = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    applyProfileState(null);
    router.push('/logistics/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        consumerUser,
        logisticsUser,
        currentProfile,
        isAuthenticated: !!user,
        isConsumerAuthenticated: !!consumerUser,
        isLogisticsAuthenticated: !!logisticsUser,
        isLoading,
        login,
        register,
        logout,
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
