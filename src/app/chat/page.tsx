'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ChatSidebar, ChatSessionSummary } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageItem } from '@/components/chat/MessageBubble';

function ChatContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryPrompt = searchParams.get('prompt') || '';
  const queryConversationId = searchParams.get('conversationId') || null;

  const [conversations, setConversations] = useState<ChatSessionSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(queryConversationId);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | undefined>(undefined);

  // 1. Fetch conversations list for sidebar
  const fetchConversations = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const res = await fetch('/api/chat');
      if (!res.ok) throw new Error('Failed to load conversation history');
      const data = await res.json();
      if (data.conversations && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // 2. Fetch messages for a specific conversation session
  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(convId)}`);
      if (!res.ok) throw new Error('Failed to load messages for this conversation.');
      const data = await res.json();

      if (data.messages && Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading conversation messages:', err);
      setError(err instanceof Error ? err.message : 'Error loading conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load conversation if activeConversationId is provided
  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    }
  }, [activeConversationId, loadConversationMessages]);

  // Handle prompt query param if present on mount
  useEffect(() => {
    if (queryPrompt && !activeConversationId) {
      handleSendMessage(queryPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPrompt]);

  // 3. Send Message Action connected to POST /api/chat with streaming support
  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? inputValue).trim();
    if (!textToSend || isLoading) return;

    setError(null);

    // Optimistically append user message to UI
    const userMessage: MessageItem = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setAgentStatus('Thinking...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId: activeConversationId || undefined,
          stream: true,
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        const assistantId = `ast_${Date.now()}`;
        let hasAppendedAssistant = false;
        let accumulatedText = '';
        let executedToolCalls: Array<{ name: string; arguments?: any }> = [];

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'status' && event.status) {
                setAgentStatus(event.status);
              } else if (event.type === 'tool_call' && event.tool) {
                if (!executedToolCalls.some((t) => t.name === event.tool)) {
                  executedToolCalls.push({ name: event.tool });
                }
              } else if (event.type === 'chunk' && event.chunk) {
                accumulatedText += event.chunk;

                if (!hasAppendedAssistant) {
                  hasAppendedAssistant = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantId,
                      role: 'assistant',
                      content: accumulatedText,
                      createdAt: new Date().toISOString(),
                      toolCalls: executedToolCalls.length > 0 ? [...executedToolCalls] : undefined,
                      isStreaming: true,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: accumulatedText,
                            toolCalls: executedToolCalls.length > 0 ? [...executedToolCalls] : m.toolCalls,
                          }
                        : m
                    )
                  );
                }
              } else if (event.type === 'done') {
                if (event.conversationId && event.conversationId !== activeConversationId) {
                  setActiveConversationId(event.conversationId);
                  fetchConversations();
                }

                const finalContent = event.message || accumulatedText;
                const finalTools = event.toolCalls || executedToolCalls;
                const finalSources = event.sources || [];

                if (!hasAppendedAssistant) {
                  hasAppendedAssistant = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantId,
                      role: 'assistant',
                      content: finalContent,
                      createdAt: new Date().toISOString(),
                      toolCalls: finalTools.length > 0 ? finalTools : undefined,
                      sources: finalSources.length > 0 ? finalSources : undefined,
                      isStreaming: false,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: finalContent,
                            toolCalls: finalTools.length > 0 ? finalTools : undefined,
                            sources: finalSources.length > 0 ? finalSources : undefined,
                            isStreaming: false,
                          }
                        : m
                    )
                  );
                }
              } else if (event.type === 'error') {
                throw new Error(event.error || 'An error occurred during response streaming.');
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message.includes('An error occurred')) {
                throw parseErr;
              }
            }
          }
        }
      } else {
        // Fallback for standard non-streaming JSON responses
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || data.details || 'Failed to receive response from AI agent.');
        }

        if (data.conversationId && data.conversationId !== activeConversationId) {
          setActiveConversationId(data.conversationId);
          fetchConversations();
        }

        const assistantMessage: MessageItem = {
          id: `ast_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          createdAt: new Date().toISOString(),
          toolCalls: data.toolCalls,
          sources: data.sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('[Chat Error]:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while connecting to the AI agent.'
      );
    } finally {
      setIsLoading(false);
      setAgentStatus(undefined);
    }
  };

  // 4. Start New Conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setInputValue('');
    router.push('/chat');
  };

  // 5. Select Existing Conversation
  const handleSelectConversation = (id: string) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    router.push(`/chat?conversationId=${encodeURIComponent(id)}`);
  };

  // 6. Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete conversation');

      // Remove from sidebar list
      setConversations((prev) => prev.filter((c) => c.id !== id));

      // If active conversation was deleted, start new one
      if (activeConversationId === id) {
        handleNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Could not delete conversation.');
    }
  };

  // Find active conversation title
  const activeSession = conversations.find((c) => c.id === activeConversationId);
  const activeTitle = activeSession ? activeSession.title : 'New Study Session';

  return (
    <div className="flex h-[calc(100vh-7.5rem)] rounded-3xl border border-[#EDE1D3] bg-white overflow-hidden shadow-[0_4px_20px_rgba(42,27,30,0.04)]">
      {/* Conversation Sidebar (Collapsible on mobile) */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoading={isHistoryLoading}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Window */}
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onClearError={() => setError(null)}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        conversationTitle={activeTitle}
        onResetConversation={handleNewConversation}
        agentStatus={agentStatus}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <AppShell
      title="AISA-AI Student Agent"
      subtitle="Contextual academic mentorship, problem breakdown, and intelligent study companion"
    >
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-3xl border border-[#EDE1D3] bg-white">
            <div className="flex items-center gap-3 text-[#786568] text-sm">
              <span className="h-4 w-4 rounded-full border-2 border-[#EDE1D3] border-t-[#800020] animate-spin" />
              <span>Initializing calm study session...</span>
            </div>
          </div>
        }
      >
        <ChatContainer />
      </Suspense>
    </AppShell>
  );
}
