'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/ClientShell';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  Car,
  ShoppingBag,
  Search,
  Award,
  Flag,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Eye,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPLICATIONS' | 'USERS' | 'REPORTS' | 'AUDIT'>('OVERVIEW');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data lists
  const [applications, setApplications] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action states
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [validityMonths, setValidityMonths] = useState('12');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter for users
  const [userSearch, setUserSearch] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, usersRes, reportsRes, auditRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/permissions/applications?status=ALL'),
        fetch('/api/admin/users'),
        fetch('/api/admin/reports'),
        fetch('/api/admin/audit-logs'),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (appsRes.ok) setApplications((await appsRes.json()).applications);
      if (usersRes.ok) setUsersList((await usersRes.json()).users);
      if (reportsRes.ok) setReports((await reportsRes.json()).reports);
      if (auditRes.ok) setAuditLogs((await auditRes.json()).logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR'))) {
      router.push('/');
      return;
    }
    if (user) {
      fetchAdminData();
    }
  }, [user, authLoading]);

  // Permit Issue Action
  const handleIssuePermit = async (applicationId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/permissions/permits/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          validityMonths: parseInt(validityMonths, 10),
          scope: 'COMMERCIAL_TANDEM_OPERATIONS',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', text: `Permit ${data.permit.permitNumber} successfully generated and issued!` });
        setSelectedApp(null);
        fetchAdminData();
      } else {
        setToast({ type: 'error', text: data.error || 'Failed to issue permit' });
      }
    } catch (e: any) {
      setToast({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Application Review Action (Changes Required / Reject)
  const handleReviewApplication = async (applicationId: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/permissions/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes,
          changeRequestReason: changeReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', text: `Application updated to ${status}` });
        setSelectedApp(null);
        fetchAdminData();
      } else {
        setToast({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch (e: any) {
      setToast({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // User permission updates (Verify Pilot, Change Role, Mute)
  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setToast({ type: 'success', text: 'User permissions updated' });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setToast(null), 3000);
  };

  // Report resolution
  const handleResolveReport = async (reportId: string, status: 'REVIEWED' | 'DISMISSED') => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setToast({ type: 'success', text: `Report marked ${status}` });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setToast(null), 3000);
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Admin Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-white">Association Admin & Safety Control</h1>
          </div>
          <p className="text-xs text-slate-400">
            Bir-Billing Paragliding Flight Operations & Moderation
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`p-3 text-xs rounded-xl flex items-center gap-2 shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950 border border-rose-800 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Nav Tabs */}
      <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto text-xs no-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Telemetry' },
          { id: 'APPLICATIONS', label: `Permits (${applications.filter((a) => a.status === 'SUBMITTED').length})` },
          { id: 'USERS', label: `Users (${usersList.length})` },
          { id: 'REPORTS', label: `Reports (${reports.filter((r) => r.status === 'PENDING').length})` },
          { id: 'AUDIT', label: 'Audit Trail' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 font-bold rounded-xl transition-all shrink-0 ${
              activeTab === tab.id ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TELEMETRY */}
      {activeTab === 'OVERVIEW' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold">REGISTERED USERS</span>
              </div>
              <span className="text-xl font-black text-white">{stats.totalUsers}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">{stats.activeUsers} Active</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">TODAY'S TAXIS</span>
              </div>
              <span className="text-xl font-black text-white">{stats.todayTrips}</span>
              <span className="text-[10px] text-sky-400 block mt-0.5">{stats.openSeatsToday} seats open</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">ACTIVE PERMITS</span>
              </div>
              <span className="text-xl font-black text-white">{stats.activePermits}</span>
              <span className="text-[10px] text-amber-400 block mt-0.5">{stats.pendingApplications} Pending Review</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Flag className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold">CHAT REPORTS</span>
              </div>
              <span className="text-xl font-black text-white">{stats.pendingReports}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pending safety triage</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-semibold mb-1">MARKETPLACE LISTINGS</span>
              <span className="text-lg font-black text-white">{stats.totalMarketplace} Items</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-semibold mb-1">LOST & FOUND POSTS</span>
              <span className="text-lg font-black text-white">{stats.totalLostFound} Cases</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PARTNER APPLICATIONS REVIEW */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-3">
          <span className="text-xs text-slate-400 block font-semibold">
            Partner Applications ({applications.length})
          </span>

          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{app.companyName}</h3>
                  <span className="text-slate-400 text-[11px]">
                    {app.businessType} • Reg: {app.registrationNumber}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    app.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : app.status === 'CHANGES_REQUIRED'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {app.status}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div>Contact: <b className="text-white">{app.contactPerson}</b> ({app.partner.phone})</div>
                <div>Pilots: <b className="text-white">{app.pilotCount}</b> • Insurance: <b className="text-white">{app.insurancePolicyNo}</b></div>
                <div>Office: <span className="text-slate-300">{app.address}</span></div>
              </div>

              {/* Secure Documents List */}
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold mb-1">
                  Submitted Documents ({app.documents.length})
                </span>
                <div className="space-y-1">
                  {app.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-850 border border-slate-800"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-slate-200 truncate">{doc.title}</span>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold rounded-lg text-[10px]"
                      >
                        Inspect
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedApp(app)}
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                >
                  Review & Issue Permit
                </button>
              </div>
            </div>
          ))}

          {/* Modal for Review / Issuing Permit */}
          {selectedApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl relative my-8 text-slate-100 space-y-4 text-xs">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-base font-bold text-white">
                  Permit Review: {selectedApp.companyName}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Internal Admin Notes</label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Verified FAI tandem ratings for all pilots"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Permit Validity</label>
                    <select
                      value={validityMonths}
                      onChange={(e) => setValidityMonths(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    >
                      <option value="6">6 Months (Autumn Season)</option>
                      <option value="12">12 Months (Full Annual)</option>
                      <option value="24">24 Months (Two Seasons)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Change Request Reason (if changes required)
                    </label>
                    <input
                      type="text"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder="e.g. Please re-upload updated passenger liability insurance"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                  <button
                    onClick={() => handleIssuePermit(selectedApp.id)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    {actionLoading ? 'Processing...' : 'Approve & Issue Digital QR Permit'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewApplication(selectedApp.id, 'CHANGES_REQUIRED')}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleReviewApplication(selectedApp.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. USER MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-3">
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search pilot by name, username, phone..."
            className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400"
          />

          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-slate-400 text-[11px]">@{u.username} • {u.phone}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-sky-400 border border-slate-700">
                    {u.role}
                  </span>
                </div>

                {u.pilotGlider && (
                  <span className="text-[11px] text-slate-300 block">
                    Wing: <b className="text-white">{u.pilotGlider}</b>
                  </span>
                )}

                {/* Quick Moderation Toggles */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleUpdateUser(u.id, { isPilotVerified: !u.isPilotVerified })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      u.isPilotVerified
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {u.isPilotVerified ? '✓ Verified Pilot' : '+ Verify Pilot'}
                  </button>

                  <button
                    onClick={() => handleUpdateUser(u.id, { muteMinutes: u.mutedUntil ? 0 : 60 })}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30"
                  >
                    {u.mutedUntil ? 'Unmute' : 'Mute 1h'}
                  </button>

                  <select
                    value={u.role}
                    onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                    className="bg-slate-800 text-slate-300 text-[10px] rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="PARTNER">Partner</option>
                    <option value="MODERATOR">Marshal / Mod</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CHAT REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-3">
          <span className="text-xs text-slate-400 font-semibold block">
            Flagged Content Queue ({reports.length})
          </span>

          {reports.length > 0 ? (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs"
              >
                <div className="flex justify-between items-start">
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5" />
                    <span>Reason: {report.reason}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {report.status}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                  <span className="text-[10px] text-slate-500 block">
                    Message from @{report.message?.sender?.username}:
                  </span>
                  "{report.message?.content}"
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleResolveReport(report.id, 'REVIEWED')}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'DISMISSED')}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No pending reports. Community chat is clean!
            </div>
          )}
        </div>
      )}

      {/* 5. AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-2">
          <span className="text-xs text-slate-400 font-semibold block">Recent Admin Actions</span>
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-xs space-y-1"
            >
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span className="font-bold text-sky-400">{log.action}</span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-200">{log.details}</p>
              <span className="text-[10px] text-slate-500 block">
                Controller: {log.admin.name} (@{log.admin.username})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
