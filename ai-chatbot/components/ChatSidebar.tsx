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
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/25 dark:bg-neutral-950/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 border-r border-neutral-200/40 dark:border-neutral-800/40 bg-neutral-50/50 dark:bg-neutral-900/40 backdrop-blur-xl flex flex-col z-50 transform lg:transform-none lg:static transition-all duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-200/40 dark:border-neutral-800/40 flex items-center justify-between">
          <span className="font-semibold text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono select-none">
            Chat History
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 lg:hidden transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Button: New Conversation */}
        <div className="p-4 flex-shrink-0">
          <button
            onClick={() => {
              onNewChat();
               onClose();
            }}
            className="w-full py-2.5 px-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm transition-all duration-150 active:scale-[0.98] liquid-glass liquid-glass-hover"
          >
            <Plus className="h-4 w-4 text-indigo-500" />
            New Conversation
          </button>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-1">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 dark:text-neutral-500 select-none">
              No chat history
            </div>
          ) : (
            chats.map((chat) => {
              const isSelected = chat.id === selectedChatId;
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 text-sm ${
                    isSelected
                      ? 'bg-white/60 dark:bg-neutral-800/40 text-neutral-900 dark:text-neutral-100 font-semibold shadow-sm border border-neutral-200/40 dark:border-neutral-750/30 backdrop-blur-md glass-border'
                      : 'text-neutral-600 dark:text-neutral-450 hover:bg-white/40 dark:hover:bg-neutral-800/25 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 pr-2"
                  >
                    <MessageSquare className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isSelected ? 'text-indigo-500' : 'opacity-60'
                    }`} />
                    <span className="truncate">{chat.title || 'Untitled Chat'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="p-1 rounded-md text-neutral-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-80 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-all duration-150"
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
          <div className="p-4 border-t border-neutral-200/40 dark:border-neutral-800/40 space-y-3 bg-neutral-100/30 dark:bg-neutral-900/20 backdrop-blur-md flex-shrink-0">
            
            {/* User credentials details */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {user.username}
                </p>
                {user.is_admin ? (
                  <span className="inline-flex items-center gap-1 text-[8px] text-indigo-600 dark:text-indigo-400 font-mono font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-1.5 py-0.5 rounded">
                    <Shield className="h-2 w-2" /> Admin
                  </span>
                ) : (
                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium select-none">
                    Workspace Member
                  </span>
                )}
              </div>
              <ThemeToggle variant="inline" />
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col gap-2 pt-1 border-t border-neutral-200/40 dark:border-neutral-800/40">
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="w-full text-center py-2 px-3 border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 hover:bg-white/70 dark:hover:bg-neutral-800/60 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-350 shadow-sm backdrop-blur-md transition-all duration-150 active:scale-[0.98] glass-border"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 hover:border-red-300/50 dark:hover:border-red-900/30 shadow-sm backdrop-blur-md transition-all duration-150 active:scale-[0.98] glass-border"
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
