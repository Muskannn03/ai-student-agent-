import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Priority, Status } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeStr: string): string {
  // Accepts "14:00" and formats to "2:00 PM"
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function getDaysRemaining(dueDateStr: string): { days: number; isOverdue: boolean; label: string } {
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isOverdue: true, label: `${Math.abs(diffDays)}d overdue` };
  }
  if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'Due today' };
  }
  if (diffDays === 1) {
    return { days: 1, isOverdue: false, label: 'Due tomorrow' };
  }
  return { days: diffDays, isOverdue: false, label: `${diffDays} days left` };
}

export function getPriorityColor(priority: Priority): { bg: string; text: string; border: string; dot: string } {
  switch (priority) {
    case 'URGENT':
      return { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', dot: 'bg-rose-500' };
    case 'HIGH':
      return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', dot: 'bg-amber-500' };
    case 'MEDIUM':
      return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', dot: 'bg-blue-500' };
    case 'LOW':
    default:
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500' };
  }
}

export function getStatusColor(status: Status): { bg: string; text: string; border: string } {
  switch (status) {
    case 'COMPLETED':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' };
    case 'IN_PROGRESS':
      return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
    case 'PENDING':
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
  }
}
