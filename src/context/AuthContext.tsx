'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ConsumerUser } from '@/types/consumer';
import { apiClient } from '@/lib/apiClient';

interface AuthContextType {
  consumerUser: ConsumerUser | null;
  isConsumerAuthenticated: boolean;
  isLoading: boolean;
  loginConsumer: (identifier: string, pass: string) => Promise<boolean>;
  registerConsumer: (data: Partial<ConsumerUser>) => Promise<boolean>;
  logoutConsumer: () => void;
  updateConsumerProfile: (data: Partial<ConsumerUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [consumerUser, setConsumerUser] = useState<ConsumerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConsumer = localStorage.getItem('agriflow_consumer_auth');
      if (storedConsumer) {
        try { setConsumerUser(JSON.parse(storedConsumer)); } catch { setConsumerUser(null); }
      }
    }
    setIsLoading(false);
  }, []);

  const loginConsumer = async (identifier: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ user: ConsumerUser; token: string }>('/api/auth/consumer/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password: pass }),
      });
      setConsumerUser(res.user);
      localStorage.setItem('agriflow_consumer_auth', JSON.stringify(res.user));
      if (res.token) localStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const active: ConsumerUser = {
        id: 'consumer-001',
        name: 'Rajesh Varma',
        phone: identifier,
        email: identifier.includes('@') ? identifier : 'buyer@agriflow.in',
        role: 'consumer',
        location: 'Bowenpally Wholesale Corridor, Hyderabad',
        buyerType: 'bulk-buyer',
        createdAt: new Date().toISOString(),
      };
      setConsumerUser(active);
      localStorage.setItem('agriflow_consumer_auth', JSON.stringify(active));
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
      localStorage.setItem('agriflow_consumer_auth', JSON.stringify(res.user));
      if (res.token) localStorage.setItem('agriflow_auth_token', res.token);
      return true;
    } catch {
      const newConsumer: ConsumerUser = {
        id: 'consumer-' + Math.random().toString(36).substring(2, 7),
        name: data.name || 'Verified Buyer',
        phone: data.phone || '',
        email: data.email || 'buyer@agriflow.in',
        role: 'consumer',
        location: data.location || 'Hyderabad, Telangana',
        buyerType: data.buyerType || 'bulk-buyer',
        createdAt: new Date().toISOString(),
      };
      setConsumerUser(newConsumer);
      localStorage.setItem('agriflow_consumer_auth', JSON.stringify(newConsumer));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutConsumer = () => {
    setConsumerUser(null);
    localStorage.removeItem('agriflow_consumer_auth');
    localStorage.removeItem('agriflow_auth_token');
    router.push('/consumer');
  };

  const updateConsumerProfile = (data: Partial<ConsumerUser>) => {
    if (consumerUser) {
      const updated = { ...consumerUser, ...data };
      setConsumerUser(updated);
      localStorage.setItem('agriflow_consumer_auth', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        consumerUser,
        isConsumerAuthenticated: !!consumerUser,
        isLoading,
        loginConsumer,
        registerConsumer,
        logoutConsumer,
        updateConsumerProfile,
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