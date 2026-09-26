'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, User as UserIcon, ShieldCheck, LogOut, Bell } from 'lucide-react';
import { UserSummary } from '@/lib/types';

interface TopHeaderProps {
  user: UserSummary | null;
  onLogout?: () => void;
  unreadCount?: number;
}

export default function TopHeader({ user, onLogout, unreadCount = 0 }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-3 sm:px-4 py-2.5 sm:py-3 w-full max-w-full overflow-x-hidden">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 w-full">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform shrink-0">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-black text-base sm:text-lg tracking-wider text-white leading-none">BILLING</span>
            <span className="text-[10px] sm:text-[11px] font-black tracking-[0.25em] text-amber-400 uppercase leading-none mt-1">TAXI</span>
          </div>
        </Link>

        {/* Live Weather / Flight Badge & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Link
                href="/notifications"
                className="relative p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-900" />
                )}
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/50 rounded-full pl-1.5 pr-2.5 sm:pr-3 py-1 text-sm text-slate-200 hover:text-white transition-all shadow-sm"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-600 flex items-center justify-center font-black text-xs text-white shrink-0">
                  {user.name.charAt(0)}
                </div>
                <span className="font-bold text-xs max-w-[55px] sm:max-w-[80px] truncate">{user.username}</span>
                {user.role === 'ADMIN' && (
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                )}
              </Link>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 sm:gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-2xl transition-colors shadow-md active:scale-95 shrink-0"
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
