'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Search, CheckSquare, Calendar, User, BookOpen } from 'lucide-react';

interface LoadingIndicatorProps {
  status?: string;
  queryHint?: string;
}

const DEFAULT_STATUS_STEPS = [
  { text: 'Thinking...', icon: Sparkles },
  { text: 'Searching your notes...', icon: Search },
  { text: 'Checking your assignments...', icon: CheckSquare },
  { text: 'Building your study plan...', icon: Calendar },
];

function getIconForStatus(statusText: string) {
  const lower = statusText.toLowerCase();
  if (lower.includes('note') || lower.includes('document')) return Search;
  if (lower.includes('assignment')) return CheckSquare;
  if (lower.includes('deadline')) return Calendar;
  if (lower.includes('profile')) return User;
  if (lower.includes('study plan') || lower.includes('schedule')) return Sparkles;
  if (lower.includes('synthesizing')) return Sparkles;
  return Sparkles;
}

export function LoadingIndicator({ status, queryHint }: LoadingIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // If queryHint is provided and no explicit status, determine an intelligent starting indicator
  useEffect(() => {
    if (!status && queryHint) {
      const lower = queryHint.toLowerCase();
      if (lower.includes('note') || lower.includes('chp') || lower.includes('document')) {
        setCurrentStepIndex(1); // Searching your notes...
      } else if (lower.includes('assignment') || lower.includes('deadline') || lower.includes('due') || lower.includes('homework')) {
        setCurrentStepIndex(2); // Checking assignments...
      } else if (lower.includes('study plan') || lower.includes('schedule') || lower.includes('revision')) {
        setCurrentStepIndex(3); // Building study plan...
      } else {
        setCurrentStepIndex(0); // Thinking...
      }
    }
  }, [queryHint, status]);

  // Subtle step progression while waiting if no explicit status is streamed
  useEffect(() => {
    if (status) return; // explicit status takes precedence
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % DEFAULT_STATUS_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [status]);

  const activeStatus = status || DEFAULT_STATUS_STEPS[currentStepIndex].text;
  const ActiveIcon = status ? getIconForStatus(status) : (DEFAULT_STATUS_STEPS[currentStepIndex]?.icon || Sparkles);

  return (
    <div className="flex items-start gap-3.5 max-w-3xl animate-in fade-in duration-300">
      {/* Assistant Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
        <Bot className="h-5 w-5" />
      </div>

      {/* Bubble with Shimmer and Status Indicator */}
      <div className="rounded-2xl rounded-tl-sm border border-slate-800/80 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <ActiveIcon className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300 transition-all duration-300">
            {activeStatus}
          </span>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
