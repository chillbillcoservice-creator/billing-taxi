'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/ClientShell';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  Compass,
  Edit3,
  CheckCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [glider, setGlider] = useState(user?.pilotGlider || '');
  const [license, setLicense] = useState(user?.pilotLicenseNumber || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Quick Account Switcher for pair-programming & evaluation demo
  const handleQuickSwitch = async (username: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username, password: pass }),
      });
      if (res.ok) {
        await refreshUser();
        setToast(`Switched account to @${username}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          pilotGlider: glider,
          pilotLicenseNumber: license,
        }),
      });

      if (res.ok) {
        await refreshUser();
        setIsEditing(false);
        setToast('Profile updated successfully!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <User className="w-16 h-16 text-slate-600" />
        <h2 className="text-base font-bold text-white">Not Signed In</h2>
        <p className="text-xs text-slate-400">Sign in to manage your paragliding profile, bookings, and permits.</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="px-6 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-slate-900 to-sky-950 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 border-2 border-sky-400 flex items-center justify-center font-black text-xl text-white shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white">{user.name}</h1>
                {user.isPilotVerified && (
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <span className="text-xs text-slate-400">@{user.username}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                  {user.role}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {user.bio && (
          <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed italic">
            "{user.bio}"
          </p>
        )}
      </div>

      {toast && (
        <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Edit Profile Form */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white">Edit Pilot Details</h3>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Current Paraglider Wing</label>
            <input
              type="text"
              value={glider}
              onChange={(e) => setGlider(e.target.value)}
              placeholder="e.g. Gin Bolero 6, Ozone Rush 5"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">FAI / BHPPA License Number</label>
            <input
              type="text"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="e.g. FAI-IND-9941"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Pilot Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {/* Paragliding Flight Credentials */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Pilot Flight Credentials
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Wing / Glider</span>
            <span className="font-bold text-white">{user.pilotGlider || 'Not specified'}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">License Number</span>
            <span className="font-mono font-bold text-amber-400">{user.pilotLicenseNumber || 'Unregistered'}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Phone</span>
            <span className="font-semibold text-slate-200">{user.phone}</span>
          </div>
        </div>
      </div>

      {/* Demo Account Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Demo Role Switcher (Instant Testing)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Switch test accounts to evaluate Admin, Pilot, Partner, and Driver roles:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleQuickSwitch('admin', 'admin123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Capt. Vikram</span>
            <span className="text-[10px] text-amber-400">ADMIN (BHPPA Lead)</span>
          </button>

          <button
            onClick={() => handleQuickSwitch('pilot_arun', 'pilot123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Arun Verma</span>
            <span className="text-[10px] text-sky-400">PILOT / MEMBER</span>
          </button>

          <button
            onClick={() => handleQuickSwitch('himalayan_sky', 'partner123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Himalayan Sky</span>
            <span className="text-[10px] text-rose-400">PARTNER (Tandem Agency)</span>
          </button>

          <button
            onClick={() => handleQuickSwitch('driver_ramesh', 'admin123')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <span className="font-bold text-white block">Ramesh Bolero</span>
            <span className="text-[10px] text-emerald-400">LOCAL DRIVER 4x4</span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-900/80 flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
