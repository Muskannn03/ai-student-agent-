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
    <Card className="border border-[#EDE1D3] bg-gradient-to-br from-white via-[#FAF5EE] to-[#FBECEF] p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#2A1B1E] flex items-center gap-2">
              AI Student Agent Co-Pilot
              <span className="rounded-full bg-[#FBECEF] px-2 py-0.5 text-[10px] font-semibold text-[#800020] border border-[#F8CCD2]">
                {process.env.NEXT_PUBLIC_AI_PROVIDER === 'openai' ? 'GPT-4o Ready' : 'Llama 3.2 Ready'}
              </span>
            </h3>
            <p className="text-xs text-[#786568]">
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
          className="w-full rounded-2xl border border-[#EDE1D3] bg-white px-4 py-3.5 pr-28 text-sm text-[#2A1B1E] placeholder:text-[#9E8B8E] focus:border-[#800020] focus:outline-none focus:ring-2 focus:ring-[#800020]/20 transition-all shadow-xs"
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
        <span className="text-[11px] font-medium text-[#786568] flex items-center gap-1 mr-1">
          <Lightbulb className="h-3 w-3 text-[#D45060]" />
          Try asking:
        </span>
        {quickPrompts.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectQuickPrompt(item.query)}
              className="group flex items-center gap-1.5 rounded-xl border border-[#EDE1D3] bg-white px-3 py-1.5 text-xs text-[#5C4549] hover:border-[#D45060]/40 hover:bg-[#FAF5EE] hover:text-[#800020] transition-all cursor-pointer shadow-2xs"
            >
              <Icon className="h-3 w-3 text-[#800020] group-hover:text-[#6A001B] transition-colors" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
