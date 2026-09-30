'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, CornerDownLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Ask a question, request a study plan, or paste homework...',
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height to accommodate multi-line content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 180);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift -> Send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSend();
      }
    }
  };

  const isSendDisabled = !value.trim() || isLoading || disabled;

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'relative flex flex-col rounded-2xl border transition-all duration-200',
          'bg-slate-900/90 shadow-2xl backdrop-blur-xl',
          isLoading
            ? 'border-indigo-500/30'
            : 'border-slate-800/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
        )}
      >
        {/* Textarea Input Field */}
        <div className="flex items-center px-4 pt-3.5 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50 leading-relaxed max-h-44 min-h-[44px]"
            style={{ overflowY: value.split('\n').length > 5 ? 'auto' : 'hidden' }}
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={onSend}
            disabled={isSendDisabled}
            className={cn(
              'ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer select-none',
              isSendDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95'
            )}
            title="Send message (Enter)"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Bottom Helper Bar with Shortcuts */}
        <div className="flex items-center justify-between px-4 pb-2 pt-0.5 text-[11px] text-slate-500 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span className="hidden sm:inline">
              AI Student Agent {process.env.NEXT_PUBLIC_AI_PROVIDER === 'openai' ? 'powered by OpenAI & Prisma' : 'Powered by Ollama & Prisma'}
            </span>
            <span className="sm:hidden">AI Student Assistant</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <kbd className="inline-flex items-center gap-0.5 rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 border border-slate-700/60">
              Enter <CornerDownLeft className="h-2.5 w-2.5" />
            </kbd>
            <span className="hidden sm:inline">to send</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 border border-slate-700/60">
              Shift + Enter
            </kbd>
            <span className="hidden sm:inline">newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
