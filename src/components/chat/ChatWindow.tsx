'use client';

import React, { useEffect, useRef } from 'react';
import {
  Bot,
  Menu,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  Code2,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { MessageBubble, MessageItem } from './MessageBubble';
import { LoadingIndicator } from './LoadingIndicator';
import { ChatInput } from './ChatInput';
import { Badge } from '@/components/ui/Badge';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

interface ChatWindowProps {
  messages: MessageItem[];
  isLoading: boolean;
  error: string | null;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (overrideText?: string) => void;
  onClearError?: () => void;
  onOpenMobileSidebar?: () => void;
  conversationTitle?: string;
  onResetConversation?: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: BookOpen,
    title: 'Explain Complex Concept',
    description: 'Compare Dijkstra vs. Bellman-Ford shortest path algorithms with code examples',
    prompt: 'Can you compare Dijkstra vs Bellman-Ford shortest path algorithms, explaining their time complexity and handling of negative weights?',
  },
  {
    icon: Calendar,
    title: 'Create Study Schedule',
    description: 'Generate a 3-day exam revision plan for Database Systems & SQL normalization',
    prompt: 'Help me build an intensive 3-day exam study schedule for Database Systems covering BCNF, 3NF, indexing, and ACID transactions.',
  },
  {
    icon: Code2,
    title: 'Debug & Code Assistance',
    description: 'Diagnose runtime bugs or PyTorch tensor shape mismatch issues',
    prompt: 'I am getting a runtime error with a PyTorch tensor mismatch during forward pass. How should I inspect and reshape my tensors?',
  },
  {
    icon: ListTodo,
    title: 'Break Down Assignment',
    description: 'Divide a large semester project into actionable milestones',
    prompt: 'Help me break down my Software Engineering term project into step-by-step weekly sprints and manageable milestones.',
  },
];

export function ChatWindow({
  messages,
  isLoading,
  error,
  inputValue,
  onInputChange,
  onSendMessage,
  onClearError,
  onOpenMobileSidebar,
  conversationTitle = 'New Study Session',
  onResetConversation,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever messages array changes or loading state triggers
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    onSendMessage();
  };

  const handleSelectStarter = (promptText: string) => {
    onSendMessage(promptText);
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-950/60 overflow-hidden relative">
      {/* Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 md:px-6 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle Button */}
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
              aria-label="Open conversation history"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                {conversationTitle}
              </h1>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Agent Ready
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Academic Mentorship & Guidance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {onResetConversation && (
            <button
              onClick={onResetConversation}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
              title="Start a new conversation"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Error Banner if error occurred */}
      {error && (
        <div className="p-4 border-b border-rose-500/30 bg-rose-950/20 backdrop-blur-md">
          <ErrorAlert
            title="AI Service Notification"
            message={error}
            onRetry={() => onSendMessage()}
          />
        </div>
      )}

      {/* Main Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          /* Empty State: ChatGPT-style Student Hero */
          <div className="flex flex-col items-center justify-center min-h-[70%] max-w-2xl mx-auto py-8 text-center animate-in fade-in duration-300">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-600/25 mb-4">
              <Sparkles className="h-7 w-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              How can I help your studies today?
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-md">
              Ask questions on coursework, generate personalized study schedules, debug code, or prepare for upcoming exams.
            </p>

            {/* Quick Starter Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8 text-left">
              {STARTER_PROMPTS.map((starter, index) => {
                const Icon = starter.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectStarter(starter.prompt)}
                    className="group flex flex-col p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {starter.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {starter.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Render Message History */
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Pulsing Loading / Typing Indicator with Context-Aware Tool Status */}
            {isLoading && (
              <LoadingIndicator
                queryHint={
                  messages.filter((m) => m.role === 'user').slice(-1)[0]?.content
                }
              />
            )}
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Floating Bottom Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent shrink-0">
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput
            value={inputValue}
            onChange={onInputChange}
            onSend={handleSend}
            isLoading={isLoading}
            placeholder={
              messages.length === 0
                ? 'Type your study question or select a prompt above...'
                : 'Send a follow-up question or request clarification...'
            }
          />
        </div>
      </div>
    </div>
  );
}
