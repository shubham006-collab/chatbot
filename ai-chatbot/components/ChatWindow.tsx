'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string | null;
  created_at?: string;
};

type ChatWindowProps = {
  chatId: string | null;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  loading: boolean;
  sending: boolean;
  onMenuClick: () => void;
};

export function ChatWindow({
  chatId,
  messages,
  onSendMessage,
  loading,
  sending,
  onMenuClick,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, sending]);

  // Autofocus input box when chat selected or loaded
  useEffect(() => {
    if (!loading && !sending) {
      inputRef.current?.focus();
    }
  }, [chatId, loading, sending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden transition-colors duration-200">
      
      {/* Mobile Header */}
      <header className="flex items-center px-4 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 lg:hidden z-10 flex-shrink-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mr-2"
          aria-label="Open Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-medium text-sm text-neutral-800 dark:text-neutral-200">
          Chat Session
        </span>
      </header>

      {/* Message thread container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-neutral-500 font-medium">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 px-4 text-center">
            <div className="w-12 h-12 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">New Conversation</h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs">
                Ask a question or start a conversation with the assistant.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg, index) => (
              <MessageBubble key={msg.id || index} message={msg} />
            ))}
            
            {/* Pulsing loading dots */}
            {sending && (
              <div className="flex justify-start mb-4">
                <div className="bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/50 rounded-lg px-4 py-3 text-sm flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input bar */}
      <div className="p-4 bg-white dark:bg-neutral-900 lg:bg-transparent border-t lg:border-t-0 border-neutral-200 dark:border-neutral-850 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sending || loading}
            className="flex-1 px-4 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-650 focus:border-transparent transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || loading}
            className="p-2.5 rounded-md text-white bg-neutral-900 hover:bg-neutral-800 dark:text-neutral-900 dark:bg-neutral-100 dark:hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
