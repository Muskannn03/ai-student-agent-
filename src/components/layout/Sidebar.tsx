'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
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
    { name: 'AI Tutor Chat', href: '/chat', icon: Sparkles, badge: 'Agent' },
    { name: 'Study Plan', href: '/study-plan', icon: CalendarRange },
    { name: 'Assignments', href: '/assignments', icon: CheckSquare, count: '3' },
    { name: 'Notes & AI Summaries', href: '/notes', icon: BookOpen },
    { name: 'Timetable', href: '/timetable', icon: Clock },
    { name: 'Career & Roadmap', href: '/career', icon: Briefcase },
  ];

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-[#EDE1D3] bg-white/95 backdrop-blur-xl">
      {/* Brand Header */}
      <div>
        <div className="flex h-18 items-center gap-3 border-b border-[#EDE1D3] px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F4CDD5]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-[#800020] text-lg leading-tight block">
              AISA
            </span>
            <p className="text-[11px] text-[#786568] font-medium">AI Student Agent</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 px-3 py-6">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9E8B8D]">
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
                  'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#F3E6D5] text-[#5C0017] font-semibold border border-[#E2CEB9]'
                    : 'text-[#6A575A] hover:bg-[#FAF4EC] hover:text-[#2A1B1E]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4.5 w-4.5 transition-colors',
                      isActive ? 'text-[#800020]' : 'text-[#8C7A7C] group-hover:text-[#2A1B1E]'
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="rounded-full bg-[#FBECEF] px-2 py-0.5 text-[10px] font-semibold text-[#800020] border border-[#F4CDD5] flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-[#D45060]" />
                    {item.badge}
                  </span>
                )}

                {item.count && (
                  <span className="rounded-full bg-[#F5ECE1] px-2 py-0.5 text-[10px] font-semibold text-[#63493E] border border-[#E5D7C6]">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Student Mini Profile */}
      <div className="p-4 space-y-3 border-t border-[#EDE1D3]">
        {/* Agent Status Badge */}
        <div className="rounded-xl border border-[#EDE1D3] bg-[#FAF5EE] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[#2A1B1E]">
              <span className="h-2 w-2 rounded-full bg-[#538E6E] animate-pulse" />
              Agent Core
            </span>
            <span className="text-[10px] text-[#800020] font-mono font-medium">Ready</span>
          </div>
          <p className="mt-1 text-[11px] text-[#786568]">
            {process.env.NEXT_PUBLIC_AI_PROVIDER === 'openai' ? 'GPT-4o' : 'Llama 3.2'} & Prisma active
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl bg-[#FAF5EE] p-2.5 border border-[#EDE1D3]">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E6D5] font-semibold text-[#5C0017] text-xs border border-[#E2CEB9]">
            AR
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#538E6E]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#2A1B1E]">{mockStudent.name}</p>
            <p className="truncate text-[10px] text-[#786568]">GPA {mockStudent.gpa} • Sem {mockStudent.semester}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#9E8B8D]" />
        </div>
      </div>
    </aside>
  );
}
