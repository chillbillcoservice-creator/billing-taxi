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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-base tracking-tight text-white">BILLING</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">TAXI</span>
            </div>
            <p className="text-[10px] text-sky-400 font-medium tracking-wide">BIR 1,525m → BILLING 2,430m</p>
          </div>
        </Link>

        {/* Live Weather / Flight Badge & Profile */}
        <div className="flex items-center gap-2">
          {/* Quick weather status */}
          <div className="hidden xs:flex items-center gap-1 bg-sky-950/80 border border-sky-800/60 rounded-full px-2.5 py-1 text-[11px] text-sky-200">
            <Wind className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">12km/h</span>
            <span className="text-slate-400">SW</span>
          </div>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/notifications"
                className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-900" />
                )}
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-full pl-1.5 pr-2.5 py-1 text-xs text-slate-200 hover:text-white transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center font-bold text-[11px] text-white">
                  {user.name.charAt(0)}
                </div>
                <span className="font-medium max-w-[70px] truncate">{user.username}</span>
                {user.role === 'ADMIN' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                )}
              </Link>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs px-3 py-1.5 rounded-full transition-colors shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
