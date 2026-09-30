import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const variantStyles = {
      primary:
        'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/35 border-0',
      secondary:
        'bg-slate-800 text-slate-100 hover:bg-slate-700/80 border border-slate-700/60 shadow-sm',
      outline:
        'border border-slate-700/80 bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white',
      ghost:
        'bg-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-0',
      danger:
        'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
      icon: 'h-10 w-10 p-0 rounded-xl justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
