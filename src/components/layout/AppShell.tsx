'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { X } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-[128px]" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-blue-600/10 blur-[128px]" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex w-72 max-w-[80%] flex-1 flex-col bg-slate-950 border-r border-slate-800">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onCloseMobile={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64 z-10 min-w-0">
        <Header
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
          title={title}
          subtitle={subtitle}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
