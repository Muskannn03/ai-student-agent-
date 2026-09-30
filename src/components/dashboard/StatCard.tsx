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
      iconBg: 'bg-[#FBECEF] text-[#800020] border-[#F8CCD2]',
    },
    emerald: {
      iconBg: 'bg-[#F5ECE1] text-[#800020] border-[#E8D9C8]',
    },
    amber: {
      iconBg: 'bg-[#FDF2F3] text-[#D45060] border-[#F8CCD2]',
    },
    violet: {
      iconBg: 'bg-[#FAF5EE] text-[#5C4549] border-[#EDE1D3]',
    },
  };

  const currentTheme = themeStyles[colorTheme];

  return (
    <Card hoverEffect className="relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#786568]">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-[#2A1B1E]">{value}</span>
            {subtitle && <span className="text-xs text-[#786568]">{subtitle}</span>}
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
              trend.isPositive ? 'text-[#800020]' : 'text-[#D45060]'
            )}
          >
            {trend.value}
          </span>
          <span className="text-[#9E8B8E]">vs last semester</span>
        </div>
      )}
    </Card>
  );
}
