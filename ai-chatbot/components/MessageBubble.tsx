'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Check, Copy } from 'lucide-react';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string | null;
  created_at?: string;
};

// Clipboard copy helper component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="p-1 rounded hover:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-400 hover:text-white dark:hover:text-neutral-100 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-500"
      aria-label="Copy code"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full items-start gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar Circle */}
      <div 
        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm select-none transition-all ${
          isUser 
            ? 'bg-white/40 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-300 border border-white/20 dark:border-neutral-750/30 glass-border' 
            : 'bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/10'
        }`}
      >
        {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
      </div>
      
      {/* Message Bubble Column */}
      <div className={`flex flex-col max-w-[82%] lg:max-w-[76%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Actual bubble */}
        <div
          className={`px-4 py-3 text-[14px] leading-relaxed transition-all ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-none font-normal shadow-md shadow-indigo-600/10 dark:shadow-none'
              : 'bg-white/60 dark:bg-neutral-900/45 text-neutral-850 dark:text-neutral-200 border border-white/25 dark:border-neutral-800/45 rounded-2xl rounded-tl-none shadow-sm backdrop-blur-md glass-border'
          }`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              components={{
                // Prevent duplicate box wrapping by making pre transparent
                pre: ({ children }) => <>{children}</>,
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');

                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono border border-neutral-200/50 dark:border-neutral-750"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="my-3 overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-800/90 bg-neutral-900 dark:bg-neutral-950">
                      <div className="flex items-center justify-between px-4 py-2 bg-neutral-100/50 dark:bg-neutral-900/50 border-b border-neutral-200/80 dark:border-neutral-800/90 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 font-mono select-none">
                        <span>{lang ? lang.toUpperCase() : 'CODE'}</span>
                        <CopyButton text={codeString} />
                      </div>
                      <pre className="p-4 overflow-x-auto text-neutral-100 text-xs font-mono bg-neutral-900 dark:bg-neutral-950">
                        <code className="text-neutral-200" {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Model Meta Indicator (Assistant only) */}
        {!isUser && message.model_used && (
          <div className="mt-1.5 ml-1.5 text-[9px] text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider select-none">
            via {message.model_used}
          </div>
        )}
      </div>

    </div>
  );
}
