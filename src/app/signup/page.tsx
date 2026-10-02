'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Mail, Lock, User, BookOpen, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [course, setCourse] = useState('Computer Science');
  const [semester, setSemester] = useState(1);
  const [college, setCollege] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          course: course.trim(),
          semester: Number(semester),
          college: college.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account.');
      }

      // Successful registration
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#2A1B1E] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative selection:bg-[#F3E6D5] selection:text-[#5C0017]">
      {/* Background Ambient Radial Tints */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-[#F3E6D5]/50 blur-[130px]" />
        <div className="absolute top-1/4 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#D45060]/10 blur-[140px]" />
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

        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#2A1B1E]">
          Create your student account
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#786568]">
          Set up your calm study hub. Manage assignments, notes, and study schedules.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="rounded-3xl border border-[#EDE1D3] bg-white p-6 sm:p-8 shadow-sm space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#F8CCD2] bg-[#FDF2F3] p-3 text-xs text-[#800020]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A1B1E] mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9E8B8E]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Muskan Verma"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1B1E] mb-1.5">
                University Email *
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
              <label className="block text-xs font-semibold text-[#2A1B1E] mb-1.5">
                Password * (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9E8B8E]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2A1B1E] mb-1.5">
                  Degree / Major
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Computer Science"
                    className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A1B1E] mb-1.5">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3 text-xs sm:text-sm text-[#2A1B1E] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#EDE1D3] text-center">
            <p className="text-xs text-[#786568]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#800020] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
