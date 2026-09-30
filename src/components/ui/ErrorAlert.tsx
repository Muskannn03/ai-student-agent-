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
        'flex items-start gap-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4.5 text-rose-300 backdrop-blur-md',
        className
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h5 className="text-sm font-semibold text-rose-200">{title}</h5>
        <p className="mt-0.5 text-xs text-rose-300/80 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:text-white shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
