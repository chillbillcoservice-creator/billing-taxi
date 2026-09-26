'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ClientShell';
import { Compass, Lock, User, Phone, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'PARTNER'>('MEMBER');
  const [pilotGlider, setPilotGlider] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          phone,
          email,
          password,
          role,
          pilotGlider,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      await refreshUser();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-6 space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white">Join Billing Taxi</h1>
        <p className="text-xs text-slate-400">
          Create your account for the Bir-Billing paragliding community.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3 text-xs">
        {/* Account Role Selector */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('MEMBER')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              role === 'MEMBER' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Solo Pilot / Rider
          </button>
          <button
            type="button"
            onClick={() => setRole('PARTNER')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              role === 'PARTNER' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
            }`}
          >
            Commercial Partner
          </button>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Arun Sharma"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Username (Handle)</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="e.g. arun_sky"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+91 98050 XXXXX"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@fly.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">
            Paraglider Model / Wing (Optional)
          </label>
          <input
            type="text"
            value={pilotGlider}
            onChange={(e) => setPilotGlider(e.target.value)}
            placeholder="e.g. Gin Bolero 6, Ozone Delta 4"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <span>Creating Account...</span> : <span>Complete Registration</span>}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-slate-400">
        Already registered?{' '}
        <Link href="/auth/login" className="text-sky-400 hover:underline font-bold">
          Sign in
        </Link>
      </div>
    </div>
  );
}
