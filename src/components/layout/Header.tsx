'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, Sparkles, PlusCircle, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onToggleMobileNav: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({ onToggleMobileNav, title, subtitle }: HeaderProps) {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUserName(data.user.name);
        }
      } catch {
        // ignore
      }
    }
    checkUser();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-[#EDE1D3] bg-[#FFF9F2]/85 px-4 md:px-8 backdrop-blur-md">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileNav}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EDE1D3] bg-[#FAF5EE] text-[#6A575A] md:hidden hover:text-[#2A1B1E] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {title && (
          <div>
            <h1 className="text-base md:text-lg font-semibold tracking-tight text-[#2A1B1E]">{title}</h1>
            {subtitle && <p className="text-xs text-[#786568] hidden sm:block">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Middle: Universal Search */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9E8B8D]" />
          <input
            type="text"
            placeholder="Search notes, assignments, or ask AISA..."
            className="w-full rounded-xl border border-[#E0D2C2] bg-white py-2 pl-10 pr-12 text-xs text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[#EDE1D3] bg-[#FAF5EE] px-1.5 py-0.5 text-[10px] text-[#8C7A7C] font-mono shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Quick Actions & Account */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Link href="/chat">
          <Button size="sm" className="hidden sm:inline-flex gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask AISA</span>
          </Button>
        </Link>

        <Link href="/assignments">
          <Button variant="outline" size="sm" className="hidden md:inline-flex gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </Button>
        </Link>

        {userName ? (
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3E6D5] text-[#5C0017] font-semibold text-xs border border-[#E2CEB9]"
              title={`Logged in as ${userName}`}
            >
              {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
