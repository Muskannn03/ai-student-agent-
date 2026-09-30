'use client';

import React from 'react';
import Link from 'next/link';
import { StudyPlan, SubjectProgress } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowRight, CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
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
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">Study Progress & Sprints</CardTitle>
            <p className="text-xs text-[#786568]">Weekly goals and calibration</p>
          </div>
        </div>

        <Link
          href="/study-plan"
          className="flex items-center gap-1 text-xs font-medium text-[#5C4549] hover:text-[#800020] transition-colors"
        >
          Full plan <ArrowRight className="h-3.5 w-3.5 text-[#800020]" />
        </Link>
      </CardHeader>

      {/* 1. Overall Weekly Study Hours & Completion Percentage */}
      <div className="rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE]/50 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#800020]" />
            <span className="font-semibold text-[#2A1B1E]">Weekly Study Hours</span>
          </div>
          <span className="font-mono text-[#800020] font-semibold text-sm">
            {overallPercentage}% Complete
          </span>
        </div>

        {/* Primary calm progress bar */}
        <div className="h-2.5 w-full rounded-full bg-[#F3E6D5] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#800020] transition-all duration-700"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#786568] font-medium">
          <span>
            <strong className="text-[#2A1B1E] font-semibold">{studyPlan.completedHours}h</strong> logged
          </span>
          <span>
            Target: <strong className="text-[#2A1B1E]">{studyPlan.targetHours}h</strong> / week
          </span>
        </div>
      </div>

      {/* 2. Subject-wise Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#786568]">
            Subject-Wise Progress
          </span>
          <span className="text-[11px] text-[#9E8B8E]">Current Sprint</span>
        </div>

        <div className="space-y-2.5">
          {subjectProgress.map((sub) => (
            <div
              key={sub.courseCode}
              className="rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE]/30 p-3 space-y-1.5 hover:border-[#D45060]/40 hover:bg-white transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0 bg-[#800020]"
                  />
                  <span className="font-semibold text-[#2A1B1E] truncate">{sub.subjectName}</span>
                  <span className="text-[10px] text-[#9E8B8E] font-mono">({sub.courseCode})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                  <span className="text-[#786568]">{sub.hoursSpent}h</span>
                  <span className="font-semibold text-[#2A1B1E]">{sub.completionPercentage}%</span>
                </div>
              </div>

              {/* Progress bar per subject */}
              <div className="h-1.5 w-full rounded-full bg-[#F3E6D5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#800020] transition-all duration-500"
                  style={{ width: `${sub.completionPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sprint Tasks Checklist */}
      {studyPlan.tasks && studyPlan.tasks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#EDE1D3]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786568] uppercase tracking-wider">
            <span>Sprint Tasks</span>
            <span className="text-[10px] text-[#9E8B8E] font-normal">Click to toggle</span>
          </div>

          <div className="space-y-1.5">
            {studyPlan.tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask && onToggleTask(task.id)}
                className={`flex items-center gap-2.5 rounded-xl p-2.5 text-xs transition-all cursor-pointer border ${
                  task.isCompleted
                    ? 'bg-[#FAF5EE] text-[#9E8B8E] border-[#EDE1D3]'
                    : 'bg-[#FAF5EE]/40 text-[#2A1B1E] border-[#EDE1D3] hover:border-[#D45060]/40 hover:bg-white'
                }`}
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-[#800020] shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-[#9E8B8E] hover:text-[#800020] shrink-0 transition-colors" />
                )}
                <span className={`flex-1 truncate ${task.isCompleted ? 'line-through text-[#9E8B8E]' : ''}`}>
                  {task.title}
                </span>
                <span className="text-[10px] text-[#9E8B8E] font-mono shrink-0">
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
