import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'outline' | 'burgundy' | 'cream' | 'rose';
  dot?: boolean;
}

export function Badge({ children, className, variant = 'default', dot = false, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#F5ECE1] text-[#63493E] border-[#E5D7C6]',
    success: 'bg-[#EAF2ED] text-[#2F6144] border-[#CCE0D4]',
    warning: 'bg-[#FDF6ED] text-[#8C6228] border-[#F4E3C8]',
    danger: 'bg-[#FDF2F3] text-[#A62B3A] border-[#F8CCD2]',
    purple: 'bg-[#FBECEF] text-[#800020] border-[#F4CDD5]',
    outline: 'bg-transparent text-[#786568] border-[#EDE1D3]',
    burgundy: 'bg-[#FBECEF] text-[#800020] border-[#F4CDD5]',
    cream: 'bg-[#F5ECE1] text-[#63493E] border-[#E5D7C6]',
    rose: 'bg-[#FDF2F3] text-[#D45060] border-[#F8CCD2]',
  };

  const dotColors = {
    default: 'bg-[#9C7F72]',
    success: 'bg-[#538E6E]',
    warning: 'bg-[#C99042]',
    danger: 'bg-[#D45060]',
    purple: 'bg-[#800020]',
    outline: 'bg-[#9C7F72]',
    burgundy: 'bg-[#800020]',
    cream: 'bg-[#800020]',
    rose: 'bg-[#D45060]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
