'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import TopHeader from './TopHeader';
import BottomNav from './BottomNav';
import { UserSummary } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: UserSummary | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUnreadCount(data.unreadNotifications || 0);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/auth/login');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  // Hide header and bottom nav on certain standalone pages if needed (e.g. print view or auth)
  const isAuthPage = pathname.startsWith('/auth');
  const isPrintPermit = pathname.includes('/print');

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
      <div className="w-full max-w-md min-h-screen bg-slate-900 border-x border-slate-800 shadow-2xl flex flex-col relative">
        {!isPrintPermit && (
          <TopHeader user={user} onLogout={logout} unreadCount={unreadCount} />
        )}

        <main className={`flex-1 flex flex-col ${isPrintPermit ? 'p-0' : 'pb-20'}`}>
          {children}
        </main>

        {!isPrintPermit && !isAuthPage && <BottomNav user={user} />}
      </div>
    </AuthContext.Provider>
  );
}
