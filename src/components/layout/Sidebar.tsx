'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  CalendarRange,
  CheckSquare,
  BookOpen,
  Clock,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockStudent } from '@/lib/mock-data';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Tutor Chat', href: '/chat', icon: Bot, badge: 'Agent' },
    { name: 'Study Plan', href: '/study-plan', icon: CalendarRange },
    { name: 'Assignments', href: '/assignments', icon: CheckSquare, count: '3' },
    { name: 'Notes & AI Summaries', href: '/notes', icon: BookOpen },
    { name: 'Timetable', href: '/timetable', icon: Clock },
    { name: 'Career & Roadmap', href: '/career', icon: Briefcase },
  ];

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl">
      {/* Brand Header */}
      <div>
        <div className="flex h-18 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white">AI Student</span>
              <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/30">
                Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Academic Co-Pilot</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 px-3 py-6">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Workspace
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900/60 hover:text-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4.5 w-4.5 transition-colors',
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                    {item.badge}
                  </span>
                )}

                {item.count && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Student Mini Profile */}
      <div className="p-4 space-y-3 border-t border-slate-800/80">
        {/* Agent Status Badge */}
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-slate-900/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Agent Core
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">Ready</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {process.env.NEXT_PUBLIC_AI_PROVIDER === 'openai' ? 'GPT-4o' : 'Llama 3.2'} & Prisma ORM enabled
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 font-semibold text-white text-xs shadow-md">
            AR
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{mockStudent.name}</p>
            <p className="truncate text-[10px] text-slate-300">GPA {mockStudent.gpa} • Sem {mockStudent.semester}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
