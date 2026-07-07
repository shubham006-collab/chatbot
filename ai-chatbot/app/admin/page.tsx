'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Trash2, UserPlus, ArrowLeft, Shield, Check, X } from 'lucide-react';
import Link from 'next/link';

type UserListEntry = {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserListEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Authentication check and redirect guards
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!user.is_admin) {
        router.push('/chat');
      }
    }
  }, [user, authLoading, router]);

  // Fetch list of registered users
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/list_users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user && user.is_admin) {
      fetchUsers();
    }
  }, [user]);

  // Form submission handler to provision accounts
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/create_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          is_admin: newIsAdmin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setFormSuccess(true);
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      
      // Refresh list
      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user record request handler
  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? Their chat sessions and messages will be permanently deleted.')) return;

    try {
      const res = await fetch('/api/admin/delete_user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Refresh list
      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      alert(message);
    }
  };

  if (authLoading || !user || !user.is_admin) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-500 font-medium">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header navigation bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
              aria-label="Back to Chat"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">Admin Dashboard</h1>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            Admin: {user.username}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Create User Card Form */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
              <UserPlus className="h-4 w-4 text-neutral-500" />
              <h2 className="font-semibold text-sm">Provision Account</h2>
            </div>

            {formError && (
              <div className="p-3 text-xs text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded">
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="p-3 text-xs text-green-650 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded">
                Account provisioned successfully!
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="john"
                  disabled={submitting}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
                <label 
                  htmlFor="isAdmin" 
                  className="text-xs font-medium text-neutral-700 dark:text-neutral-350 select-none cursor-pointer"
                >
                  Grant Admin Privileges
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 text-xs font-semibold rounded text-white bg-neutral-900 hover:bg-neutral-800 dark:text-neutral-900 dark:bg-neutral-100 dark:hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 disabled:opacity-50"
              >
                {submitting ? 'Provisioning...' : 'Provision User'}
              </button>
            </form>
          </div>

          {/* User List Table Card */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
              <Shield className="h-4 w-4 text-neutral-500" />
              <h2 className="font-semibold text-sm">Registered Users</h2>
            </div>

            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                Loading users list...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 uppercase font-mono tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Created At</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {users.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors text-neutral-700 dark:text-neutral-300"
                      >
                        <td className="py-3 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                          {item.username}
                          {item.id === user.id && (
                            <span className="ml-1.5 text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                              (You)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {item.is_admin ? (
                            <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 font-semibold font-mono text-[10px] uppercase tracking-wider">
                              <Check className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-neutral-400 dark:text-neutral-500 font-medium">
                              <X className="h-3 w-3" /> Member
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-neutral-400 dark:text-neutral-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(item.id)}
                            disabled={item.id === user.id}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-400 hover:text-red-650 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-500 transition-colors"
                            aria-label="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
