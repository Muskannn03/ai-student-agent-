'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, CalendarPlus, Upload, PlusCircle, ArrowUpRight } from 'lucide-react';

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
      icon: Sparkles,
      iconBg: 'bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]',
    },
    {
      id: 'create-plan',
      label: 'Create Study Plan',
      description: 'Generate weekly exam revision sprint',
      href: '/study-plan',
      icon: CalendarPlus,
      iconBg: 'bg-[#F5ECE1] text-[#800020] border border-[#E8D9C8]',
    },
    {
      id: 'upload-notes',
      label: 'Upload Notes',
      description: 'Synthesize & extract active recall notes',
      href: '/notes',
      onClick: onOpenUploadNotesModal,
      icon: Upload,
      iconBg: 'bg-[#FAF5EE] text-[#5C4549] border border-[#EDE1D3]',
    },
    {
      id: 'add-assignment',
      label: 'Add Assignment',
      description: 'Track due dates & priority coursework',
      href: '/assignments',
      onClick: onOpenAddAssignmentModal,
      icon: PlusCircle,
      iconBg: 'bg-[#FDF2F3] text-[#D45060] border border-[#F8CCD2]',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#786568]">
          Quick Actions
        </h2>
        <span className="text-xs text-[#9E8B8E]">Academic Workflows</span>
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
                className="group flex items-start gap-3.5 rounded-2xl border border-[#EDE1D3] bg-white p-4 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D45060]/40 hover:bg-[#FAF5EE]/30 hover:shadow-xs cursor-pointer"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${act.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#2A1B1E] group-hover:text-[#800020] transition-colors">
                      {act.label}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#9E8B8E] group-hover:text-[#800020] transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="mt-1 text-xs text-[#786568] line-clamp-2 leading-relaxed">
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
              className="group flex items-start gap-3.5 rounded-2xl border border-[#EDE1D3] bg-white p-4 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D45060]/40 hover:bg-[#FAF5EE]/30 hover:shadow-xs"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${act.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#2A1B1E] group-hover:text-[#800020] transition-colors">
                    {act.label}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#9E8B8E] group-hover:text-[#800020] transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-1 text-xs text-[#786568] line-clamp-2 leading-relaxed">
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
