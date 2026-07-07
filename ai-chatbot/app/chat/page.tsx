'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';

type Chat = {
  id: string;
  title: string;
  updated_at: string;
};

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string | null;
  created_at?: string;
};

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if session is empty and auth finished loading
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch recent conversation history summary
  const fetchChats = async () => {
    try {
      const res = await fetch('/api/history/list');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  // Fetch chronological messages of the active chat session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChatId) {
        setMessages([]);
        return;
      }

      setMessagesLoading(true);
      try {
        const res = await fetch(`/api/history/get?chat_id=${selectedChatId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          setSelectedChatId(null);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        setSelectedChatId(null);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChatId]);

  const handleSendMessage = async (content: string) => {
    setSending(true);
    
    // Add user message to UI immediately for quick feedback
    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: selectedChatId || undefined,
          message: content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add actual assistant response with provider meta details
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply,
        model_used: data.model_used,
      };
      
      setMessages((prev) => [...prev.slice(0, -1), userMsg, assistantMsg]);
      
      // Auto-set the active chat ID if we just started a new conversation
      if (!selectedChatId) {
        setSelectedChatId(data.chat_id);
      }
      
      // Refresh chat list side view to reflect sorting/updates
      await fetchChats();
      
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to get a response from AI. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    try {
      const res = await fetch('/api/history/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: chatId }),
      });

      if (res.ok) {
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
          setMessages([]);
        }
        await fetchChats();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    setMessages([]);
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-500 font-medium">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-white dark:bg-neutral-900 transition-colors duration-200">
      <ChatSidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatWindow
        chatId={selectedChatId}
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={messagesLoading}
        sending={sending}
        onMenuClick={() => setSidebarOpen(true)}
      />
    </div>
  );
}
