'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, MessageSquare, ArrowRight, Lightbulb, Compass, Code, Brain } from 'lucide-react';

export function AIAssistantCard() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const studySuggestions = [
    {
      label: 'Bellman-Ford vs Dijkstra',
      prompt: 'Can you explain the exact differences between Bellman-Ford and Dijkstra algorithms, including time complexity and negative cycle detection?',
      icon: Code,
    },
    {
      label: 'Break Down CNN Assignment',
      prompt: 'Help me break down my Deep Learning CNN benchmark assignment into 4 daily milestones with test goals.',
      icon: Compass,
    },
    {
      label: 'Quiz on SQL Normalization',
      prompt: 'Quiz me with 3 practice questions on 3NF and BCNF database normalization rules.',
      icon: Brain,
    },
    {
      label: 'Optimize My Revision Sprint',
      prompt: 'Generate an optimized 3-day revision sprint for my upcoming CS301 algorithms exam.',
      icon: Lightbulb,
    },
  ];

  const handleStartChat = (customPrompt?: string) => {
    const text = customPrompt || query.trim();
    if (text) {
      router.push(`/chat?prompt=${encodeURIComponent(text)}`);
    } else {
      router.push('/chat');
    }
  };

  return (
    <Card
      glow
      className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 md:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Headline & AI Agent Badge */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              Academic Agent Co-Pilot
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            What do you want to study today?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Get step-by-step conceptual breakdowns, active recall quizzes, and project milestones tailored to your enrolled coursework.
          </p>
        </div>

        {/* Right: Open Chat Direct Button */}
        <div className="shrink-0">
          <Button
            size="lg"
            onClick={() => handleStartChat()}
            className="w-full sm:w-auto gap-2 shadow-xl shadow-indigo-500/20 px-6"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            <span>Open AI Chat Tutor</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStartChat();
        }}
        className="mt-6 relative flex items-center"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question, enter a topic, or describe an assignment problem..."
          className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4.5 py-3.5 pr-32 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-2 px-4 gap-1.5"
        >
          <span>Ask AI</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </form>

      {/* Suggestion Chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <Lightbulb className="h-3 w-3 text-amber-400" />
          Suggested:
        </span>

        {studySuggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleStartChat(item.prompt)}
              className="group flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all cursor-pointer"
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
