'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types/farmer';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (data: Partial<User>) => Promise<boolean>;
  logout: () => void;
}

const defaultUser: User = {
  id: 'farmer-001',
  name: 'Ramesh Reddy',
  phone: '+91 98480 12345',
  email: 'ramesh.reddy@shadnagar-fpo.in',
  role: 'farmer',
  location: 'Shadnagar, Rangareddy, Telangana',
  farmName: 'Shadnagar Organic Growers FPO',
  farmerType: 'FPO',
  farmSize: '12.5 Acres',
  primaryCrops: ['Tomato', 'Green Chilli', 'Onion'],
  createdAt: '2026-01-10T10:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('agriflow_farmer_auth');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(defaultUser);
      }
    } else {
      // Seed default user for smooth prototype demo
      setUser(defaultUser);
      localStorage.setItem('agriflow_farmer_auth', JSON.stringify(defaultUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const activeUser = { ...defaultUser, phone: identifier.includes('@') ? defaultUser.phone : identifier };
    setUser(activeUser);
    localStorage.setItem('agriflow_farmer_auth', JSON.stringify(activeUser));
    setIsLoading(false);
    return true;
  };

  const register = async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const newUser: User = {
      ...defaultUser,
      id: 'farmer-' + Math.random().toString(36).substring(2, 7),
      name: data.name || 'New Farmer',
      phone: data.phone || '+91 99000 00000',
      email: data.email || '',
      farmName: data.farmName || 'Primary Farm',
      location: data.location || 'Telangana, India',
      farmerType: data.farmerType || 'Individual Farmer',
      farmSize: data.farmSize || '5 Acres',
      primaryCrops: data.primaryCrops || ['Tomato'],
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('agriflow_farmer_auth', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agriflow_farmer_auth');
    router.push('/farmer');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
