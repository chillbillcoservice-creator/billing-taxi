'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Wind, User as UserIcon, ShieldCheck, LogOut, Bell } from 'lucide-react';
import { UserSummary } from '@/lib/types';

interface TopHeaderProps {
  user: UserSummary | null;
  onLogout?: () => void;
  unreadCount?: number;
}

export default function TopHeader({ user, onLogout, unreadCount = 0 }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none mb-1">
              <span className="font-black text-lg tracking-tight text-white">BILLING</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">TAXI</span>
            </div>
            <p className="text-xs text-sky-400 font-bold tracking-wide">BIR 1,525m → BILLING 2,430m</p>
          </div>
        </Link>

        {/* Live Weather / Flight Badge & Profile */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/notifications"
                className="relative p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-slate-900" />
                )}
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/50 rounded-full pl-1.5 pr-3 py-1.5 text-sm text-slate-200 hover:text-white transition-all shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center font-black text-xs text-white">
                  {user.name.charAt(0)}
                </div>
                <span className="font-bold text-xs max-w-[80px] truncate">{user.username}</span>
                {user.role === 'ADMIN' && (
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                )}
              </Link>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2 rounded-2xl transition-colors shadow-md active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
