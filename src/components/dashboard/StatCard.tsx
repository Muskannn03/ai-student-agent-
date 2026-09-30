import React from 'react';
import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'violet';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorTheme = 'indigo',
}: StatCardProps) {
  const themeStyles = {
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      glow: 'before:bg-indigo-500/10',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'before:bg-emerald-500/10',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'before:bg-amber-500/10',
    },
    violet: {
      iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      glow: 'before:bg-violet-500/10',
    },
  };

  const currentTheme = themeStyles[colorTheme];

  return (
    <Card hoverEffect glow className={cn('relative', currentTheme.glow)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{value}</span>
            {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
          </div>
        </div>

        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', currentTheme.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-semibold',
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs last semester</span>
        </div>
      )}
    </Card>
  );
}
