'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/ClientShell';
import Link from 'next/link';
import {
  Bell,
  CheckCircle,
  Car,
  MessageSquare,
  Award,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
    else setLoading(false);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    if (type.startsWith('TAXI')) return <Car className="w-4 h-4 text-amber-400" />;
    if (type.startsWith('CHAT')) return <MessageSquare className="w-4 h-4 text-sky-400" />;
    if (type.startsWith('PERMIT') || type.startsWith('APPLICATION'))
      return <Award className="w-4 h-4 text-emerald-400" />;
    return <Bell className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs text-slate-400">Rides, permits, and community updates</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link || '/'}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 block ${
                n.isRead
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                  : 'bg-slate-900 border-sky-800/80 text-slate-100 shadow-md'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-850 shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h3 className="text-xs font-bold text-white truncate">{n.title}</h3>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">{n.message}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 text-xs space-y-2">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <p>No notifications at the moment.</p>
        </div>
      )}
    </div>
  );
}
