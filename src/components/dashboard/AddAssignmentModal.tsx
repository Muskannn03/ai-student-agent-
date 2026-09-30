'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Plus, Calendar, AlertTriangle, BookOpen } from 'lucide-react';
import { Assignment, Priority } from '@/types';

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAssignment: (assignment: Assignment) => void;
}

export function AddAssignmentModal({
  isOpen,
  onClose,
  onAddAssignment,
}: AddAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('CS301');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const newAssignment: Assignment = {
      id: `as_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      subject: subject,
      courseCode: subject,
      courseName:
        subject === 'CS301'
          ? 'Algorithms & Complexity'
          : subject === 'AI402'
          ? 'Deep Learning & Neural Nets'
          : subject === 'DS205'
          ? 'Database Systems & SQL'
          : 'Linear Algebra & Optimization',
      dueDate: new Date(dueDate).toISOString(),
      priority,
      status: 'PENDING',
      colorHex:
        subject === 'CS301'
          ? '#6366f1'
          : subject === 'AI402'
          ? '#ec4899'
          : subject === 'DS205'
          ? '#14b8a6'
          : '#f59e0b',
      totalPoints: 100,
    };

    // Attempt to persist to API if available
    try {
      await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAssignment.title,
          description: newAssignment.description,
          subject: newAssignment.courseName,
          dueDate: newAssignment.dueDate,
          priority: newAssignment.priority,
        }),
      });
    } catch (err) {
      console.warn('Could not post to /api/assignments, using optimistic update:', err);
    }

    onAddAssignment(newAssignment);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add New Assignment</h3>
              <p className="text-xs text-slate-400">Track tasks, due dates, and priority</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white bg-slate-800/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dynamic Programming Problem Set 3"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                Course / Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="CS301">CS301 - Algorithms & Complexity</option>
                <option value="AI402">AI402 - Deep Learning & Neural Nets</option>
                <option value="DS205">DS205 - Database Systems & SQL</option>
                <option value="MATH210">MATH210 - Linear Algebra</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="URGENT">Urgent (Due 24-48h)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key proofs, repository links, or requirements..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!title.trim()}>
              Save Assignment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
