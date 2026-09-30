'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AddAssignmentModal } from '@/components/dashboard/AddAssignmentModal';
import { Assignment, Status } from '@/types';
import { getDaysRemaining, getPriorityColor, formatDate } from '@/lib/utils';
import {
  CheckSquare,
  Clock,
  Sparkles,
  Plus,
  CheckCircle,
  Circle,
  Filter,
  Trash2,
} from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/assignments${filter !== 'ALL' ? `?status=${filter}` : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAssignments(json.data || []);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toggleStatus = async (id: string, currentStatus: Status) => {
    const nextStatus: Status = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    
    // Optimistic UI update
    setAssignments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );

    try {
      await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
    } catch (err) {
      console.error('Error toggling assignment status:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    setAssignments((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/assignments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  const handleAddAssignment = (newAssignment: Assignment) => {
    setAssignments((prev) => [newAssignment, ...prev]);
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
      subtitle="Track problem sets, lab reports, and deadlines"
    >
      <div className="space-y-6">
        {/* Filter Bar & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#EDE1D3] bg-white p-1 shadow-2xs">
            <Filter className="h-4 w-4 text-[#9E8B8E] ml-2 mr-1" />
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  filter === tab.value
                    ? 'bg-[#F3E6D5] text-[#5C0017] font-semibold border border-[#E8D9C8]'
                    : 'text-[#786568] hover:text-[#2A1B1E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </Button>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="p-8 text-center border border-[#EDE1D3] bg-white">
            <EmptyState
              icon={CheckSquare}
              title={filter === 'ALL' ? 'No assignments yet' : `No ${filter.toLowerCase()} assignments`}
              description="Keep your coursework organized. Add assignments, track due dates, and ask AISA to break down complex tasks."
              actionLabel="Create Assignment"
              onAction={() => setIsAddModalOpen(true)}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => {
              const remaining = getDaysRemaining(assignment.dueDate);
              const isUrgent = remaining.days <= 2 && !remaining.isOverdue && assignment.status !== 'COMPLETED';
              const isOverdue = remaining.isOverdue && assignment.status !== 'COMPLETED';

              return (
                <Card
                  key={assignment.id}
                  className={`p-5 flex flex-col justify-between border transition-all ${
                    assignment.status === 'COMPLETED'
                      ? 'border-[#EDE1D3] bg-[#FAF5EE]/50 opacity-80'
                      : isOverdue
                      ? 'border-[#F8CCD2] bg-white shadow-xs'
                      : 'border-[#EDE1D3] bg-white hover:border-[#D45060]/40 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Course Code & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#FAF5EE] text-[#800020] border border-[#EDE1D3]">
                          {assignment.courseCode || 'GEN'}
                        </span>
                        <span className="text-xs text-[#786568] truncate max-w-[140px] sm:max-w-[180px]">
                          {assignment.courseName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={getPriorityColor(assignment.priority) as any}
                          className="text-[10px] uppercase font-semibold"
                        >
                          {assignment.priority}
                        </Badge>
                        <button
                          onClick={(e) => handleDelete(e, assignment.id)}
                          className="h-6 w-6 flex items-center justify-center rounded-lg text-[#9E8B8E] hover:text-[#D45060] hover:bg-[#FDF2F3] transition-colors"
                          title="Delete assignment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3
                        className={`text-sm font-semibold tracking-tight ${
                          assignment.status === 'COMPLETED'
                            ? 'line-through text-[#9E8B8E]'
                            : 'text-[#2A1B1E]'
                        }`}
                      >
                        {assignment.title}
                      </h3>
                      {assignment.description && (
                        <p className="mt-1 text-xs text-[#786568] line-clamp-2 leading-relaxed">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer: Due date & Actions */}
                  <div className="mt-4 pt-3 border-t border-[#EDE1D3] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[#786568]">
                      <Clock className="h-3.5 w-3.5 text-[#9E8B8E]" />
                      <span className={isUrgent ? 'font-semibold text-[#D45060]' : ''}>
                        {formatDate(assignment.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAskAI(assignment.title, assignment.courseName || assignment.courseCode || '')
                        }
                        className="h-7 text-xs text-[#800020] hover:bg-[#FBECEF] gap-1 px-2"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Break Down</span>
                      </Button>

                      <Button
                        variant={assignment.status === 'COMPLETED' ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => toggleStatus(assignment.id, assignment.status)}
                        className="h-7 text-xs gap-1 px-2.5"
                      >
                        {assignment.status === 'COMPLETED' ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-3.5 w-3.5" />
                            <span>Mark Done</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AddAssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddAssignment={handleAddAssignment}
      />
    </AppShell>
  );
}
