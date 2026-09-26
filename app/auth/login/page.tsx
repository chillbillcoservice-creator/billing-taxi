'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ClientShell';
import { Compass, Lock, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      await refreshUser();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-sky-600/30">
          <Compass className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">BILLING TAXI</h1>
        <p className="text-xs text-slate-400">
          Sign in to access shared taxis, launch chat, gear marketplace, and partner permits.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-sm">
        <div>
          <label className="block font-bold text-slate-200 mb-1.5">
            Username, Phone, or Email
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="e.g. pilot_arun or admin"
              className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl pl-11 pr-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-200 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl pl-11 pr-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 min-h-[50px] rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-black text-base shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          {loading ? <span>Authenticating...</span> : <span>Sign In</span>}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Demo Credentials Quick Click */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Demo Accounts (1-Tap Fill)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => fillDemo('admin', 'admin123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Admin</span>
            <span className="text-[10px] text-amber-400">admin / admin123</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo('pilot_arun', 'pilot123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Pilot Arun</span>
            <span className="text-[10px] text-sky-400">pilot_arun / pilot123</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo('himalayan_sky', 'partner123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Partner Operator</span>
            <span className="text-[10px] text-rose-400">himalayan_sky / partner123</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo('driver_ramesh', 'admin123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Driver Ramesh</span>
            <span className="text-[10px] text-emerald-400">driver_ramesh / admin123</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Don't have an account yet?{' '}
        <Link href="/auth/register" className="text-sky-400 hover:underline font-bold">
          Register here
        </Link>
      </div>
    </div>
  );
}
