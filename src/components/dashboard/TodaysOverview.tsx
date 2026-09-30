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
      subtitle: classesCount > 0 ? `${classesCount} scheduled` : 'No classes today',
      icon: BookOpen,
      href: '/timetable',
      actionText: 'View schedule',
      badgeBg: 'bg-[#F5ECE1] text-[#800020] border-[#E8D9C8]',
    },
    {
      title: 'Assignments Due',
      value: assignmentsDueCount,
      unit: assignmentsDueCount === 1 ? 'due soon' : 'due soon',
      subtitle: assignmentsDueCount > 0 ? 'Requires attention' : 'All clear for now',
      icon: assignmentsDueCount > 0 ? AlertTriangle : CheckCircle2,
      href: '/assignments',
      actionText: 'View tasks',
      badgeBg: assignmentsDueCount > 0
        ? 'bg-[#FDF2F3] text-[#D45060] border-[#F8CCD2]'
        : 'bg-[#FAF5EE] text-[#800020] border-[#EDE1D3]',
    },
    {
      title: 'Today Study Hours',
      value: `${studyHoursLogged}h`,
      unit: `/ ${studyHoursTarget}h target`,
      subtitle: `${Math.round((studyHoursLogged / studyHoursTarget) * 100)}% of daily goal`,
      icon: Clock,
      href: '/study-plan',
      actionText: 'Open planner',
      badgeBg: 'bg-[#FBECEF] text-[#800020] border-[#F8CCD2]',
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
      badgeBg: 'bg-[#FAF5EE] text-[#5C4549] border-[#EDE1D3]',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#786568] flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#800020]" />
          Today's Overview
        </h2>
        <span className="text-xs text-[#9E8B8E]">Academic Activity</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              hoverEffect
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-[#786568]">{item.title}</span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${item.badgeBg}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-[#2A1B1E] tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-xs text-[#786568] font-medium">{item.unit}</span>
                </div>

                <p className="mt-1 text-xs text-[#786568]">{item.subtitle}</p>

                {item.progress !== undefined && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-[#F3E6D5] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#800020] transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#EDE1D3]">
                <Link
                  href={item.href}
                  className="flex items-center justify-between text-xs font-medium text-[#5C4549] hover:text-[#800020] transition-colors group"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 text-[#800020]" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
