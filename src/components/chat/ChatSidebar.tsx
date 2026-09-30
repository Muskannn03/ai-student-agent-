'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  X,
  Search,
  Bot,
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt?: string;
  messageCount?: number;
}

interface ChatSidebarProps {
  conversations: ChatSessionSummary[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string) => void;
  isLoading?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
  isOpenMobile = false,
  onCloseMobile,
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteConversation) return;

    setDeletingId(id);
    try {
      await onDeleteConversation(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatSessionDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl">
      {/* Top Header & New Conversation Button */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Chat History
              </h2>
              <p className="text-[11px] text-slate-400">AI Student Assistant</p>
            </div>
          </div>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewConversation();
            if (onCloseMobile) onCloseMobile();
          }}
          className="group relative flex w-full items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span>New Conversation</span>
          </div>
          <span className="text-[10px] bg-indigo-500/40 text-indigo-100 rounded px-1.5 py-0.5 font-mono">
            Ctrl+N
          </span>
        </button>

        {/* Search Input if more than 3 conversations */}
        {conversations.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-slate-800/80 bg-slate-900/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-900/60 border border-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <MessageSquare className="h-8 w-8 text-slate-700 mb-2" />
            <p className="text-xs font-medium text-slate-400">
              {searchTerm ? 'No matching chats found' : 'No conversations yet'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {searchTerm
                ? 'Try a different search keyword'
                : 'Start a new conversation with your AI Student Assistant'}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isActive = item.id === activeId;
            const isDeleting = item.id === deletingId;

            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectConversation(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={cn(
                  'group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer border select-none',
                  isActive
                    ? 'border-indigo-500/40 bg-indigo-600/15 text-white shadow-sm shadow-indigo-500/5'
                    : 'border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-100'
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-500" />
                )}

                <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                  <MessageSquare
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-colors',
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate font-medium text-xs',
                        isActive ? 'text-indigo-200' : 'text-slate-300'
                      )}
                    >
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>{formatSessionDate(item.updatedAt)}</span>
                      {typeof item.messageCount === 'number' && item.messageCount > 0 && (
                        <span>• {item.messageCount} msgs</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete conversation button */}
                {onDeleteConversation && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-all shrink-0 cursor-pointer"
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    <Trash2
                      className={cn('h-3.5 w-3.5', isDeleting ? 'animate-spin' : '')}
                    />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-slate-300 font-medium">PostgreSQL Sync</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">v1.0-agent</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-72 lg:w-80 flex-col shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-80 max-w-[85vw] flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
