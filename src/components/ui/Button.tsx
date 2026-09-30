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
        'bg-[#800020] hover:bg-[#6A001B] text-white shadow-xs border border-[#70001C] transition-all',
      secondary:
        'bg-white text-[#2A1B1E] hover:bg-[#FAF4EC] border border-[#EDE1D3] shadow-xs transition-all',
      outline:
        'border border-[#E0D2C2] bg-transparent text-[#2A1B1E] hover:bg-[#F3E6D5]/40 hover:border-[#D4BEA9] transition-all',
      ghost:
        'bg-transparent text-[#786568] hover:bg-[#F3E6D5]/40 hover:text-[#2A1B1E] border-0 transition-all',
      danger:
        'bg-[#FDF2F3] text-[#A62B3A] hover:bg-[#FCE3E7] border border-[#F8CCD2] transition-all',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-xl gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-2xl gap-2.5',
      icon: 'h-10 w-10 p-0 rounded-xl justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#800020]/40 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
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
