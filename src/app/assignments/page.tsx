'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { mockAssignments } from '@/lib/mock-data';
import { Assignment, Status } from '@/types';
import { getDaysRemaining, getPriorityColor, formatDate } from '@/lib/utils';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Bot,
  Plus,
  CheckCircle,
  Circle,
  Filter,
} from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assignments${filter !== 'ALL' ? `?status=${filter}` : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAssignments(json.data || mockAssignments);
    } catch (err) {
      console.warn('Assignments fetch failed, using fallback:', err);
      // Fallback
      setAssignments(
        filter === 'ALL'
          ? mockAssignments
          : mockAssignments.filter((a) => a.status === filter)
      );
      setError('Working in offline mode. Showing cached coursework.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toggleStatus = (id: string) => {
    setAssignments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus: Status =
            item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleAskAI = (assignmentTitle: string, course: string) => {
    const prompt = `Help me break down the coursework assignment: "${assignmentTitle}" for ${course}. What are the primary steps, expected deliverables, and how can I test my solution?`;
    window.location.href = `/chat?prompt=${encodeURIComponent(prompt)}`;
  };

  const filterTabs = [
    { label: 'All Tasks', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  return (
    <AppShell
      title="Assignments & Coursework"
      subtitle="Track problem sets, lab reports, team projects, and AI breakdown milestones"
    >
      <div className="space-y-6">
        {error && (
          <ErrorAlert
            title="Notice"
            message={error}
            onRetry={fetchAssignments}
          />
        )}

        {/* Filter Bar & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            <Filter className="h-4 w-4 text-slate-400 ml-2 mr-1" />
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => {
              const newAssignment: Assignment = {
                id: `as_${Date.now()}`,
                title: 'New Problem Set (Draft)',
                description: 'Enter assignment requirements and notes.',
                dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
                priority: 'MEDIUM',
                status: 'PENDING',
                courseCode: 'CS301',
                courseName: 'Algorithms & Complexity',
                totalPoints: 100,
              };
              setAssignments((prev) => [newAssignment, ...prev]);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </Button>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="md" label="Loading coursework..." />
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No assignments found"
            description={
              filter === 'ALL'
                ? 'You currently have no assignments registered.'
                : `There are no ${filter.toLowerCase().replace('_', ' ')} assignments.`
            }
            actionLabel="Reset Filter"
            onAction={() => setFilter('ALL')}
          />
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const deadline = getDaysRemaining(assignment.dueDate);
              const priorityStyle = getPriorityColor(assignment.priority);
              const isCompleted = assignment.status === 'COMPLETED';

              return (
                <Card
                  key={assignment.id}
                  hoverEffect
                  className={`transition-all ${
                    isCompleted ? 'opacity-70 bg-slate-900/30' : 'bg-slate-900/60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Checkbox + Title + Description */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <button
                        onClick={() => toggleStatus(assignment.id)}
                        className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                        aria-label="Toggle completion"
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: `${assignment.colorHex || '#6366f1'}20`,
                              color: assignment.colorHex || '#818cf8',
                              border: `1px solid ${assignment.colorHex || '#6366f1'}40`,
                            }}
                          >
                            {assignment.courseCode}
                          </span>
                          <span className="text-xs text-slate-400">{assignment.courseName}</span>

                          {/* Priority */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                          >
                            {assignment.priority === 'URGENT' && <AlertTriangle className="h-3 w-3" />}
                            {assignment.priority}
                          </span>
                        </div>

                        <h3
                          className={`text-base font-semibold ${
                            isCompleted ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {assignment.title}
                        </h3>

                        {assignment.description && (
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {assignment.description}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                          {assignment.totalPoints && (
                            <span>{assignment.score ? `${assignment.score} / ` : ''}{assignment.totalPoints} pts</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Days remaining + Ask AI Agent button */}
                    <div className="flex items-center gap-2.5 md:self-center shrink-0">
                      <Badge
                        variant={deadline.isOverdue ? 'danger' : deadline.days <= 2 ? 'warning' : 'default'}
                        className="font-mono text-xs"
                      >
                        {deadline.label}
                      </Badge>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAskAI(assignment.title, assignment.courseCode)}
                        className="gap-1.5 text-xs border-indigo-500/30 text-indigo-300 hover:text-white"
                      >
                        <Bot className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Breakdown</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
