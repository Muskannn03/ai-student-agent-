'use client';

import React, { useEffect, useRef } from 'react';
import {
  Menu,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckSquare,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import { MessageBubble, MessageItem } from './MessageBubble';
import { LoadingIndicator } from './LoadingIndicator';
import { ChatInput } from './ChatInput';
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
  agentStatus?: string;
}

const STARTER_ACTIONS = [
  {
    icon: BookOpen,
    symbol: '📚',
    title: 'Explain my notes',
    description: 'Understand concepts from my uploaded material',
    prompt: 'Explain my uploaded notes',
  },
  {
    icon: CheckSquare,
    symbol: '✓',
    title: 'My assignments',
    description: 'See what needs to be completed',
    prompt: 'What assignments do I have?',
  },
  {
    icon: Clock,
    symbol: '◷',
    title: 'Upcoming deadlines',
    description: 'Know what needs attention soon',
    prompt: 'What deadlines are coming up?',
  },
  {
    icon: User,
    symbol: '◎',
    title: 'My student profile',
    description: 'View my academic information',
    prompt: 'Tell me about my academic profile',
  },
  {
    icon: Sparkles,
    symbol: '✦',
    title: 'Create a study plan',
    description: 'Build a personalized study schedule',
    prompt: 'Create a 7-day study plan',
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
  agentStatus,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-1 flex-col h-full bg-[#FFFDF9] overflow-hidden relative">
      {/* Top Header Bar */}
      <header className="flex h-15 items-center justify-between border-b border-[#EDE1D3] bg-[#FFF9F2]/90 px-4 md:px-6 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle Button */}
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl text-[#786568] hover:text-[#2A1B1E] bg-[#FAF5EE] border border-[#EDE1D3] transition-colors"
              aria-label="Open conversation history"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-[#2A1B1E] truncate max-w-[200px] sm:max-w-md">
                {conversationTitle}
              </h1>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] text-[#800020] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#800020] animate-pulse" />
                  Agent Ready
                </span>
                <span className="text-[#D8C7B8] hidden sm:inline">•</span>
                <span className="text-[11px] text-[#786568] hidden sm:inline">
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
              className="flex items-center gap-1.5 rounded-xl border border-[#EDE1D3] bg-white px-3 py-1.5 text-xs font-medium text-[#5C4549] hover:bg-[#FAF5EE] hover:text-[#800020] hover:border-[#D45060]/40 transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Start a new conversation"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#786568]" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Error Banner if error occurred */}
      {error && (
        <div className="p-4 border-b border-[#F8CCD2] bg-[#FDF2F3]">
          <ErrorAlert
            title="Notification"
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
          /* Empty State: Serene Study Space Hero */
          <div className="flex flex-col items-center justify-center min-h-[70%] max-w-3xl mx-auto py-10 text-center animate-in fade-in duration-300">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2] shadow-xs mb-4">
              <Sparkles className="h-6 w-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-[#2A1B1E] tracking-tight">
              Your calm space to study, plan & learn.
            </h2>
            <p className="text-xs sm:text-sm text-[#786568] mt-2 max-w-lg leading-relaxed">
              Ask questions, explore your notes, track academic tasks, or create a study plan.
            </p>

            {/* Quick Starter Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full mt-8 text-left">
              {STARTER_ACTIONS.map((starter, index) => {
                const Icon = starter.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectStarter(starter.prompt)}
                    className="group flex flex-col p-4 rounded-2xl border border-[#EDE1D3] bg-white hover:bg-[#FAF5EE] hover:border-[#D45060]/40 hover:shadow-xs transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F5ECE1] text-[#800020] group-hover:bg-[#FBECEF] transition-colors text-xs font-semibold">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#2A1B1E] group-hover:text-[#800020] transition-colors">
                        {starter.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#786568] line-clamp-2 leading-relaxed">
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
                status={agentStatus}
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
      <div className="p-4 md:p-6 bg-gradient-to-t from-[#FFFDF9] via-[#FFFDF9]/95 to-transparent shrink-0">
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput
            value={inputValue}
            onChange={onInputChange}
            onSend={handleSend}
            isLoading={isLoading}
            placeholder="Ask your study assistant anything..."
          />
        </div>
      </div>
    </div>
  );
}
