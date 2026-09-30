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
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5D7C6] bg-[#FAF5EE]/60 p-10 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5ECE1] text-[#800020] border border-[#E5D7C6]">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="mt-3.5 text-sm sm:text-base font-semibold text-[#2A1B1E]">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#786568] leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
