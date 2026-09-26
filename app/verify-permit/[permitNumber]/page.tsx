'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Building,
  Calendar,
  Users,
  Award,
  Compass,
} from 'lucide-react';

interface VerificationData {
  permitNumber: string;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  isExpired: boolean;
  scope: string;
  issuedDate: string;
  expiryDate: string;
  partner?: {
    name: string;
    phone: string;
  };
  application?: {
    companyName: string;
    registrationNumber: string;
    businessType: string;
    pilotCount: number;
    insurancePolicyNo: string;
  };
  issuedBy?: {
    name: string;
  };
}

export default function VerifyPermitPage() {
  const params = useParams();
  const permitNumber = params?.permitNumber as string;
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permitNumber) return;

    const verify = async () => {
      try {
        const res = await fetch(`/api/permissions/permits/${permitNumber}`);
        const json = await res.json();
        if (res.ok) {
          setData(json.permit);
        } else {
          setError(json.error || 'Invalid permit or not found in association registry');
        }
      } catch (e: any) {
        setError(e.message || 'Verification service error');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [permitNumber]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 max-w-md mx-auto">
      {/* Official Government / Association Crest Banner */}
      <div className="text-center py-4 space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-amber-500 mx-auto flex items-center justify-center shadow-lg">
          <Compass className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-lg font-black text-white tracking-wide">
          HIMACHAL PRADESH PARAGLIDING ASSOCIATION
        </h1>
        <p className="text-[11px] text-sky-400 font-semibold uppercase tracking-widest">
          Official Take-Off & Landing Clearance Registry
        </p>
      </div>

      {loading ? (
        <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 text-center animate-pulse space-y-3">
          <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto" />
          <div className="h-4 bg-slate-800 rounded w-48 mx-auto" />
          <div className="h-3 bg-slate-800 rounded w-32 mx-auto" />
        </div>
      ) : error ? (
        <div className="bg-rose-950/70 border-2 border-rose-600 rounded-3xl p-6 text-center space-y-3 shadow-xl">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-white">INVALID / UNVERIFIED PERMIT</h2>
          <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
          <div className="pt-2 text-[11px] text-slate-400">
            Searched Registry ID: <span className="font-mono text-white">{permitNumber}</span>
          </div>
        </div>
      ) : data ? (
        <div
          className={`border-2 rounded-3xl p-5 shadow-2xl space-y-4 ${
            data.status === 'VALID'
              ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/60 border-emerald-500'
              : 'bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/60 border-rose-500'
          }`}
        >
          {/* Status Verdict Header */}
          <div className="text-center py-2 border-b border-slate-800 space-y-1">
            {data.status === 'VALID' ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-sm border border-emerald-500/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>OFFICIALLY VERIFIED & VALID</span>
                </div>
                <p className="text-[11px] text-emerald-300/80">Authorized for operations at Bir-Billing Take-off</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-black text-sm border border-rose-500/40">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>{data.status}</span>
                </div>
                <p className="text-[11px] text-rose-300/80">This permit has lapsed or been revoked</p>
              </>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Permit Number</span>
              <span className="font-mono text-base font-black text-amber-400">{data.permitNumber}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Operator / Company</span>
              <span className="font-bold text-white text-sm block">
                {data.application?.companyName || data.partner?.name}
              </span>
              <span className="text-slate-400 text-[11px]">
                Type: {data.application?.businessType} • Reg: {data.application?.registrationNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">AUTHORIZED PILOTS</span>
                <span className="font-bold text-slate-200">{data.application?.pilotCount || 1} Pilots</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">INSURANCE POLICY</span>
                <span className="font-bold text-slate-200 truncate block">
                  {data.application?.insurancePolicyNo || 'Verified'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">ISSUED ON</span>
                <span className="font-semibold text-slate-200">
                  {new Date(data.issuedDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">VALID UNTIL</span>
                <span
                  className={`font-bold ${
                    data.status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {new Date(data.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Approved Scope</span>
              <span className="font-semibold text-sky-300 block">{data.scope}</span>
            </div>

            {data.issuedBy && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Verified by Flight Controller:</span>
                <span className="font-bold text-slate-200">{data.issuedBy.name}</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="text-center pt-4">
        <a
          href="/"
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline"
        >
          Return to Billing Taxi Home
        </a>
      </div>
    </div>
  );
}
