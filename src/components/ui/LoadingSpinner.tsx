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
          'animate-spin rounded-full border-[#E5D7C6] border-t-[#800020]',
          sizeMap[size]
        )}
      />
      {label && <p className="text-xs font-medium text-[#786568] animate-pulse">{label}</p>}
    </div>
  );
}

export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[#F5ECE1] border border-[#E5D7C6]',
        className
      )}
    />
  );
}
