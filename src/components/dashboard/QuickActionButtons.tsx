import React from 'react';
import Link from 'next/link';
import { Bot, PlusCircle, FileText, CalendarPlus } from 'lucide-react';

export function QuickActionButtons() {
  const actions = [
    { label: 'Chat with AI Tutor', href: '/chat', icon: Bot, gradient: 'from-indigo-600/20 to-violet-600/20 text-indigo-300 border-indigo-500/30 hover:border-indigo-400' },
    { label: 'New Assignment', href: '/assignments', icon: PlusCircle, gradient: 'from-pink-600/20 to-rose-600/20 text-pink-300 border-pink-500/30 hover:border-pink-400' },
    { label: 'Create Study Note', href: '/notes', icon: FileText, gradient: 'from-teal-600/20 to-emerald-600/20 text-teal-300 border-teal-500/30 hover:border-teal-400' },
    { label: 'AI Study Plan', href: '/study-plan', icon: CalendarPlus, gradient: 'from-amber-600/20 to-orange-600/20 text-amber-300 border-amber-500/30 hover:border-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link
            key={act.label}
            href={act.href}
            className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-r p-3.5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${act.gradient}`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 border border-white/10 shrink-0">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs font-semibold leading-tight">{act.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
