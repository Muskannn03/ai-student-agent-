'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudyPlanTask } from '@/types';
import {
  CalendarRange,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Zap,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'aisa_study_plan_tasks';

export default function StudyPlanPage() {
  const [tasks, setTasks] = useState<StudyPlanTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('45');
  const [isAdding, setIsAdding] = useState(false);
  const [completedHours, setCompletedHours] = useState(0);
  const targetHours = 12;

  // Load user's saved tasks from localStorage or populate from real assignments
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
          const doneHours = parsed
            .filter((t: StudyPlanTask) => t.isCompleted)
            .reduce((sum: number, t: StudyPlanTask) => sum + (t.durationMinutes || 0) / 60, 0);
          setCompletedHours(Math.round(doneHours * 10) / 10);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Otherwise fetch active assignments to seed real tasks
    async function loadFromAssignments() {
      try {
        const res = await fetch('/api/assignments?status=PENDING');
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const generated: StudyPlanTask[] = json.data.slice(0, 4).map((a: any) => ({
            id: `task_${a.id}`,
            title: `Work on: ${a.title}`,
            durationMinutes: 45,
            isCompleted: false,
          }));
          setTasks(generated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(generated));
        } else {
          setTasks([]);
        }
      } catch {
        setTasks([]);
      }
    }
    loadFromAssignments();
  }, []);

  const saveTasks = (updated: StudyPlanTask[]) => {
    setTasks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const doneHours = updated
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + (t.durationMinutes || 0) / 60, 0);
    setCompletedHours(Math.round(doneHours * 10) / 10);
  };

  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    saveTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudyPlanTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      durationMinutes: Number(newTaskDuration) || 45,
      isCompleted: false,
    };

    saveTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleDeleteTask = (taskId: string) => {
    saveTasks(tasks.filter((t) => t.id !== taskId));
  };

  const percentage = Math.min(100, Math.round((completedHours / targetHours) * 100));

  return (
    <AppShell
      title="Study Plan & Sprints"
      subtitle="Organize study blocks, review sessions, and daily focus milestones"
    >
      <div className="space-y-6">
        {/* Banner with Progress Overview */}
        <Card className="border border-[#EDE1D3] bg-gradient-to-r from-white via-[#FAF5EE] to-[#FBECEF] p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="burgundy" dot>
                  Active Sprint
                </Badge>
                <span className="text-xs text-[#786568]">Self-Paced Focus</span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-[#2A1B1E]">
                Personalized Study Schedule
              </h2>
              <p className="text-sm text-[#786568] max-w-xl">
                Add your own study items, check off completed milestones, or ask AISA to optimize your schedule.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 bg-white border border-[#EDE1D3] p-4 rounded-2xl shadow-2xs">
              <div>
                <p className="text-xs text-[#786568]">Weekly Progress</p>
                <p className="text-2xl font-bold text-[#800020]">{percentage}%</p>
              </div>
              <div className="h-8 w-px bg-[#EDE1D3]" />
              <div>
                <p className="text-xs text-[#786568]">Completed Hours</p>
                <p className="text-2xl font-bold text-[#2A1B1E]">
                  {completedHours} <span className="text-xs font-normal text-[#9E8B8E]">/ {targetHours}h</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2.5 w-full rounded-full bg-[#F3E6D5] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#800020] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#EDE1D3]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
                    <CalendarRange className="h-4.5 w-4.5" />
                  </div>
                  <CardTitle className="text-base">Sprint Tasks & Focus Sessions</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAdding(!isAdding)}
                  className="gap-1 text-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isAdding ? 'Cancel' : 'Add Task'}</span>
                </Button>
              </div>

              {/* Add Task Inline Form */}
              {isAdding && (
                <form
                  onSubmit={handleAddTask}
                  className="mt-4 p-4 rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE] space-y-3"
                >
                  <h4 className="text-xs font-semibold text-[#2A1B1E]">New Study Task</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Read Chapter 4 or Review lecture notes"
                      className="sm:col-span-3 rounded-xl border border-[#EDE1D3] bg-white px-3 py-2 text-xs text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none"
                    />
                    <select
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(e.target.value)}
                      className="rounded-xl border border-[#EDE1D3] bg-white px-2.5 py-2 text-xs text-[#2A1B1E] focus:border-[#800020] focus:outline-none cursor-pointer"
                    >
                      <option value="25">25 mins</option>
                      <option value="45">45 mins</option>
                      <option value="60">60 mins</option>
                      <option value="90">90 mins</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAdding(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs">
                      Save Task
                    </Button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              <div className="mt-4">
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={CalendarRange}
                    title="No study tasks in this sprint"
                    description="Add your own study tasks above or ask AISA to generate a customized revision schedule."
                    actionLabel="Add First Task"
                    onAction={() => setIsAdding(true)}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                          task.isCompleted
                            ? 'border-[#EDE1D3] bg-[#FAF5EE]/70 text-[#9E8B8E]'
                            : 'border-[#EDE1D3] bg-white hover:border-[#D45060]/40 text-[#2A1B1E] shadow-2xs'
                        }`}
                      >
                        <div
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-[#800020] shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#9E8B8E] hover:text-[#800020] shrink-0 transition-colors" />
                          )}
                          <span
                            className={`text-xs sm:text-sm font-medium truncate ${
                              task.isCompleted ? 'line-through text-[#9E8B8E]' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 rounded-lg bg-[#FBECEF] px-2 py-0.5 text-xs text-[#800020] font-mono border border-[#F8CCD2]">
                            <Clock className="h-3 w-3" />
                            {task.durationMinutes}m
                          </span>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-6 w-6 flex items-center justify-center rounded-lg text-[#9E8B8E] hover:text-[#D45060] hover:bg-[#FDF2F3] transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* AI Study Optimizer Card */}
          <div className="space-y-6">
            <Card className="border border-[#EDE1D3] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-sm text-[#2A1B1E]">AI Study Plan Optimizer</h4>
              </div>

              <p className="text-xs text-[#786568] leading-relaxed">
                AISA can automatically synthesize study sessions calibrated to your upcoming assignment due dates and personal study pace.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE] border border-[#EDE1D3]">
                  <span className="text-[#786568]">Spaced Repetition</span>
                  <span className="text-[#800020] font-semibold text-[11px]">Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE] border border-[#EDE1D3]">
                  <span className="text-[#786568]">Pomodoro Intervals</span>
                  <span className="text-[#2A1B1E] font-semibold text-[11px]">45m study / 10m rest</span>
                </div>
              </div>

              <div className="mt-5">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => {
                    window.location.href =
                      '/chat?prompt=' +
                      encodeURIComponent('Create a personalized 7-day study plan prioritizing my upcoming assignments.');
                  }}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Ask AISA to Generate Plan
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
