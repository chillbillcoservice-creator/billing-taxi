'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/ClientShell';
import { PartnerApplicationInfo, PermitInfo } from '@/lib/types';
import { BUSINESS_TYPES, DOCUMENT_TYPES, PERMIT_SCOPES } from '@/lib/constants';
import Link from 'next/link';
import {
  Award,
  FileCheck,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer,
  ShieldCheck,
  Plus,
  ExternalLink,
  QrCode,
  Building,
  Users,
  FileText,
  X,
} from 'lucide-react';

export default function PermissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'MY_PERMITS' | 'MY_APPLICATIONS' | 'NEW_APPLICATION'>('MY_PERMITS');
  const [applications, setApplications] = useState<PartnerApplicationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPermitForModal, setSelectedPermitForModal] = useState<PermitInfo | null>(null);

  // Application form states
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState(user?.name || '');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0].id);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pilotCount, setPilotCount] = useState('2');
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('');
  const [documents, setDocuments] = useState<
    Array<{ docType: string; title: string; fileUrl: string; fileSize: number; mimeType: string }>
  >([]);
  const [currentDocType, setCurrentDocType] = useState(DOCUMENT_TYPES[0].id);
  const [currentDocTitle, setCurrentDocTitle] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/permissions/applications');
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isSecure', 'true'); // Upload to secure folder!

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setDocuments([
          ...documents,
          {
            docType: currentDocType,
            title: currentDocTitle.trim() || file.name,
            fileUrl: data.url,
            fileSize: data.size,
            mimeType: data.mimeType,
          },
        ]);
        setCurrentDocTitle('');
      } else {
        alert(data.error || 'Document upload failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    if (documents.length === 0) {
      alert('Please attach at least one required verification document (Tourism registration, pilot license, or insurance certificate).');
      return;
    }

    setSubmittingApp(true);
    try {
      const res = await fetch('/api/permissions/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactPerson,
          businessType,
          registrationNumber,
          address,
          pilotCount,
          insurancePolicyNo,
          status: 'SUBMITTED',
          documents,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', text: 'Application submitted for BHPPA safety review!' });
        fetchApplications();
        setActiveTab('MY_APPLICATIONS');
        setCompanyName('');
        setRegistrationNumber('');
        setAddress('');
        setInsurancePolicyNo('');
        setDocuments([]);
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({ type: 'error', text: data.error || 'Failed to submit application' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSubmittingApp(false);
    }
  };

  const permits = applications
    .filter((a) => a.permit !== null && a.permit !== undefined)
    .map((a) => ({
      ...a.permit!,
      application: {
        companyName: a.companyName,
        registrationNumber: a.registrationNumber,
        businessType: a.businessType,
        pilotCount: a.pilotCount,
      },
    }));

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-4 space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Partner Permits & Clearance</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          Official paragliding operator clearance, digital permits & QR verification for Bir-Billing.
        </p>
      </div>

      {toast && (
        <div
          className={`p-3.5 text-sm font-semibold rounded-2xl flex items-center gap-2.5 shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-950 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950 border border-rose-800 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setActiveTab('MY_PERMITS')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            activeTab === 'MY_PERMITS' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Digital Permits ({permits.length})
        </button>
        <button
          onClick={() => setActiveTab('MY_APPLICATIONS')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            activeTab === 'MY_APPLICATIONS' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('NEW_APPLICATION')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            activeTab === 'NEW_APPLICATION' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          + Apply
        </button>
      </div>

      {/* TAB 1: DIGITAL PERMITS */}
      {activeTab === 'MY_PERMITS' && (
        <div className="space-y-4">
          {permits.length > 0 ? (
            permits.map((permit) => (
              <div
                key={permit.id}
                className="permit-card bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 border-2 border-sky-600/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
              >
                {/* Official Crest Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 shadow-md">
                      HP
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                        Himachal Tourism & BHPPA
                      </span>
                      <span className="text-xs font-black text-white tracking-wide">
                        DIGITAL COMMERCIAL FLIGHT PERMIT
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
                    VALID 🟢
                  </span>
                </div>

                {/* Permit Body */}
                <div className="py-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">PERMIT NUMBER</span>
                    <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                      {permit.permitNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">AUTHORIZED OPERATOR</span>
                    <span className="font-bold text-white text-sm">
                      {permit.application?.companyName || user?.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Reg: {permit.application?.registrationNumber} • {permit.application?.pilotCount} Certified Pilots
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ISSUED</span>
                      <span className="font-semibold text-slate-200">
                        {new Date(permit.issuedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">VALID UNTIL</span>
                      <span className="font-bold text-emerald-400">
                        {new Date(permit.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Presentation */}
                  <div className="flex items-center gap-4 bg-white p-3 rounded-2xl">
                    <img
                      src={permit.qrCodeData}
                      alt="Verification QR"
                      className="w-24 h-24 object-contain rounded-lg"
                    />
                    <div className="text-slate-950 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                        Launch Marshall Scan Pass
                      </span>
                      <p className="text-[11px] font-medium leading-tight">
                        Present this QR code to safety marshals at Billing Take-off (2,430m).
                      </p>
                      <Link
                        href={`/verify-permit/${permit.permitNumber}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Public Verification Link</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Print / Download Button */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between no-print">
                  <span className="text-[10px] text-slate-400">Official HP Paragliding Digital Pass</span>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-2">
              <Award className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No Digital Permits Issued Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Submit an operator permission application with your company documents to receive an official verified QR permit.
              </p>
              <button
                onClick={() => setActiveTab('NEW_APPLICATION')}
                className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
              >
                Start Application
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS TRACKER */}
      {activeTab === 'MY_APPLICATIONS' && (
        <div className="space-y-3">
          {applications.length > 0 ? (
            applications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{app.companyName}</h3>
                    <span className="text-[11px] text-slate-400 block">{app.businessType}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                      app.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : app.status === 'CHANGES_REQUIRED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Registration</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {app.registrationNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Submitted</span>
                    <span className="font-semibold text-slate-200">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Feedback notes from reviewer */}
                {app.changeRequestReason && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <span className="font-bold block mb-0.5">Safety Marshal Feedback:</span>
                    <p className="text-[11px] leading-relaxed">{app.changeRequestReason}</p>
                  </div>
                )}

                {/* Uploaded Documents List */}
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold mb-1">
                    Attached Documents ({app.documents.length})
                  </span>
                  <div className="space-y-1">
                    {app.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-850 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="font-medium text-slate-200 truncate">{doc.title}</span>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-[11px] font-bold shrink-0"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-2">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No Applications Submitted</h3>
              <p className="text-xs text-slate-500">
                You haven't filed any partner permission applications yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NEW APPLICATION FORM */}
      {activeTab === 'NEW_APPLICATION' && (
        <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Building className="w-4 h-4 text-sky-400" />
              <span>Company & Business Information</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company / Agency Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="e.g. Himalayan Paragliding Adventures Pvt. Ltd."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                  placeholder="Manager / Chief Pilot"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Business Type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label.split('(')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">HP Tourism / Reg No.</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  required
                  placeholder="e.g. HP-TOURISM-KGR-1092"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pilot Count</label>
                <input
                  type="number"
                  min="1"
                  value={pilotCount}
                  onChange={(e) => setPilotCount(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Aviation Insurance Policy No.</label>
              <input
                type="text"
                value={insurancePolicyNo}
                onChange={(e) => setInsurancePolicyNo(e.target.value)}
                required
                placeholder="e.g. ORIENTAL-AV-884019-2026"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Office Address in Bir</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Near Chougan Chowk, Bir Billing, Distt Kangra"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Secure Document Upload Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Mandatory Safety Documents (Protected Storage)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Documents are encrypted in an isolated directory and only accessible by authorized safety marshals and admins.
            </p>

            <div className="space-y-2">
              <select
                value={currentDocType}
                onChange={(e) => setCurrentDocType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={currentDocTitle}
                onChange={(e) => setCurrentDocTitle(e.target.value)}
                placeholder="Document description (e.g. 2026 Pilot Tandem License)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDocUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDoc}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold border border-slate-700 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingDoc ? 'Uploading Secure File...' : '+ Attach Document (PDF/Image)'}</span>
              </button>
            </div>

            {/* Attached Documents List */}
            {documents.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-slate-400 font-semibold block">Attached ({documents.length})</span>
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-850 border border-slate-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-medium text-slate-200 truncate">{doc.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submittingApp || documents.length === 0}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            {submittingApp ? 'Submitting Application...' : 'Submit Permission Application'}
          </button>
        </form>
      )}
    </div>
  );
}
