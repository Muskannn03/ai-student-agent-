import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hoverEffect = false, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl transition-all duration-300',
        hoverEffect && 'hover:border-slate-700/80 hover:bg-slate-900/80 hover:shadow-2xl hover:-translate-y-0.5',
        glow && 'relative overflow-hidden before:absolute before:-left-20 before:-top-20 before:h-40 before:w-40 before:rounded-full before:bg-indigo-500/10 before:blur-3xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-slate-400', className)} {...props}>
      {children}
    </p>
  );
}
