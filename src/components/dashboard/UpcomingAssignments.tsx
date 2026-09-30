'use client';

import React from 'react';
import Link from 'next/link';
import { Assignment } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDaysRemaining, getPriorityColor, getStatusColor, formatDate, cn } from '@/lib/utils';
import { CheckSquare, ArrowRight, Clock, AlertTriangle, CheckCircle2, Circle, Plus } from 'lucide-react';

interface UpcomingAssignmentsProps {
  assignments: Assignment[];
  onToggleStatus?: (id: string) => void;
  onOpenAddModal?: () => void;
}

export function UpcomingAssignments({
  assignments,
  onToggleStatus,
  onOpenAddModal,
}: UpcomingAssignmentsProps) {
  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-400" />
            Upcoming Assignments
          </CardTitle>
        </CardHeader>
        <EmptyState
          icon={CheckSquare}
          title="All caught up!"
          description="You have no pending assignments right now. Enjoy your free time or prepare ahead."
          actionLabel="Create Assignment"
          onAction={onOpenAddModal || (() => window.location.href = '/assignments')}
        />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <CheckSquare className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">Upcoming Assignments</CardTitle>
            <p className="text-xs text-slate-400">Sorted by urgency and due date</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-indigo-500/60 hover:text-white transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          )}

          <Link
            href="/assignments"
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <div className="space-y-3 flex-1">
        {assignments.slice(0, 4).map((assignment) => {
          const deadline = getDaysRemaining(assignment.dueDate);
          const priorityColor = getPriorityColor(assignment.priority);
          const statusColor = getStatusColor(assignment.status);
          const isCompleted = assignment.status === 'COMPLETED';

          return (
            <div
              key={assignment.id}
              className={cn(
                'group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80',
                isCompleted && 'opacity-60 bg-slate-950/40'
              )}
            >
              {/* Left: Checkbox + Subject & Title + Due Date */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {onToggleStatus ? (
                  <button
                    onClick={() => onToggleStatus(assignment.id)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    aria-label="Toggle completed"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500 group-hover:text-indigo-400" />
                    )}
                  </button>
                ) : (
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {/* Subject badge */}
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
                      style={{
                        backgroundColor: `${assignment.colorHex || '#6366f1'}20`,
                        color: assignment.colorHex || '#818cf8',
                        border: `1px solid ${assignment.colorHex || '#6366f1'}40`,
                      }}
                    >
                      {assignment.courseCode}
                    </span>
                    <span className="text-xs text-slate-400 truncate">{assignment.courseName}</span>

                    {/* Status Pill */}
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-semibold border',
                        statusColor.bg,
                        statusColor.text,
                        statusColor.border
                      )}
                    >
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4
                    className={cn(
                      'text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate',
                      isCompleted && 'line-through text-slate-500'
                    )}
                  >
                    {assignment.title}
                  </h4>

                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-slate-500" />
                      Due {formatDate(assignment.dueDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Urgency and Priority */}
              <div className="flex items-center gap-2 sm:self-center shrink-0 pl-8 sm:pl-0">
                {/* Priority Badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border',
                    priorityColor.bg,
                    priorityColor.text,
                    priorityColor.border
                  )}
                >
                  {assignment.priority === 'URGENT' && <AlertTriangle className="h-3 w-3" />}
                  {assignment.priority}
                </span>

                {/* Days remaining tag */}
                <Badge
                  variant={deadline.isOverdue ? 'danger' : deadline.days <= 2 ? 'warning' : 'default'}
                  className="font-mono text-xs"
                >
                  {deadline.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
