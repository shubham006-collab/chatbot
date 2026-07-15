'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X, MessageSquare, LogOut, Shield, Search } from 'lucide-react';
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
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter(chat =>
    (chat.title || 'Untitled Chat').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-205"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 border-r border-white/10 dark:border-neutral-900/30 bg-white/35 dark:bg-neutral-950/20 backdrop-blur-2xl flex flex-col z-50 transform lg:transform-none lg:static transition-all duration-250 ease-in-out shadow-xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 dark:border-neutral-900/20 flex items-center justify-between">
          <span className="font-bold text-[10px] uppercase tracking-wider text-neutral-450 dark:text-neutral-500 font-mono select-none">
            Chat History
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-white/20 dark:hover:bg-neutral-800 lg:hidden transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Button: New Conversation */}
        <div className="p-4 pb-2 flex-shrink-0">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm transition-all duration-200 active:scale-[0.98] border border-white/30 dark:border-neutral-750/30 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/50 dark:hover:bg-neutral-900/50 hover:translate-y-[-0.5px]"
          >
            <Plus className="h-4 w-4 text-indigo-500" />
            New Conversation
          </button>
        </div>

        {/* Search Bar filter */}
        <div className="px-4 pb-3 pt-1 flex-shrink-0 select-none">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white/25 dark:bg-neutral-900/35 border border-white/20 dark:border-neutral-850/60 rounded-xl text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-550 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/40 dark:focus:border-indigo-500/40 transition-all duration-200 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:bg-white/35 dark:hover:bg-neutral-900/45"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 p-1 rounded-md text-neutral-400 hover:text-neutral-650 dark:hover:text-neutral-200 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-1">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-450 dark:text-neutral-500 select-none font-medium">
              {search ? 'No matches found' : 'No chat history'}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = chat.id === selectedChatId;
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm ${
                    isSelected
                      ? 'bg-white/60 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 font-semibold border border-white/35 dark:border-neutral-700/30 shadow-sm shadow-indigo-500/5 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)]'
                      : 'text-neutral-600 dark:text-neutral-450 hover:bg-white/40 dark:hover:bg-neutral-900/25 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent hover:translate-x-[1px]'
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
          <div className="p-4 border-t border-white/10 dark:border-neutral-900/20 space-y-3 bg-white/20 dark:bg-neutral-950/10 backdrop-blur-md flex-shrink-0">
            
            {/* User credentials details */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {user.username}
                </p>
                {user.is_admin ? (
                  <span className="inline-flex items-center gap-1 text-[8px] text-indigo-650 dark:text-indigo-400 font-mono font-bold uppercase tracking-wider bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-150/40 dark:border-indigo-900/30 px-1.5 py-0.5 rounded">
                    <Shield className="h-2 w-2" /> Admin
                  </span>
                ) : (
                  <span className="text-[9px] text-neutral-450 dark:text-neutral-500 font-medium select-none">
                    Workspace Member
                  </span>
                )}
              </div>
              <ThemeToggle variant="inline" />
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col gap-2 pt-1 border-t border-white/10 dark:border-neutral-900/20">
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="w-full text-center py-2 px-3 border border-white/25 dark:border-neutral-800/70 bg-white/35 dark:bg-neutral-900/35 hover:bg-white/50 dark:hover:bg-neutral-900/50 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm backdrop-blur-md transition-all duration-150 active:scale-[0.98] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-red-650 dark:text-red-455 hover:bg-red-50/55 dark:hover:bg-red-950/25 border border-white/20 dark:border-neutral-800/70 bg-white/20 dark:bg-neutral-900/20 hover:border-red-300/30 dark:hover:border-red-900/20 shadow-sm backdrop-blur-md transition-all duration-150 active:scale-[0.98] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
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
