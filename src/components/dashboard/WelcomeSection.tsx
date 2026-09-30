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
  }).format(new Date());

  const firstName = student.name.split(' ')[0] || student.name;

  return (
    <Card
      glow
      className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-indigo-950/40 p-6 md:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Semester & AI Motivational Quote */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple" dot className="text-xs py-0.5 px-3">
              Semester {student.semester}
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
              {student.major}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {todayFormatted}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">{firstName}</span>! 👋
          </h1>

          {/* AI-Generated Motivational Insight Box */}
          <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-3.5 text-xs text-slate-200 backdrop-blur-md">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px] block mb-0.5">
                AI Academic Motivation
              </span>
              <p className="leading-relaxed text-slate-300 italic">
                "{motivationalMessage}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Study Streak & Academic Standing */}
        <div className="flex items-center gap-4 sm:gap-6 self-start lg:self-center shrink-0">
          {/* Streak pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-300 backdrop-blur-md shadow-lg shadow-amber-500/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Flame className="h-5 w-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">Study Streak</p>
              <p className="text-lg font-extrabold text-white">{streakDays} <span className="text-xs font-normal text-amber-200/80">days</span></p>
            </div>
          </div>

          {/* Cumulative GPA badge */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current GPA</p>
              <p className="text-lg font-extrabold text-white">{student.gpa.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 4.0</span></p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
