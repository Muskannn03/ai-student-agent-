'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Copy, Check, Sparkles, FileText, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  toolCalls?: Array<{ name: string; arguments?: any }>;
  sources?: Array<{ documentId?: string; documentName: string; pageNumber?: number | null; chunkIndex?: number }>;
  isStreaming?: boolean;
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

  // Match 📚 **Sources** list format:
  const bookRegex = /📚\s*(?:\*\*)?Sources(?:\*\*)?[:\s]*\n([\s\S]+?)(?:\n\n[^\-\•\*]|$)/gi;
  let bookMatch;
  while ((bookMatch = bookRegex.exec(content)) !== null) {
    const listBlock = bookMatch[1];
    const itemRegex = /^[-\•\*]\s*`?([^`\n\r]+?)`?(?:\s*[—–-]\s*(?:Page|Chunk)\s*#?(\d+))?$/gm;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(listBlock)) !== null) {
      const title = itemMatch[1].trim();
      const chunk = itemMatch[2] || undefined;
      if (title && !sources.some((s) => s.title === title)) {
        sources.push({ title, chunk });
      }
    }
  }

  return sources;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  
  // Consolidate both structured API sources and text-parsed sources with deduplication
  const extracted = !isUser ? extractSources(message.content) : [];
  const structured = !isUser && message.sources
    ? message.sources.map((s) => ({
        title: s.documentName,
        chunk: s.chunkIndex !== undefined ? String(s.chunkIndex) : undefined,
      }))
    : [];

  const sourcesMap = new Map<string, SourceReference>();
  for (const s of [...structured, ...extracted]) {
    if (s.title && !sourcesMap.has(s.title)) {
      sourcesMap.set(s.title, s);
    }
  }
  const sources = Array.from(sourcesMap.values());

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
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-2xs text-xs font-semibold transition-transform group-hover:scale-105',
          isUser
            ? 'bg-[#F3E6D5] text-[#800020] border border-[#E8D9C8]'
            : 'bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]'
        )}
      >
        {isUser ? <User className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
      </div>

      {/* Message Content Container */}
      <div
        className={cn(
          'relative flex-1 rounded-2xl px-5 py-4 text-sm shadow-[0_2px_8px_rgba(42,27,30,0.03)] transition-all',
          isUser
            ? 'bg-[#F6ECE2] text-[#2A1B1E] border border-[#EBDCCF] rounded-tr-sm max-w-[85%] sm:max-w-[75%]'
            : 'border border-[#EDE1D3] bg-white text-[#2A1B1E] rounded-tl-sm max-w-[95%] sm:max-w-[88%]'
        )}
      >
        {/* Header label for assistant */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#FAF5EE] text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-semibold text-[#800020] text-[11px] tracking-wide uppercase">
                <Sparkles className="h-3 w-3 text-[#D45060]" />
                AI Student Assistant
              </span>

              {/* Calm Tool Activity Chips */}
              {message.toolCalls &&
                message.toolCalls.map((t, idx) => {
                  const label =
                    t.name === 'searchNotes'
                      ? 'Searched your notes'
                      : t.name === 'getAssignments'
                      ? 'Checked assignments'
                      : t.name === 'getUpcomingDeadlines'
                      ? 'Checked upcoming deadlines'
                      : t.name === 'createStudyPlan'
                      ? 'Created study plan'
                      : t.name === 'getStudentProfile'
                      ? 'Loaded student profile'
                      : t.name;

                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-[#FBECEF] px-2 py-0.5 text-[10px] font-medium text-[#70001C] border border-[#F8CCD2]"
                    >
                      <Check className="h-3 w-3 text-[#800020] shrink-0" />
                      <span>{label}</span>
                    </span>
                  );
                })}
            </div>
            <span className="text-[10px] text-[#9E8B8E] font-mono shrink-0">{formattedTime}</span>
          </div>
        )}

        {/* Content Body */}
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed text-sm text-[#2A1B1E] font-normal">{message.content}</div>
        ) : (
          <div className="space-y-2 leading-relaxed text-[#2A1B1E]">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="text-base sm:text-lg font-semibold text-[#2A1B1E] mt-2 mb-1" {...props} />,
                h2: ({ ...props }) => <h2 className="text-sm sm:text-base font-semibold text-[#2A1B1E] mt-2 mb-1" {...props} />,
                h3: ({ ...props }) => <h3 className="text-xs sm:text-sm font-semibold text-[#800020] mt-2 mb-0.5" {...props} />,
                h4: ({ ...props }) => <h4 className="text-xs font-semibold text-[#2A1B1E] mt-1 mb-0.5" {...props} />,
                p: ({ ...props }) => <p className="text-xs sm:text-sm text-[#2A1B1E] leading-relaxed my-1.5" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc pl-5 my-1.5 space-y-1 text-xs sm:text-sm text-[#4A3B3E]" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal pl-5 my-1.5 space-y-1 text-xs sm:text-sm text-[#4A3B3E]" {...props} />,
                li: ({ ...props }) => <li className="text-[#4A3B3E] leading-normal" {...props} />,
                strong: ({ ...props }) => <strong className="font-semibold text-[#1F1214]" {...props} />,
                em: ({ ...props }) => <em className="italic text-[#5C4549]" {...props} />,
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-2 border-[#D45060] bg-[#FAF5EE] px-3 py-1.5 my-2 text-xs text-[#5C4549] rounded-r-lg italic"
                    {...props}
                  />
                ),
                code: ({ className, children, ...props }: any) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="rounded-md bg-[#FAF5EE] px-1.5 py-0.5 font-mono text-[11px] text-[#800020] border border-[#EDE1D3]"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="relative my-2.5 rounded-xl border border-[#EDE1D3] bg-[#FAF5EE] p-3.5 font-mono text-xs overflow-x-auto text-[#2A1B1E]">
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
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#800020] animate-pulse align-middle rounded-xs" />
            )}
          </div>
        )}

        {/* Source References (Subtle RAG Citation Cards) */}
        {!isUser && sources.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[#EDE1D3]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#800020] mb-2">
              <BookOpen className="h-3.5 w-3.5 text-[#D45060]" />
              <span>📚 Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-xl border border-[#EDE1D3] bg-[#FAF5EE] px-2.5 py-1.5 text-xs text-[#2A1B1E] shadow-2xs hover:bg-white hover:border-[#D45060]/50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-[#800020] shrink-0" />
                  <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{src.title}</span>
                  {src.chunk ? (
                    <span className="text-[10px] text-[#800020] bg-[#FBECEF] border border-[#F8CCD2] px-1.5 py-0.2 rounded font-mono">
                      Chunk #{src.chunk}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#786568] bg-[#F5ECE1] px-1.5 py-0.2 rounded">
                      Verified note
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info & Copy button */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#FAF5EE]">
          <span className={cn('text-[10px] font-mono', isUser ? 'text-[#847174]' : 'text-[#9E8B8E]')}>
            {isUser ? formattedTime : 'Verified Academic Guidance'}
          </span>

          <button
            onClick={handleCopy}
            className={cn(
              'opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all cursor-pointer',
              isUser
                ? 'text-[#63493E] hover:bg-[#EBDCCF] hover:text-[#2A1B1E]'
                : 'text-[#786568] hover:bg-[#FAF5EE] hover:text-[#800020]'
            )}
            title="Copy message"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#800020]" />
                <span className="text-[#800020]">Copied</span>
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
