'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string | null;
  created_at?: string;
};

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'bg-neutral-100 text-neutral-850 dark:bg-neutral-800/80 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/50'
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown
            components={{
              pre: ({ ...props }) => (
                <pre
                  className="p-3 my-2 overflow-x-auto rounded bg-neutral-950 text-neutral-100 text-xs font-mono border border-neutral-800"
                  {...props}
                />
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code
                    className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-700/40 text-neutral-900 dark:text-neutral-100 text-xs font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code className="text-xs font-mono text-neutral-200" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Model metadata label */}
        {!isUser && message.model_used && (
          <div className="mt-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono tracking-wider uppercase select-none">
            via {message.model_used}
          </div>
        )}
      </div>
    </div>
  );
}
