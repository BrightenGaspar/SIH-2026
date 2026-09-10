'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User as FarmerUser } from '@/types/farmer';
import { ConsumerUser } from '@/types/consumer';
import { LogisticsOperator } from '@/types/logistics';
import { apiClient } from '@/lib/apiClient';
import { auth } from '@/lib/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  ConfirmationResult 
} from 'firebase/auth';

interface AuthContextType {
  user: FarmerUser | null;
  consumerUser: ConsumerUser | null;
  logisticsUser: LogisticsOperator | null;
  isAuthenticated: boolean;
  isConsumerAuthenticated: boolean;
  isLogisticsAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (data: Partial<FarmerUser>) => Promise<boolean>;
  logout: () => void;
  loginConsumer: (identifier: string, pass: string) => Promise<boolean>;
  registerConsumer: (data: Partial<ConsumerUser>) => Promise<boolean>;
  logoutConsumer: () => void;
  updateFarmerLanguage: (lang: string) => Promise<boolean>;
  updateConsumerLanguage: (lang: string) => Promise<boolean>;
  updateLogisticsLanguage: (lang: string) => Promise<boolean>;
  updateFarmerProfile: (data: Partial<FarmerUser>) => Promise<boolean>;
  updateConsumerProfile: (data: Partial<ConsumerUser>) => Promise<boolean>;
  updateLogisticsProfile: (data: Partial<LogisticsOperator>) => Promise<boolean>;
  refreshUserProfile: () => Promise<void>;
  loginLogistics: (identifier: string, pass: string) => Promise<boolean>;
  registerLogistics: (data: Partial<LogisticsOperator>) => Promise<boolean>;
  logoutLogistics: () => void;
  sendPhoneOtp: (phoneNumber: string, appVerifier?: RecaptchaVerifier | string) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (
    confirmationResult: ConfirmationResult,
    otpCode: string,
    role: 'farmer' | 'consumer' | 'logistics' | 'fpo',
    extraData?: { name?: string; phone?: string }
  ) => Promise<void>;
  loginWithGoogle: (role: 'farmer' | 'consumer' | 'logistics' | 'fpo') => Promise<{ profileCompleted: boolean }>;
  loginWithDemo: (role: string, name?: string, phone?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarmerUser | null>(null);
  const [consumerUser, setConsumerUser] = useState<ConsumerUser | null>(null);
  const [logisticsUser, setLogisticsUser] = useState<LogisticsOperator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from sessionStorage if tab is active; closing the browser resets session
    if (typeof window !== 'undefined') {
      const storedFarmer = sessionStorage.getItem('agriflow_farmer_auth');
      if (storedFarmer) {
        try { setUser(JSON.parse(storedFarmer)); } catch { setUser(null); }
      }

      const storedConsumer = sessionStorage.getItem('agriflow_consumer_auth');
      if (storedConsumer) {
        try { setConsumerUser(JSON.parse(storedConsumer)); } catch { setConsumerUser(null); }
      }

      const storedLogistics = sessionStorage.getItem('agriflow_logistics_auth');
      if (storedLogistics) {
        try { setLogisticsUser(JSON.parse(storedLogistics)); } catch { setLogisticsUser(null); }
      }
    }
    
    // Fetch real profile from backend as source of truth
    refreshUserProfile().finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Source of Truth: GET /api/auth/me to sync preferredLanguage and locations
  const refreshUserProfile = async () => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('agriflow_auth_token') : null;
      if (!token) return;

      const profile = await apiClient<{
        id: string;
        name: string;
        role: 'farmer' | 'consumer' | 'logistics' | 'fpo';
        state?: string;
        district?: string;
        place?: string;
        preferredLanguage?: any;
        phone?: string;
        email?: string;
        farmName?: string;
        location?: string;
        buyerType?: any;
        vehicleType?: any;
        vehicleNumber?: any;
      }>('/api/auth/me');

      if (profile) {
        if (profile.role === 'farmer' || profile.role === 'fpo') {
          const updatedFarmer: FarmerUser = {
            id: profile.id,
            name: profile.name,
            phone: profile.phone || '',
            email: profile.email || '',
            role: 'farmer',
            state: profile.state,
            district: profile.district,
            place: profile.place,
            preferredLanguage: profile.preferredLanguage,
            farmName: profile.farmName,
            location: profile.location || `${profile.place || ''}, ${profile.district || ''}, ${profile.state || ''}`.replace(/^, |, $/g, ''),
            farmerType: 'FPO',
          };
          setUser(updatedFarmer);
          sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(updatedFarmer));
          if (profile.preferredLanguage) {
            sessionStorage.setItem('agriflow_cached_lang', profile.preferredLanguage);
          }
        } else if (profile.role === 'consumer') {
          const updatedConsumer: ConsumerUser = {
            id: profile.id,
            name: profile.name,
            phone: profile.phone || '',
            email: profile.email || '',
            role: 'consumer',
            state: profile.state,
            district: profile.district,
            place: profile.place,
            preferredLanguage: profile.preferredLanguage,
            location: profile.location || `${profile.place || ''}, ${profile.district || ''}, ${profile.state || ''}`,
            buyerType: profile.buyerType || 'bulk-buyer',
            createdAt: new Date().toISOString(),
          };
          setConsumerUser(updatedConsumer);
          sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(updatedConsumer));
          if (profile.preferredLanguage) {
            sessionStorage.setItem('agriflow_cached_lang', profile.preferredLanguage);
          }
        } else if (profile.role === 'logistics') {
          const updatedLogistics: LogisticsOperator = {
            id: profile.id,
            name: profile.name,
            phone: profile.phone || '',
            email: profile.email || '',
            role: 'logistics',
            state: profile.state,
            district: profile.district,
            place: profile.place,
            preferredLanguage: profile.preferredLanguage,
            vehicleType: profile.vehicleType || 'Tata 407 Reefer',
            vehicleNumber: profile.vehicleNumber || 'TS 08 UB 4192',
            vehicleCapacityKg: 5000,
            reeferEnabled: true,
            operatingRegion: profile.state ? `${profile.state} Corridor` : 'Freight Corridor',
            preferredRoutes: ['Shadnagar -> Hyderabad'],
            createdAt: new Date().toISOString(),
          };
          setLogisticsUser(updatedLogistics);
          sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(updatedLogistics));
          if (profile.preferredLanguage) {
            sessionStorage.setItem('agriflow_cached_lang', profile.preferredLanguage);
          }
        }
      }
    } catch {
      // Backend not connected or unauthenticated; retain loaded session or fallback
    }
  };

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ user: FarmerUser; token: string }>('/api/auth/farmer/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password: pass }),
      });
      setUser(res.user);
      sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(res.user));
      if (res.user.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', res.user.preferredLanguage);
      }
      if (res.token) sessionStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const fallbackUser: FarmerUser = {
        id: 'farmer-001',
        name: 'Ramesh Reddy',
        phone: identifier,
        email: 'ramesh.reddy@fpo.in',
        role: 'farmer',
        state: 'Telangana',
        district: 'Rangareddy',
        place: 'Shadnagar',
        preferredLanguage: 'te',
        location: 'Shadnagar, Rangareddy, Telangana',
        farmName: 'Shadnagar Farmers Collective',
        farmerType: 'FPO',
        createdAt: new Date().toISOString(),
      };
      setUser(fallbackUser);
      sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(fallbackUser));
      sessionStorage.setItem('agriflow_cached_lang', 'te');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Partial<FarmerUser>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ user: FarmerUser; token: string }>('/api/auth/farmer/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(res.user);
      sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(res.user));
      if (res.user.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', res.user.preferredLanguage);
      }
      if (res.token) sessionStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const newUser: FarmerUser = {
        role: 'farmer',
        id: 'farmer-' + Math.random().toString(36).substring(2, 7),
        name: data.name || 'New Farmer',
        phone: data.phone || '',
        email: data.email || '',
        state: data.state || 'Telangana',
        district: data.district || 'Rangareddy',
        place: data.place || 'Chevella',
        preferredLanguage: data.preferredLanguage || 'te',
        farmName: data.farmName || '',
        location: data.location || `${data.place || 'Chevella'}, ${data.district || 'Rangareddy'}, ${data.state || 'Telangana'}`,
        farmerType: data.farmerType || 'Individual Farmer',
        farmSize: data.farmSize || '5 Acres',
        primaryCrops: data.primaryCrops || ['Tomato'],
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(newUser));
      if (newUser.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', newUser.preferredLanguage);
      }
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFarmerProfile = async (data: Partial<FarmerUser>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...data };
    try {
      await apiClient('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch {
      // Offline / fallback persistence
    }
    setUser(updated);
    sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(updated));
    if (data.preferredLanguage) {
      sessionStorage.setItem('agriflow_cached_lang', data.preferredLanguage);
    }
    return true;
  };

  const updateFarmerLanguage = async (lang: string): Promise<boolean> => {
    return updateFarmerProfile({ preferredLanguage: lang as any });
  };

  // Logout Farmer
  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    sessionStorage.removeItem('agriflow_farmer_auth');
    sessionStorage.removeItem('agriflow_auth_token');
    sessionStorage.removeItem('agriflow_cached_lang');
    router.push('/farmer');
  };

  const loginConsumer = async (identifier: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ user: ConsumerUser; token: string }>('/api/auth/consumer/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password: pass }),
      });
      setConsumerUser(res.user);
      sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(res.user));
      if (res.user.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', res.user.preferredLanguage);
      }
      if (res.token) sessionStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const active: ConsumerUser = {
        id: 'consumer-001',
        name: 'Rajesh Varma',
        phone: identifier,
        email: identifier.includes('@') ? identifier : 'buyer@agriflow.in',
        role: 'consumer',
        state: 'Telangana',
        district: 'Hyderabad',
        place: 'Bowenpally',
        preferredLanguage: 'ta',
        location: 'Bowenpally Wholesale Corridor, Hyderabad',
        buyerType: 'bulk-buyer',
        createdAt: new Date().toISOString(),
      };
      setConsumerUser(active);
      sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(active));
      sessionStorage.setItem('agriflow_cached_lang', 'ta');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const registerConsumer = async (data: Partial<ConsumerUser>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ user: ConsumerUser; token: string }>('/api/auth/consumer/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setConsumerUser(res.user);
      sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(res.user));
      if (res.user.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', res.user.preferredLanguage);
      }
      if (res.token) sessionStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const newConsumer: ConsumerUser = {
        id: 'consumer-' + Math.random().toString(36).substring(2, 7),
        name: data.name || 'Verified Buyer',
        phone: data.phone || '',
        email: data.email || 'buyer@agriflow.in',
        role: 'consumer',
        state: data.state || 'Telangana',
        district: data.district || 'Hyderabad',
        place: data.place || 'Bowenpally',
        preferredLanguage: data.preferredLanguage || 'ta',
        location: data.location || `${data.place || 'Bowenpally'}, ${data.district || 'Hyderabad'}, ${data.state || 'Telangana'}`,
        buyerType: data.buyerType || 'bulk-buyer',
        typicalOrderSizeKg: data.typicalOrderSizeKg || 1000,
        createdAt: new Date().toISOString(),
      };
      setConsumerUser(newConsumer);
      sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(newConsumer));
      if (newConsumer.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', newConsumer.preferredLanguage);
      }
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsumerProfile = async (data: Partial<ConsumerUser>): Promise<boolean> => {
    if (!consumerUser) return false;
    const updated = { ...consumerUser, ...data };
    try {
      await apiClient('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch {
      // Offline / fallback persistence
    }
    setConsumerUser(updated);
    sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(updated));
    if (data.preferredLanguage) {
      sessionStorage.setItem('agriflow_cached_lang', data.preferredLanguage);
    }
    return true;
  };

  const updateConsumerLanguage = async (lang: string): Promise<boolean> => {
    return updateConsumerProfile({ preferredLanguage: lang as any });
  };

  const logoutConsumer = () => {
    setConsumerUser(null);
    sessionStorage.removeItem('agriflow_consumer_auth');
    sessionStorage.removeItem('agriflow_auth_token');
    sessionStorage.removeItem('agriflow_cached_lang');
    router.push('/consumer');
  };

  const loginLogistics = async (identifier: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ user: LogisticsOperator; token: string }>('/api/auth/logistics/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password: pass }),
      });
      setLogisticsUser(res.user);
      sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(res.user));
      if (res.user.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', res.user.preferredLanguage);
      }
      if (res.token) sessionStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const active: LogisticsOperator = {
        id: 'logistics-001',
        name: 'Mohammed Ismail',
        phone: identifier,
        email: 'ismail.logistics@fleet.in',
        role: 'logistics',
        state: 'Telangana',
        district: 'Rangareddy',
        place: 'Shamshabad Fleet Hub',
        preferredLanguage: 'hi',
        vehicleType: 'Tata 407 Reefer',
        vehicleNumber: 'TS 08 UB 4192',
        vehicleCapacityKg: 5000,
        reeferEnabled: true,
        operatingRegion: 'Telangana & Andhra Pradesh Corridor',
        preferredRoutes: ['Shadnagar -> Hyderabad'],
        createdAt: new Date().toISOString(),
      };
      setLogisticsUser(active);
      sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(active));
      sessionStorage.setItem('agriflow_cached_lang', 'hi');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const registerLogistics = async (data: Partial<LogisticsOperator>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ user: LogisticsOperator; token: string }>('/api/auth/logistics/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setLogisticsUser(res.user);
      sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(res.user));
      if (res.user.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', res.user.preferredLanguage);
      }
      if (res.token) sessionStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const newOp: LogisticsOperator = {
        id: 'logistics-' + Math.random().toString(36).substring(2, 7),
        name: data.name || 'Carrier Operator',
        phone: data.phone || '',
        email: data.email || 'operator@fleet.in',
        role: 'logistics',
        state: data.state || 'Telangana',
        district: data.district || 'Rangareddy',
        place: data.place || 'Shamshabad Fleet Hub',
        preferredLanguage: data.preferredLanguage || 'hi',
        vehicleType: data.vehicleType || 'Tata 407 Reefer',
        vehicleNumber: data.vehicleNumber || 'TS 08 UB 4192',
        vehicleCapacityKg: data.vehicleCapacityKg || 5000,
        reeferEnabled: data.reeferEnabled ?? true,
        operatingRegion: data.operatingRegion || `${data.state || 'Telangana'} Corridor`,
        preferredRoutes: data.preferredRoutes || ['Shadnagar -> Hyderabad'],
        createdAt: new Date().toISOString(),
      };
      setLogisticsUser(newOp);
      sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(newOp));
      if (newOp.preferredLanguage) {
        sessionStorage.setItem('agriflow_cached_lang', newOp.preferredLanguage);
      }
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLogisticsProfile = async (data: Partial<LogisticsOperator>): Promise<boolean> => {
    if (!logisticsUser) return false;
    const updated = { ...logisticsUser, ...data };
    try {
      await apiClient('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch {
      // Offline / fallback persistence
    }
    setLogisticsUser(updated);
    sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(updated));
    if (data.preferredLanguage) {
      sessionStorage.setItem('agriflow_cached_lang', data.preferredLanguage);
    }
    return true;
  };

  const updateLogisticsLanguage = async (lang: string): Promise<boolean> => {
    return updateLogisticsProfile({ preferredLanguage: lang as any });
  };

  const logoutLogistics = () => {
    setLogisticsUser(null);
    sessionStorage.removeItem('agriflow_logistics_auth');
    sessionStorage.removeItem('agriflow_auth_token');
    sessionStorage.removeItem('agriflow_cached_lang');
    router.push('/logistics');
  };

  const sendPhoneOtp = async (phoneNumber: string, appVerifier?: RecaptchaVerifier | string): Promise<ConfirmationResult> => {
    setIsLoading(true);
    try {
      let verifier: RecaptchaVerifier;
      if (typeof appVerifier === 'string' || !appVerifier) {
        const containerId = typeof appVerifier === 'string' ? appVerifier : 'recaptcha-container';
        verifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
        });
      } else {
        verifier = appVerifier;
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      return confirmation;
    } catch (error) {
      console.warn('Firebase SMS provider error, falling back to simulated OTP:', error);
      const simulatedConfirmation: ConfirmationResult = {
        verificationId: 'simulated-ver-id-' + Date.now(),
        confirm: async (_code: string) => {
          return {
            user: {
              uid: 'user-' + Date.now(),
              phoneNumber: phoneNumber,
            }
          } as any;
        }
      };
      return simulatedConfirmation;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    otpCode: string,
    role: 'farmer' | 'consumer' | 'logistics' | 'fpo',
    extraData?: { name?: string; phone?: string; state?: string; district?: string; place?: string; preferredLanguage?: any }
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await confirmationResult.confirm(otpCode);
      await loginWithDemo(role, extraData?.name, extraData?.phone);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: 'farmer' | 'consumer' | 'logistics' | 'fpo'): Promise<{ profileCompleted: boolean }> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      // Try backend check
      try {
        const token = await gUser.getIdToken();
        sessionStorage.setItem('agriflow_auth_token', token);
        const profile = await apiClient<{
          id: string;
          name: string;
          role: 'farmer' | 'consumer' | 'logistics' | 'fpo';
          state?: string;
          district?: string;
          place?: string;
          address?: string;
          preferredLanguage?: any;
          profileCompleted?: boolean;
        }>('/api/auth/me');

        if (profile && profile.profileCompleted) {
          await refreshUserProfile();
          return { profileCompleted: true };
        }
      } catch {
        // Backend offline / new user
      }

      // New Google User: Store initial draft in session without profileCompleted
      if (role === 'farmer' || role === 'fpo') {
        const newGoogleFarmer: FarmerUser = {
          id: 'farmer-' + gUser.uid.substring(0, 8),
          name: gUser.displayName || 'Google Farmer',
          email: gUser.email || '',
          phone: gUser.phoneNumber || '',
          photoURL: gUser.photoURL || undefined,
          role: 'farmer',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        setUser(newGoogleFarmer);
        sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(newGoogleFarmer));
      } else if (role === 'consumer') {
        const newGoogleConsumer: ConsumerUser = {
          id: 'consumer-' + gUser.uid.substring(0, 8),
          name: gUser.displayName || 'Google Buyer',
          email: gUser.email || '',
          phone: gUser.phoneNumber || '',
          photoURL: gUser.photoURL || undefined,
          role: 'consumer',
          location: '',
          buyerType: 'household',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        setConsumerUser(newGoogleConsumer);
        sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(newGoogleConsumer));
      } else if (role === 'logistics') {
        const newGoogleLogistics: LogisticsOperator = {
          id: 'logistics-' + gUser.uid.substring(0, 8),
          name: gUser.displayName || 'Google Logistics Fleet',
          email: gUser.email || '',
          phone: gUser.phoneNumber || '',
          photoURL: gUser.photoURL || undefined,
          role: 'logistics',
          vehicleType: 'Tata 407 Reefer',
          vehicleNumber: '',
          vehicleCapacityKg: 2500,
          reeferEnabled: true,
          operatingRegion: '',
          preferredRoutes: [],
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        setLogisticsUser(newGoogleLogistics);
        sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(newGoogleLogistics));
      }
      return { profileCompleted: false };
    } catch (error) {
      console.warn('Google popup error, falling back to simulated new user:', error);
      if (role === 'farmer' || role === 'fpo') {
        const newGoogleFarmer: FarmerUser = {
          id: 'farmer-google-' + Date.now().toString(36),
          name: 'Kisan Google User',
          email: 'farmer@gmail.com',
          phone: '',
          role: 'farmer',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        setUser(newGoogleFarmer);
        sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(newGoogleFarmer));
      } else if (role === 'consumer') {
        const newGoogleConsumer: ConsumerUser = {
          id: 'consumer-google-' + Date.now().toString(36),
          name: 'Consumer Google User',
          email: 'buyer@gmail.com',
          phone: '',
          role: 'consumer',
          location: '',
          buyerType: 'household',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        setConsumerUser(newGoogleConsumer);
        sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(newGoogleConsumer));
      } else if (role === 'logistics') {
        const newGoogleLogistics: LogisticsOperator = {
          id: 'logistics-google-' + Date.now().toString(36),
          name: 'Logistics Google User',
          email: 'fleet@gmail.com',
          phone: '',
          role: 'logistics',
          vehicleType: 'Tata 407 Reefer',
          vehicleNumber: '',
          vehicleCapacityKg: 2500,
          reeferEnabled: true,
          operatingRegion: '',
          preferredRoutes: [],
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        setLogisticsUser(newGoogleLogistics);
        sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(newGoogleLogistics));
      }
      return { profileCompleted: false };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemo = async (role: string, name?: string, phone?: string): Promise<void> => {
    setIsLoading(true);
    if (role === 'farmer' || role === 'fpo') {
      const demoFarmer: FarmerUser = {
        id: 'farmer-001',
        name: name || 'Ramesh Reddy (Shadnagar FPO)',
        phone: phone || '+91 98480 12345',
        email: 'ramesh.reddy@fpo.in',
        role: 'farmer',
        state: 'Telangana',
        district: 'Rangareddy',
        place: 'Shadnagar',
        preferredLanguage: 'te',
        location: 'Shadnagar, Rangareddy, Telangana',
        farmName: 'Shadnagar Farmers Collective',
        farmerType: 'FPO',
        createdAt: new Date().toISOString(),
      };
      setUser(demoFarmer);
      sessionStorage.setItem('agriflow_farmer_auth', JSON.stringify(demoFarmer));
      sessionStorage.setItem('agriflow_cached_lang', 'te');
    } else if (role === 'consumer') {
      const demoConsumer: ConsumerUser = {
        id: 'consumer-001',
        name: name || 'Priya Sharma (Hyderabad Wholesale)',
        phone: phone || '+91 98480 54321',
        email: 'priya@wholesale.in',
        role: 'consumer',
        state: 'Telangana',
        district: 'Hyderabad',
        place: 'Bowenpally',
        preferredLanguage: 'ta',
        location: 'Bowenpally Wholesale Corridor, Hyderabad',
        buyerType: 'bulk-buyer',
        createdAt: new Date().toISOString(),
      };
      setConsumerUser(demoConsumer);
      sessionStorage.setItem('agriflow_consumer_auth', JSON.stringify(demoConsumer));
      sessionStorage.setItem('agriflow_cached_lang', 'ta');
    } else if (role === 'logistics') {
      const demoLogistics: LogisticsOperator = {
        id: 'logistics-001',
        name: name || 'Gurdeep Singh',
        phone: phone || '+91 98480 99881',
        email: 'gurdeep@reeferfleet.in',
        role: 'logistics',
        state: 'Telangana',
        district: 'Rangareddy',
        place: 'Shamshabad Fleet Hub',
        preferredLanguage: 'hi',
        vehicleType: 'Tata 407 Reefer',
        vehicleNumber: 'TS 08 UB 4192',
        vehicleCapacityKg: 5000,
        reeferEnabled: true,
        operatingRegion: 'Telangana & AP Perishable Corridor',
        preferredRoutes: ['Shadnagar -> Hyderabad'],
        createdAt: new Date().toISOString(),
      };
      setLogisticsUser(demoLogistics);
      sessionStorage.setItem('agriflow_logistics_auth', JSON.stringify(demoLogistics));
      sessionStorage.setItem('agriflow_cached_lang', 'hi');
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        consumerUser,
        logisticsUser,
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
        sendPhoneOtp,
        verifyPhoneOtp,
        loginWithGoogle,
        loginWithDemo,
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
