import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-slate-700 border-t-indigo-500',
          sizeMap[size]
        )}
      />
      {label && <p className="text-xs font-medium text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
}

export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-800/60 border border-slate-700/30',
        className
      )}
    />
  );
}
