'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, MessageSquare, Search, ShoppingBag, Award, Shield } from 'lucide-react';
import { UserSummary } from '@/lib/types';

interface BottomNavProps {
  user: UserSummary | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Taxis', href: '/taxis', icon: Car },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Lost/Found', href: '/lost-found', icon: Search },
    { label: 'Market', href: '/marketplace', icon: ShoppingBag },
    { label: 'Permits', href: '/permissions', icon: Award },
  ];

  // If user is Admin or Moderator, show Admin tab
  if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
    navItems.push({ label: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5 no-print safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 font-normal'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-sky-500/15' : 'bg-transparent'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
