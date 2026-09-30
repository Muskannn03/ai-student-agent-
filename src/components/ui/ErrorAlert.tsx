import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = 'An error occurred',
  message,
  onRetry,
  className,
}: ErrorAlertProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3.5 rounded-2xl border border-[#F8CCD2] bg-[#FDF2F3] p-4 text-[#2A1B1E]',
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FBD9DF] text-[#A62B3A]">
        <AlertCircle className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-xs sm:text-sm font-semibold text-[#800020]">{title}</h5>
        <p className="mt-0.5 text-xs text-[#7A3642] leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-[#F8CCD2] bg-white text-[#800020] hover:bg-[#FBD9DF] shrink-0"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}
