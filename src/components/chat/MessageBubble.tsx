'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check, Sparkles, FileText, BookOpen, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  toolCalls?: Array<{ name: string; arguments?: any }>;
}

interface MessageBubbleProps {
  message: MessageItem;
}

interface SourceReference {
  title: string;
  chunk?: string;
}

function extractSources(content: string): SourceReference[] {
  const sources: SourceReference[] = [];

  // Match: [Source: Document Title (Chunk #X)] or [Source: Document Title, Chunk #X]
  const bracketRegex = /\[Source:\s*([^\]]+?)(?:\s*\(Chunk\s*#?(\d+)\)|,\s*Chunk\s*#?(\d+))?\]/gi;
  let match;
  while ((match = bracketRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const chunk = match[2] || match[3] || undefined;
    if (title && !sources.some((s) => s.title === title && s.chunk === chunk)) {
      sources.push({ title, chunk });
    }
  }

  // Match markdown quote sources: > **Source**: `filename.pdf` (Chunk #X)
  const quoteRegex = />\s*\*\*Source\*\*:\s*`([^`]+)`(?:\s*\(Chunk\s*#?(\d+)\))?/gi;
  while ((match = quoteRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const chunk = match[2] || undefined;
    if (title && !sources.some((s) => s.title === title && s.chunk === chunk)) {
      sources.push({ title, chunk });
    }
  }

  return sources;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const sources = !isUser ? extractSources(message.content) : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={cn(
        'group flex items-start gap-3.5 max-w-3xl w-full transition-all',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-md text-xs font-bold transition-transform group-hover:scale-105',
          isUser
            ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-600/20'
            : 'bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-indigo-400 border border-indigo-500/30 shadow-indigo-500/10'
        )}
      >
        {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Content Container */}
      <div
        className={cn(
          'relative flex-1 rounded-2xl px-5 py-4 text-sm shadow-xl backdrop-blur-md transition-all',
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-sm max-w-[85%] sm:max-w-[75%]'
            : 'border border-slate-800/80 bg-slate-900/90 text-slate-100 rounded-tl-sm max-w-[95%] sm:max-w-[88%]'
        )}
      >
        {/* Header label for assistant */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-indigo-400 text-[11px] tracking-wide uppercase">
                <Sparkles className="h-3 w-3" />
                AI Student Assistant
              </span>
              {message.toolCalls &&
                message.toolCalls.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30"
                  >
                    {t.name === 'searchNotes'
                      ? 'Using Search Notes'
                      : t.name === 'getAssignments'
                      ? 'Checking Assignments'
                      : t.name === 'getUpcomingDeadlines'
                      ? 'Checking Deadlines'
                      : t.name === 'createStudyPlan'
                      ? 'Creating Study Plan'
                      : t.name === 'getStudentProfile'
                      ? 'Checking Student Profile'
                      : t.name}
                  </span>
                ))}
            </div>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">{formattedTime}</span>
          </div>
        )}

        {/* Content Body */}
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none space-y-2.5 leading-relaxed text-slate-200">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="text-lg font-bold text-white mt-2 mb-1" {...props} />,
                h2: ({ ...props }) => <h2 className="text-base font-bold text-white mt-2 mb-1" {...props} />,
                h3: ({ ...props }) => <h3 className="text-sm font-semibold text-indigo-300 mt-2 mb-1" {...props} />,
                h4: ({ ...props }) => <h4 className="text-xs font-semibold text-slate-200 mt-1 mb-0.5" {...props} />,
                p: ({ ...props }) => <p className="text-xs sm:text-sm text-slate-200 leading-relaxed my-1.5" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc pl-5 my-1.5 space-y-1 text-xs sm:text-sm text-slate-300" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal pl-5 my-1.5 space-y-1 text-xs sm:text-sm text-slate-300" {...props} />,
                li: ({ ...props }) => <li className="text-slate-300 leading-normal" {...props} />,
                strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
                em: ({ ...props }) => <em className="italic text-slate-300" {...props} />,
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-2 border-indigo-500 bg-indigo-950/20 px-3 py-1.5 my-2 text-xs text-slate-300 rounded-r-lg italic"
                    {...props}
                  />
                ),
                code: ({ className, children, ...props }: any) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="rounded-md bg-slate-800/90 px-1.5 py-0.5 font-mono text-[11px] text-indigo-300 border border-slate-700/60"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="relative my-2.5 rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 font-mono text-xs overflow-x-auto text-slate-200 shadow-inner">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Source References (RAG Citation Cards) */}
        {!isUser && sources.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Verified Notes & Document Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/25 bg-indigo-950/40 px-2.5 py-1 text-xs text-indigo-200 shadow-sm"
                >
                  <FileText className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{src.title}</span>
                  {src.chunk && (
                    <span className="text-[10px] text-indigo-300 bg-indigo-900/60 border border-indigo-500/30 px-1.5 py-0.2 rounded font-mono">
                      Chunk #{src.chunk}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info & Copy button */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
          <span className={cn('text-[10px] font-mono', isUser ? 'text-indigo-200' : 'text-slate-500')}>
            {isUser ? formattedTime : 'Verified Academic Guidance'}
          </span>

          <button
            onClick={handleCopy}
            className={cn(
              'opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all cursor-pointer',
              isUser
                ? 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
            title="Copy message"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
