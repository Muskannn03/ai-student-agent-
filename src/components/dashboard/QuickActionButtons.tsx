import React from 'react';
import Link from 'next/link';
import { Sparkles, PlusCircle, FileText, CalendarPlus } from 'lucide-react';

export function QuickActionButtons() {
  const actions = [
    { label: 'Chat with AI Tutor', href: '/chat', icon: Sparkles, iconBg: 'bg-[#FBECEF] text-[#800020] border-[#F8CCD2]' },
    { label: 'New Assignment', href: '/assignments', icon: PlusCircle, iconBg: 'bg-[#FDF2F3] text-[#D45060] border-[#F8CCD2]' },
    { label: 'Create Study Note', href: '/notes', icon: FileText, iconBg: 'bg-[#FAF5EE] text-[#5C4549] border-[#EDE1D3]' },
    { label: 'AI Study Plan', href: '/study-plan', icon: CalendarPlus, iconBg: 'bg-[#F5ECE1] text-[#800020] border-[#E8D9C8]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link
            key={act.label}
            href={act.href}
            className="flex items-center gap-3 rounded-2xl border border-[#EDE1D3] bg-white p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D45060]/40 hover:bg-[#FAF5EE]/30 hover:shadow-xs"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${act.iconBg} shrink-0`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs font-semibold text-[#2A1B1E] leading-tight">{act.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
