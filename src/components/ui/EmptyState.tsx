import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center backdrop-blur-sm',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-indigo-400 border border-slate-700/60 shadow-inner">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="mt-4 text-base font-semibold text-slate-200">{title}</h4>
      <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
