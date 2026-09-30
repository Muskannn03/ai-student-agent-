'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onToggleMobileNav: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({ onToggleMobileNav, title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 md:px-8 backdrop-blur-xl">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileNav}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 md:hidden hover:text-white"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Middle: Universal Search */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search courses, notes, deadlines or ask AI..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500/80 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Quick Actions & Notification */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Link href="/chat">
          <Button size="sm" className="hidden sm:inline-flex gap-1.5 shadow-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask Agent</span>
          </Button>
        </Link>

        <Link href="/assignments">
          <Button variant="outline" size="sm" className="hidden md:inline-flex gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Task</span>
          </Button>
        </Link>

        {/* Notifications Icon with Badge */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
        </button>

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-[11px]">Synced</span>
        </div>
      </div>
    </header>
  );
}
