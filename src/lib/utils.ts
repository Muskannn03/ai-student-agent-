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
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeStr: string): string {
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
      return { bg: 'bg-[#FDF2F3]', text: 'text-[#A62B3A]', border: 'border-[#F8CCD2]', dot: 'bg-[#D45060]' };
    case 'HIGH':
      return { bg: 'bg-[#FDF6ED]', text: 'text-[#8C6228]', border: 'border-[#F4E3C8]', dot: 'bg-[#C99042]' };
    case 'MEDIUM':
      return { bg: 'bg-[#FBECEF]', text: 'text-[#800020]', border: 'border-[#F4CDD5]', dot: 'bg-[#800020]' };
    case 'LOW':
    default:
      return { bg: 'bg-[#F5ECE1]', text: 'text-[#63493E]', border: 'border-[#E5D7C6]', dot: 'bg-[#9C7F72]' };
  }
}

export function getStatusColor(status: Status): { bg: string; text: string; border: string } {
  switch (status) {
    case 'COMPLETED':
      return { bg: 'bg-[#EAF2ED]', text: 'text-[#2F6144]', border: 'border-[#CCE0D4]' };
    case 'IN_PROGRESS':
      return { bg: 'bg-[#FBECEF]', text: 'text-[#800020]', border: 'border-[#F4CDD5]' };
    case 'PENDING':
    default:
      return { bg: 'bg-[#F5ECE1]', text: 'text-[#63493E]', border: 'border-[#E5D7C6]' };
  }
}
