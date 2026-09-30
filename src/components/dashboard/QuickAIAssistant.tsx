'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Send, Lightbulb, BookOpen, Calendar, HelpCircle } from 'lucide-react';

export function QuickAIAssistant() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  const quickPrompts = [
    { label: 'Summarize Algorithms Note', query: 'Can you summarize my latest CS301 notes on Bellman-Ford vs Dijkstra?', icon: BookOpen },
    { label: 'Break Down AI Report', query: 'Help me break down my Deep Learning CNN benchmark assignment into 4 daily tasks.', icon: Calendar },
    { label: 'Explain SVD Matrix', query: 'Explain Singular Value Decomposition (SVD) in linear algebra with an intuitive example.', icon: HelpCircle },
    { label: 'Plan My Study Week', query: 'Create an optimized study plan for this week prioritizing my urgent assignments.', icon: Lightbulb },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    router.push(`/chat?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleSelectQuickPrompt = (query: string) => {
    router.push(`/chat?prompt=${encodeURIComponent(query)}`);
  };

  return (
    <Card glow className="border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/30 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              AI Student Agent Co-Pilot
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                {process.env.NEXT_PUBLIC_AI_PROVIDER === 'openai' ? 'GPT-4o Ready' : 'Llama 3.2 Ready'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Ask any academic question, request exam revisions, or generate custom study plans.
            </p>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question, paste an assignment problem, or ask for study advice..."
          className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3.5 pr-28 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!prompt.trim()}
          className="absolute right-2 px-3.5"
        >
          <span>Ask</span>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>

      {/* Quick Prompt Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mr-1">
          <Lightbulb className="h-3 w-3 text-amber-400" />
          Try asking:
        </span>
        {quickPrompts.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectQuickPrompt(item.query)}
              className="group flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white transition-all cursor-pointer"
            >
              <Icon className="h-3 w-3 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
