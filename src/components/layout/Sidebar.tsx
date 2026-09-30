'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarRange,
  CheckSquare,
  BookOpen,
  Clock,
  Briefcase,
  GraduationCap,
  Sparkles,
  LogOut,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onCloseMobile?: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  course: string;
  semester: number;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    loadUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Tutor Chat', href: '/chat', icon: Sparkles, badge: 'Agent' },
    { name: 'Study Plan', href: '/study-plan', icon: CalendarRange },
    { name: 'Assignments', href: '/assignments', icon: CheckSquare },
    { name: 'Notes & AI Summaries', href: '/notes', icon: BookOpen },
    { name: 'Timetable', href: '/timetable', icon: Clock },
    { name: 'Career & Roadmap', href: '/career', icon: Briefcase },
  ];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

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
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-[#F3E6D5] text-[#5C0017] font-semibold shadow-2xs border border-[#E8D9C8]'
                    : 'text-[#6A575A] hover:bg-[#FAF5EE] hover:text-[#2A1B1E]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-[#800020]' : 'text-[#8C7A7C] group-hover:text-[#800020]'
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="rounded-md bg-[#FAF5EE] px-1.5 py-0.5 text-[10px] font-medium text-[#786568] border border-[#EDE1D3]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Active Student Profile */}
      <div className="p-4 border-t border-[#EDE1D3]">
        {user ? (
          <div className="flex items-center justify-between rounded-xl bg-[#FAF5EE] p-2.5 border border-[#EDE1D3]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3E6D5] font-semibold text-[#5C0017] text-xs border border-[#E2CEB9]">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-[#538E6E]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#2A1B1E]">{user.name}</p>
                <p className="truncate text-[10px] text-[#786568]">
                  {user.course || 'Student'} • Sem {user.semester || 1}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#9E8B8E] hover:text-[#D45060] hover:bg-[#FDF2F3] transition-colors ml-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#800020] hover:bg-[#6A001B] py-2 px-3 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In / Register</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
