'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Bot, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ThemeToggle } from './theme-toggle';

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
      
      {/* Sticky Premium Header (both Desktop & Mobile) */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 lg:hidden transition-colors mr-1"
            aria-label="Open Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-neutral-850 dark:text-neutral-150">
              {chatId ? 'Conversation Thread' : 'New Chat Session'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[9px] text-neutral-450 dark:text-neutral-500 font-mono tracking-wider uppercase font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Assistant Online
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Header Action / Theme Toggle on Mobile */}
          <div className="lg:hidden">
            <ThemeToggle variant="inline" />
          </div>
        </div>
      </header>

      {/* Message Thread Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-neutral-400 dark:text-neutral-500 font-medium font-mono select-none">
            <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin mr-2" />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-5 px-4 text-center select-none">
            <div className="w-14 h-14 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-center text-indigo-500 dark:text-indigo-400 bg-white dark:bg-neutral-900 shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">How can I help you today?</h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-sm leading-relaxed">
                Start a conversation to draft messages, analyze code, brainstorm designs, or solve complex equations.
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
              <div className="flex justify-start items-start gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-indigo-500 to-violet-500 text-white border border-transparent shadow-sm">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/80 rounded-2xl rounded-tl-none px-4 py-3.5 text-sm flex items-center space-x-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-neutral-450 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-neutral-450 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-neutral-450 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input Area (Floating card look with gradient fade) */}
      <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-neutral-50 via-neutral-50/95 to-transparent dark:from-neutral-950 dark:via-neutral-950/95 dark:to-transparent flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="relative flex items-center w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 dark:focus-within:border-indigo-500/80 transition-all duration-200 pr-1.5 pl-3.5 py-1.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={sending || loading}
              className="flex-1 min-w-0 bg-transparent py-2.5 text-sm text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-550 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || loading}
              className="p-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-550 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md shadow-indigo-600/10 dark:shadow-none hover:shadow-lg transition-all duration-150 disabled:opacity-15 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-indigo-500/35 flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
