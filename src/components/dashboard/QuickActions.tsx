'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, CalendarPlus, Upload, PlusCircle, ArrowUpRight } from 'lucide-react';

interface QuickActionsProps {
  onOpenAddAssignmentModal?: () => void;
  onOpenUploadNotesModal?: () => void;
}

export function QuickActions({
  onOpenAddAssignmentModal,
  onOpenUploadNotesModal,
}: QuickActionsProps) {
  const actions = [
    {
      id: 'ask-ai',
      label: 'Ask AI Agent',
      description: 'Get step-by-step tutoring & explanations',
      href: '/chat',
      icon: Bot,
      color: 'indigo',
      borderStyle: 'border-indigo-500/30 hover:border-indigo-500/60',
      bgGradient: 'from-indigo-600/20 via-indigo-950/20 to-slate-900/60',
      iconBg: 'bg-indigo-500/20 text-indigo-300',
    },
    {
      id: 'create-plan',
      label: 'Create Study Plan',
      description: 'Generate weekly exam revision sprint',
      href: '/study-plan',
      icon: CalendarPlus,
      color: 'violet',
      borderStyle: 'border-violet-500/30 hover:border-violet-500/60',
      bgGradient: 'from-violet-600/20 via-violet-950/20 to-slate-900/60',
      iconBg: 'bg-violet-500/20 text-violet-300',
    },
    {
      id: 'upload-notes',
      label: 'Upload Notes',
      description: 'Synthesize & extract active recall notes',
      href: '/notes',
      onClick: onOpenUploadNotesModal,
      icon: Upload,
      color: 'teal',
      borderStyle: 'border-teal-500/30 hover:border-teal-500/60',
      bgGradient: 'from-teal-600/20 via-teal-950/20 to-slate-900/60',
      iconBg: 'bg-teal-500/20 text-teal-300',
    },
    {
      id: 'add-assignment',
      label: 'Add Assignment',
      description: 'Track due dates & priority coursework',
      href: '/assignments',
      onClick: onOpenAddAssignmentModal,
      icon: PlusCircle,
      color: 'amber',
      borderStyle: 'border-amber-500/30 hover:border-amber-500/60',
      bgGradient: 'from-amber-600/20 via-amber-950/20 to-slate-900/60',
      iconBg: 'bg-amber-500/20 text-amber-300',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <span className="text-xs text-slate-500">Fast Academic Workflows</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {actions.map((act) => {
          const Icon = act.icon;

          if (act.onClick) {
            return (
              <button
                key={act.id}
                onClick={act.onClick}
                type="button"
                className={`group flex items-start gap-3.5 rounded-2xl border bg-gradient-to-br p-4 text-left backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${act.borderStyle} ${act.bgGradient}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${act.iconBg} shadow-inner`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {act.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </button>
            );
          }

          return (
            <Link
              key={act.id}
              href={act.href}
              className={`group flex items-start gap-3.5 rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${act.borderStyle} ${act.bgGradient}`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${act.iconBg} shadow-inner`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                    {act.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
