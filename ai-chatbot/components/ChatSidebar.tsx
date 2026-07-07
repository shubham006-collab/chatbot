'use client';

import React from 'react';
import { Plus, Trash2, X, MessageSquare, LogOut, Shield } from 'lucide-react';
import { useAuth } from './auth-provider';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

type Chat = {
  id: string;
  title: string;
  updated_at: string;
};

type ChatSidebarProps = {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
};

export function ChatSidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/10 dark:bg-neutral-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col z-45 transform lg:transform-none lg:static transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <span className="font-semibold text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Chat History
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2 px-4 flex items-center justify-center gap-2 border border-neutral-250 dark:border-neutral-800 rounded-md text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No chat history
            </div>
          ) : (
            chats.map((chat) => {
              const isSelected = chat.id === selectedChatId;
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-sm ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    className="flex items-center gap-2 flex-1 min-w-0 pr-2"
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-70" />
                    <span className="truncate">{chat.title || 'Untitled Chat'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User profile footer */}
        {user && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 bg-neutral-50/30 dark:bg-neutral-900/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {user.username}
                </p>
                {user.is_admin && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                    <Shield className="h-2.5 w-2.5" /> Admin
                  </span>
                )}
              </div>
              <ThemeToggle variant="inline" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="w-full text-center py-1.5 px-3 border border-neutral-250 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
