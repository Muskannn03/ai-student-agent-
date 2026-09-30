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
  placeholder = 'Ask your study assistant anything...',
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 180);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
          'bg-white shadow-[0_2px_12px_rgba(42,27,30,0.04)]',
          isLoading
            ? 'border-[#EDE1D3]'
            : 'border-[#EDE1D3] focus-within:border-[#800020] focus-within:ring-2 focus-within:ring-[#800020]/15'
        )}
      >
        {/* Textarea Input Field */}
        <div className="flex items-center px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent text-sm text-[#2A1B1E] placeholder:text-[#9E8B8E] focus:outline-none disabled:opacity-50 leading-relaxed max-h-44 min-h-[44px]"
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
                ? 'bg-[#F5ECE1] text-[#9E8B8E] cursor-not-allowed opacity-75'
                : 'bg-[#800020] hover:bg-[#6A001B] text-white shadow-xs active:scale-95'
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

        {/* Bottom Helper Bar */}
        <div className="flex items-center justify-between px-4 pb-2 pt-0.5 text-[11px] text-[#786568] border-t border-[#FAF5EE]">
          <div className="flex items-center gap-1.5 text-[#5C4549]">
            <Sparkles className="h-3 w-3 text-[#800020]" />
            <span className="hidden sm:inline">
              AI Student Assistant • Calm study space
            </span>
            <span className="sm:hidden">Study Assistant</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[#9E8B8E]">
            <kbd className="inline-flex items-center gap-0.5 rounded bg-[#FAF5EE] px-1.5 py-0.5 font-mono text-[9px] text-[#5C4549] border border-[#EDE1D3]">
              Enter <CornerDownLeft className="h-2.5 w-2.5" />
            </kbd>
            <span className="hidden sm:inline">to send</span>
            <span className="text-[#EDE1D3] hidden sm:inline">•</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-[#FAF5EE] px-1.5 py-0.5 font-mono text-[9px] text-[#5C4549] border border-[#EDE1D3]">
              Shift + Enter
            </kbd>
            <span className="hidden sm:inline">newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
