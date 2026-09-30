'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockStudyPlan } from '@/lib/mock-data';
import { StudyPlanTask } from '@/types';
import {
  CalendarRange,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Zap,
} from 'lucide-react';

export default function StudyPlanPage() {
  const [tasks, setTasks] = useState<StudyPlanTask[]>(mockStudyPlan.tasks);
  const [completedHours, setCompletedHours] = useState(mockStudyPlan.completedHours);
  const targetHours = mockStudyPlan.targetHours;

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = !t.isCompleted;
          // adjust hours
          const diff = (t.durationMinutes / 60) * (newStatus ? 1 : -1);
          setCompletedHours((h) => Math.max(0, Math.round((h + diff) * 10) / 10));
          return { ...t, isCompleted: newStatus };
        }
        return t;
      })
    );
  };

  const percentage = Math.min(100, Math.round((completedHours / targetHours) * 100));

  return (
    <AppShell
      title="Study Plan & Exam Sprints"
      subtitle="Structured time allocation, milestone tracking, and AI-optimized study schedules"
    >
      <div className="space-y-6">
        {/* Banner with Progress Overview */}
        <Card glow className="border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="purple" dot>
                  Active Sprint
                </Badge>
                <span className="text-xs text-slate-400">Week 6 Midterm Revision</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{mockStudyPlan.title}</h2>
              <p className="text-sm text-slate-400 max-w-xl">{mockStudyPlan.description}</p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <div>
                <p className="text-xs text-slate-400">Weekly Progress</p>
                <p className="text-2xl font-bold text-indigo-400">{percentage}%</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <p className="text-xs text-slate-400">Logged Hours</p>
                <p className="text-2xl font-bold text-white">
                  {completedHours} <span className="text-xs font-normal text-slate-500">/ {targetHours}h</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-indigo-400" />
                  <CardTitle>Sprint Milestones & Active Recall Tasks</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newTask: StudyPlanTask = {
                      id: `spt_${Date.now()}`,
                      title: 'New Study Session (Draft)',
                      durationMinutes: 45,
                      isCompleted: false,
                    };
                    setTasks((prev) => [...prev, newTask]);
                  }}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Task
                </Button>
              </CardHeader>

              {tasks.length === 0 ? (
                <EmptyState
                  icon={CalendarRange}
                  title="No study tasks in this sprint"
                  description="Add tasks manually or ask the AI Student Agent to synthesize a plan from your syllabus."
                />
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        task.isCompleted
                          ? 'border-slate-800/40 bg-slate-900/20 text-slate-500'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {task.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-500 hover:text-indigo-400 shrink-0 transition-colors" />
                        )}
                        <span className={`text-sm font-medium ${task.isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
                          <Clock className="h-3 w-3" />
                          {task.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* AI Optimization Card (Modular Placeholder) */}
          <div className="space-y-6">
            <Card glow className="border-indigo-500/20 bg-slate-900/70 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-sm text-white">AI Study Plan Optimizer</h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your syllabus and calendar. In future iterations, the AI Student Agent will automatically calibrate workload based on assignment due dates and past quiz performance.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Spaced Repetition</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">Enabled</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Pomodoro Intervals</span>
                  <span className="text-slate-200 font-semibold text-[11px]">50m work / 10m rest</span>
                </div>
              </div>

              <div className="mt-5">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => {
                    window.location.href = '/chat?prompt=' + encodeURIComponent('Optimize my study schedule for upcoming CS301 and AI402 midterms');
                  }}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Ask AI to Optimize Schedule
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <CardTitle className="text-sm">Study Recommendations</CardTitle>
              <CardDescription className="text-xs mt-1">Based on upcoming exam deadlines</CardDescription>

              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  Prioritize <strong>Bellman-Ford proofs</strong> for CS301 before Tuesday lecture.
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                  Reserve 90 minutes for <strong>CNN training epochs</strong> in Ada Lovelace Lab.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
