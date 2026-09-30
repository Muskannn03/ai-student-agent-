'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Search, CheckSquare, Calendar, Compass } from 'lucide-react';

interface LoadingIndicatorProps {
  status?: string;
  queryHint?: string;
}

const DEFAULT_STATUS_STEPS = [
  { text: 'Thinking...', icon: Sparkles },
  { text: 'Using Search Notes...', icon: Search },
  { text: 'Checking Assignments...', icon: CheckSquare },
  { text: 'Creating Study Plan...', icon: Calendar },
];

export function LoadingIndicator({ status, queryHint }: LoadingIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // If queryHint is provided, determine an intelligent starting indicator
  useEffect(() => {
    if (queryHint) {
      const lower = queryHint.toLowerCase();
      if (lower.includes('note') || lower.includes('chp') || lower.includes('document')) {
        setCurrentStepIndex(1); // Using Search Notes...
      } else if (lower.includes('assignment') || lower.includes('deadline') || lower.includes('due') || lower.includes('homework')) {
        setCurrentStepIndex(2); // Checking Assignments...
      } else if (lower.includes('study plan') || lower.includes('schedule') || lower.includes('revision')) {
        setCurrentStepIndex(3); // Creating Study Plan...
      } else {
        setCurrentStepIndex(0); // Thinking...
      }
    }
  }, [queryHint]);

  // Subtle step progression while waiting for server response
  useEffect(() => {
    if (status) return; // explicit status takes precedence
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % DEFAULT_STATUS_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [status]);

  const activeStatus = status || DEFAULT_STATUS_STEPS[currentStepIndex].text;
  const ActiveIcon = DEFAULT_STATUS_STEPS[currentStepIndex]?.icon || Sparkles;

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
