'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sparkles, MessageSquare, Shield, Cpu, Zap } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Store user session in context and localStorage
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to chat
      router.push('/chat');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-full w-full overflow-hidden flex bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200">
      <ThemeToggle variant="fixed" />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 h-full w-full">
        
        {/* Left Side: Branding & Features Pane (Desktop/Tablet large only) */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-neutral-950 via-slate-900 to-indigo-950 relative overflow-hidden text-white border-r border-neutral-850/20">
          
          {/* Subtle Ambient Glow Effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
          
          {/* Top Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              Chatbot <span className="text-indigo-400 font-medium">2.0</span>
            </span>
          </div>

          {/* Core Feature Pitch */}
          <div className="my-auto space-y-8 relative z-10 max-w-md">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" /> Next-gen AI Interface
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-450 bg-clip-text text-transparent">
                Empower your workflow with intelligent conversations.
              </h1>
              <p className="text-neutral-450 text-base leading-relaxed">
                Connect, prompt, and orchestrate with our advanced dual-model framework optimized for high-performance reasoning.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-800/60">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded bg-neutral-800/50 border border-neutral-700/50 mt-1">
                  <Zap className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-neutral-200">Blazing Fast Responses</h3>
                  <p className="text-xs text-neutral-400">Powered by high-throughput edge nodes for instant rendering.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded bg-neutral-800/50 border border-neutral-700/50 mt-1">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-neutral-200">Flexible AI Models</h3>
                  <p className="text-xs text-neutral-400">Choose between specialized reasoning agents tailored to your context.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded bg-neutral-800/50 border border-neutral-700/50 mt-1">
                  <Shield className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-neutral-200">Secure Architecture</h3>
                  <p className="text-xs text-neutral-400">State-of-the-art session sandboxing protects your chat history.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-neutral-550 text-xs font-medium relative z-10">
            &copy; 2026 Chatbot System Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side: Authentication Form Pane */}
        <div className="flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-neutral-950 transition-colors duration-200 relative">
          
          {/* Ambient Glow for Mobile Background */}
          <div className="lg:hidden absolute top-10 right-10 w-64 h-64 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
          
          <div className="w-full max-w-md space-y-8 relative z-10">
            
            {/* Mobile Header Logo */}
            <div className="lg:hidden flex flex-col items-center space-y-4 mb-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Chatbot <span className="text-indigo-650 dark:text-indigo-400">2.0</span>
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-450">
                  Experience the next generation of conversation.
                </p>
              </div>
            </div>

            {/* Form Title & Subtext (Desktop View) */}
            <div className="hidden lg:block space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                Welcome Back
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-450">
                Sign in with your credentials to resume your conversations.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 text-sm text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/35 rounded-xl">
                <div className="flex gap-2">
                  <span className="font-semibold">Sign in failed:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label 
                  htmlFor="username" 
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-550 dark:text-neutral-400"
                >
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    disabled={loading}
                    className="w-full px-4 py-3 text-sm bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label 
                  htmlFor="password" 
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-550 dark:text-neutral-400"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full px-4 py-3 text-sm bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-550 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md shadow-indigo-600/15 dark:shadow-none hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="lg:hidden text-center text-neutral-500 text-xs mt-8">
              &copy; 2026 Chatbot System Inc. All rights reserved.
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
