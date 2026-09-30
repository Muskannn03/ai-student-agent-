'use client';

import React from 'react';
import Link from 'next/link';
import { StudyPlan, SubjectProgress } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { CalendarRange, ArrowRight, CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
import { mockSubjectProgress } from '@/lib/mock-data';

interface StudyProgressProps {
  studyPlan: StudyPlan;
  subjectProgress?: SubjectProgress[];
  onToggleTask?: (taskId: string) => void;
}

export function StudyProgress({
  studyPlan,
  subjectProgress = mockSubjectProgress,
  onToggleTask,
}: StudyProgressProps) {
  const overallPercentage = Math.min(
    100,
    Math.round((studyPlan.completedHours / studyPlan.targetHours) * 100)
  );

  return (
    <Card className="flex flex-col h-full space-y-6">
      <CardHeader className="mb-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">Study Progress & Sprints</CardTitle>
            <p className="text-xs text-slate-400">Weekly goals and subject calibration</p>
          </div>
        </div>

        <Link
          href="/study-plan"
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Full plan <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      {/* 1. Overall Weekly Study Hours & Completion Percentage */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white">Weekly Study Hours</span>
          </div>
          <span className="font-mono text-indigo-400 font-bold text-sm">
            {overallPercentage}% Complete
          </span>
        </div>

        {/* Primary gradient progress bar */}
        <div className="h-3 w-full rounded-full bg-slate-800/90 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-700 shadow-sm"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>
            <strong className="text-white font-bold">{studyPlan.completedHours}h</strong> logged
          </span>
          <span>
            Target: <strong className="text-slate-300">{studyPlan.targetHours}h</strong> / week
          </span>
        </div>
      </div>

      {/* 2. Subject-wise Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Subject-Wise Progress
          </span>
          <span className="text-[11px] text-slate-500">Current Sprint</span>
        </div>

        <div className="space-y-2.5">
          {subjectProgress.map((sub) => (
            <div
              key={sub.courseCode}
              className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 space-y-1.5 hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: sub.colorHex }}
                  />
                  <span className="font-semibold text-slate-200 truncate">{sub.subjectName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({sub.courseCode})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                  <span className="text-slate-400">{sub.hoursSpent}h</span>
                  <span className="font-bold text-white">{sub.completionPercentage}%</span>
                </div>
              </div>

              {/* Progress bar per subject */}
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sub.completionPercentage}%`,
                    backgroundColor: sub.colorHex,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sprint Tasks Checklist */}
      {studyPlan.tasks && studyPlan.tasks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Sprint Tasks</span>
            <span className="text-[10px] text-slate-500 font-normal">Click to toggle</span>
          </div>

          <div className="space-y-1.5">
            {studyPlan.tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask && onToggleTask(task.id)}
                className={`flex items-center gap-2.5 rounded-xl p-2.5 text-xs transition-all cursor-pointer ${
                  task.isCompleted
                    ? 'bg-slate-950/40 text-slate-500 border border-slate-900'
                    : 'bg-slate-900/60 text-slate-200 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-500 hover:text-indigo-400 shrink-0 transition-colors" />
                )}
                <span className={`flex-1 truncate ${task.isCompleted ? 'line-through text-slate-500' : ''}`}>
                  {task.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {task.durationMinutes}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
