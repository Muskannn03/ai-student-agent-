'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign in. Please check credentials.');
      }

      // Successful login
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('alex.rivera@university.edu');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#2A1B1E] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#F3E6D5] selection:text-[#5C0017]">
      {/* Background Ambient Radial Tints */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-[#F3E6D5]/50 blur-[130px]" />
        <div className="absolute top-1/3 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#D45060]/10 blur-[140px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Logo and Brand */}
        <div className="inline-flex items-center gap-3 group select-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBECEF] text-[#800020] border border-[#F4CDD5] shadow-xs group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="text-left">
            <span className="font-bold tracking-tight text-[#800020] text-2xl leading-tight block">
              AISA
            </span>
            <p className="text-xs text-[#786568] font-medium">AI Student Agent</p>
          </div>
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#2A1B1E]">
          Sign in to your study space
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#786568]">
          Welcome back. Continue your personalized coursework and study plans.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="rounded-3xl border border-[#EDE1D3] bg-white p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#F8CCD2] bg-[#FDF2F3] p-3 text-xs text-[#800020]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A1B1E] mb-1.5">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9E8B8E]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#2A1B1E]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9E8B8E]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 text-xs sm:text-sm font-semibold gap-2 justify-center shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-5 pt-4 border-t border-[#EDE1D3] text-center">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#800020] hover:text-[#5C0017] transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Fill Demo Student Credentials</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-[#786568]">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-[#800020] hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
