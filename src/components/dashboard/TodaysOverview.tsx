'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { BookOpen, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TodaysOverviewProps {
  classesCount: number;
  assignmentsDueCount: number;
  studyHoursLogged: number;
  studyHoursTarget?: number;
  pendingTasksCount: number;
}

export function TodaysOverview({
  classesCount,
  assignmentsDueCount,
  studyHoursLogged,
  studyHoursTarget = 4,
  pendingTasksCount,
}: TodaysOverviewProps) {
  const metrics = [
    {
      title: "Today's Classes",
      value: classesCount,
      unit: classesCount === 1 ? 'class' : 'classes',
      subtitle: classesCount > 0 ? 'Next at 09:00 AM' : 'No classes today',
      icon: BookOpen,
      href: '/timetable',
      actionText: 'View schedule',
      color: 'indigo',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      accentGlow: 'before:bg-indigo-500/10',
    },
    {
      title: 'Assignments Due',
      value: assignmentsDueCount,
      unit: assignmentsDueCount === 1 ? 'due soon' : 'due soon',
      subtitle: assignmentsDueCount > 0 ? 'Requires attention' : 'All clear for now',
      icon: assignmentsDueCount > 0 ? AlertTriangle : CheckCircle2,
      href: '/assignments',
      actionText: 'View tasks',
      color: assignmentsDueCount > 0 ? 'amber' : 'emerald',
      badgeBg: assignmentsDueCount > 0
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      accentGlow: assignmentsDueCount > 0 ? 'before:bg-amber-500/10' : 'before:bg-emerald-500/10',
    },
    {
      title: 'Today Study Hours',
      value: `${studyHoursLogged}h`,
      unit: `/ ${studyHoursTarget}h target`,
      subtitle: `${Math.round((studyHoursLogged / studyHoursTarget) * 100)}% of daily goal`,
      icon: Clock,
      href: '/study-plan',
      actionText: 'Open planner',
      color: 'violet',
      badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      accentGlow: 'before:bg-violet-500/10',
      progress: Math.min(100, Math.round((studyHoursLogged / studyHoursTarget) * 100)),
    },
    {
      title: 'Pending Tasks',
      value: pendingTasksCount,
      unit: 'active items',
      subtitle: 'Coursework & labs',
      icon: CheckCircle2,
      href: '/assignments?status=PENDING',
      actionText: 'Review items',
      color: 'emerald',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      accentGlow: 'before:bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-400" />
          Today's Overview
        </h2>
        <span className="text-xs text-slate-500">Live Academic Activity</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              hoverEffect
              glow
              className={`p-5 flex flex-col justify-between ${item.accentGlow}`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">{item.title}</span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${item.badgeBg}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{item.unit}</span>
                </div>

                <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>

                {item.progress !== undefined && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <Link
                  href={item.href}
                  className="flex items-center justify-between text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors group"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-indigo-400" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
