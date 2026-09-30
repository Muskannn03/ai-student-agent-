'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Calendar, GraduationCap, Flame } from 'lucide-react';
import { StudentProfile } from '@/types';

interface WelcomeSectionProps {
  student: StudentProfile;
  motivationalMessage?: string;
  streakDays?: number;
}

export function WelcomeSection({
  student,
  motivationalMessage = "Focus on deep work today — consistent study sessions compound into effortless exam mastery.",
  streakDays = 5,
}: WelcomeSectionProps) {
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date());

  const firstName = student.name.split(' ')[0] || student.name;

  return (
    <Card
      className="relative overflow-hidden border border-[#EDE1D3] bg-white p-6 md:p-8 shadow-[0_2px_12px_rgba(42,27,30,0.03)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Semester & AI Motivational Quote */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="burgundy" dot className="text-xs py-0.5 px-3">
              Semester {student.semester}
            </Badge>
            <span className="text-xs text-[#786568] flex items-center gap-1.5 font-medium">
              <GraduationCap className="h-3.5 w-3.5 text-[#800020]" />
              {student.major}
            </span>
            <span className="text-[#EDE1D3]">•</span>
            <span suppressHydrationWarning className="text-xs text-[#786568] flex items-center gap-1 font-mono">
              <Calendar className="h-3.5 w-3.5 text-[#9E8B8E]" />
              {todayFormatted}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2A1B1E]">
            Welcome back, <span className="text-[#800020]">{firstName}</span>!
          </h1>

          {/* AI-Generated Motivational Insight Box */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE] p-3.5 text-xs text-[#2A1B1E]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-[#800020] uppercase tracking-wider text-[10px] block mb-0.5">
                Academic Mindset
              </span>
              <p className="leading-relaxed text-[#5C4549] italic">
                "{motivationalMessage}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Study Streak & Academic Standing */}
        <div className="flex items-center gap-4 sm:gap-6 self-start lg:self-center shrink-0">
          {/* Streak pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#F3E6D5] bg-[#FFF9F2] px-4 py-3 text-[#800020] shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E6D5] text-[#800020] border border-[#E8D9C8]">
              <Flame className="h-5 w-5 text-[#D45060]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#800020] tracking-wider">Study Streak</p>
              <p className="text-lg font-bold text-[#2A1B1E]">{streakDays} <span className="text-xs font-normal text-[#800020]">days</span></p>
            </div>
          </div>

          {/* Cumulative GPA badge */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE] px-4 py-3 text-[#2A1B1E] shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
              <GraduationCap className="h-5 w-5 text-[#800020]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#786568] tracking-wider">Current GPA</p>
              <p className="text-lg font-bold text-[#2A1B1E]">{student.gpa.toFixed(2)} <span className="text-xs font-normal text-[#786568]">/ 4.0</span></p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
