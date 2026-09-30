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
        'rounded-2xl border border-[#EDE1D3] bg-white p-6 shadow-[0_2px_8px_rgba(42,27,30,0.03)] text-[#2A1B1E] transition-all duration-200',
        hoverEffect && 'hover:border-[#DECBC0] hover:shadow-[0_4px_16px_rgba(42,27,30,0.05)] hover:-translate-y-0.5',
        glow && 'relative overflow-hidden before:absolute before:-left-16 before:-top-16 before:h-36 before:w-36 before:rounded-full before:bg-[#F3E6D5]/60 before:blur-2xl before:pointer-events-none',
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
    <h3 className={cn('text-base sm:text-lg font-semibold tracking-tight text-[#2A1B1E]', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs sm:text-sm text-[#786568]', className)} {...props}>
      {children}
    </p>
  );
}
