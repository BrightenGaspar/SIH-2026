'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20 focus:ring-emerald-500 border border-emerald-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 focus:ring-slate-500 border border-slate-700',
    outline: 'border-2 border-emerald-600/70 hover:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500',
    ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 focus:ring-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-md shadow-rose-950/20',
    amber: 'bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500 shadow-md shadow-amber-950/20',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2.5 gap-2 h-10',
    lg: 'text-base px-6 py-3.5 gap-2.5 h-12',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
