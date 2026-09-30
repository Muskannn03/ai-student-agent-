'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  X,
  Search,
  Sparkles,
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
    <div className="flex flex-col h-full bg-[#FAF5EE] border-r border-[#EDE1D3]">
      {/* Top Header & New Conversation Button */}
      <div className="p-4 border-b border-[#EDE1D3] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F4CDD5]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#2A1B1E] tracking-tight">
                Study Sessions
              </h2>
              <p className="text-[11px] text-[#786568]">AI Academic Assistant</p>
            </div>
          </div>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg text-[#786568] hover:text-[#2A1B1E] bg-white border border-[#EDE1D3] transition-colors"
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
          className="group relative flex w-full items-center justify-between gap-2 rounded-xl bg-[#800020] hover:bg-[#6A001B] px-3.5 py-2.5 text-xs font-medium text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span>New Conversation</span>
          </div>
          <span className="text-[10px] bg-white/20 text-white rounded px-1.5 py-0.5 font-mono">
            Ctrl+N
          </span>
        </button>

        {/* Search Input if more than 3 conversations */}
        {conversations.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9E8B8D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-[#E0D2C2] bg-white pl-8 pr-3 py-1.5 text-xs text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-colors shadow-2xs"
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
                className="h-12 rounded-xl bg-[#F5ECE1] border border-[#E5D7C6] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#9E8B8D]">
            <MessageSquare className="h-7 w-7 text-[#D5C6BA] mb-2" />
            <p className="text-xs font-medium text-[#5C0017]">
              {searchTerm ? 'No matching chats found' : 'No conversations yet'}
            </p>
            <p className="text-[11px] text-[#786568] mt-1 max-w-[200px]">
              {searchTerm
                ? 'Try a different search keyword'
                : 'Start a calm study session with your AI assistant'}
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
                    ? 'border-[#E2CEB9] bg-[#F3E6D5] text-[#5C0017] font-medium shadow-2xs'
                    : 'border-transparent text-[#6A575A] hover:border-[#EDE1D3] hover:bg-white hover:text-[#2A1B1E]'
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#800020]" />
                )}

                <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                  <MessageSquare
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-colors',
                      isActive ? 'text-[#800020]' : 'text-[#9E8B8D] group-hover:text-[#6A575A]'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs font-medium',
                        isActive ? 'text-[#5C0017]' : 'text-[#2A1B1E]'
                      )}
                    >
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#786568]">
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
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#9E8B8D] hover:text-[#A62B3A] hover:bg-[#FDF2F3] transition-all shrink-0 cursor-pointer"
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
      <div className="p-3 border-t border-[#EDE1D3] bg-[#FAF5EE] text-[11px] text-[#786568] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#538E6E] animate-pulse" />
          <span className="text-[11px] text-[#5C0017] font-medium">PostgreSQL Connected</span>
        </div>
        <span className="text-[10px] text-[#9E8B8D] font-mono">v1.0-burgundy</span>
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
            className="fixed inset-0 bg-[#2A1B1E]/25 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-80 max-w-[85vw] flex-col z-10 shadow-xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
