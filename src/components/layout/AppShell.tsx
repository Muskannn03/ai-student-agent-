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
    <div className="relative flex min-h-screen bg-[#FFF9F2] text-[#2A1B1E] font-sans antialiased selection:bg-[#F3E6D5] selection:text-[#5C0017]">
      {/* Background Ambient Radial Tints - Warm Cream & Subtle Rose Tints */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-[#F3E6D5]/50 blur-[130px]" />
        <div className="absolute top-1/4 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#D45060]/10 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 h-[32rem] w-[32rem] rounded-full bg-[#F5ECE1]/50 blur-[130px]" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#2A1B1E]/25 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex w-72 max-w-[80%] flex-1 flex-col bg-white border-r border-[#EDE1D3] shadow-xl">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl text-[#786568] hover:text-[#2A1B1E] bg-[#FAF5EE] border border-[#EDE1D3]"
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
