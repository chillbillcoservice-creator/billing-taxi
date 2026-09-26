'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/ClientShell';
import TaxiCard from '@/components/TaxiCard';
import JoinTaxiModal from '@/components/JoinTaxiModal';
import CreateTaxiModal from '@/components/CreateTaxiModal';
import { TaxiTripInfo } from '@/lib/types';
import {
  Car,
  Plus,
  Phone,
  CheckCircle,
  AlertTriangle,
  Star,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const LOCAL_CAB_SERVICES = [
  {
    id: 'union',
    name: 'Bir Taxi Operators Union',
    tagline: 'Main Chowgan Taxi Stand • Fixed Govt Rates',
    phone: '+919805054123',
    displayPhone: '+91 98050 54123',
    rating: 4.8,
    vehicle: 'Sedan / SUV / 4x4',
    badge: 'Official Union',
  },
  {
    id: 'bolero',
    name: 'Billing 4x4 Bolero Drivers',
    tagline: 'Takeoff Specialists • Mountain Off-road 4WD',
    phone: '+919816087654',
    displayPhone: '+91 98160 87654',
    rating: 4.9,
    vehicle: 'Mahindra Bolero 4x4 Camper',
    badge: 'Mountain 4WD',
  },
  {
    id: 'chowgan',
    name: 'Tibetan Colony & Chowgan Cabs',
    tagline: 'Local Sightseeing & Railway/Airport Pickups',
    phone: '+917018012345',
    displayPhone: '+91 70180 12345',
    rating: 4.7,
    vehicle: 'Alto / Dzire / Innova',
    badge: 'Local & Outstation',
  },
  {
    id: 'sos',
    name: 'Billing Pilot Retrieval & Night 4x4',
    tagline: 'Landed XC Pilot Recovery • 24/7 Mountain Dispatch',
    phone: '+919418099887',
    displayPhone: '+91 94180 99887',
    rating: 5.0,
    vehicle: 'High-Clearance 4x4 Rescue Bolero',
    badge: 'Pilot Recovery',
  },
];

export default function TaxisPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'share' | 'book'>('share');
  const [filterType, setFilterType] = useState<'ALL' | 'OPEN' | 'MY_RIDES'>('ALL');
  const [trips, setTrips] = useState<TaxiTripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripForJoin, setSelectedTripForJoin] = useState<TaxiTripInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxis');
      const data = await res.json();
      if (res.ok) {
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleLeaveTrip = async (tripId: string) => {
    if (!confirm('Cancel your booking on this taxi?')) return;
    try {
      const res = await fetch(`/api/taxis/${tripId}/leave`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', text: 'Seat booking cancelled.' });
        fetchTrips();
      } else {
        setToast({ type: 'error', text: data.error || 'Failed to leave trip' });
      }
    } catch (e: any) {
      setToast({ type: 'error', text: e.message });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('Cancel this entire trip?')) return;
    try {
      const res = await fetch(`/api/taxis/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setToast({ type: 'success', text: 'Trip cancelled' });
        fetchTrips();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (filterType === 'OPEN') {
      return t.status === 'OPEN' || t.status === 'ALMOST_FULL';
    }
    if (filterType === 'MY_RIDES') {
      return (
        t.hostId === user?.id ||
        t.bookings.some((b) => b.userId === user?.id && b.status === 'CONFIRMED')
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-4 space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Travel & Cabs Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Car className="w-7 h-7 text-amber-400" />
            <span>Travel & Cabs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Book a taxi or share a ride to takeoff.
          </p>
        </div>

        {/* Segmented Switch: Share Ride vs Book Cab */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
              activeTab === 'share'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Share Ride
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
              activeTab === 'book'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Book Cab
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2.5 shadow-lg w-full ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border border-emerald-800'
              : 'bg-rose-950 text-rose-200 border border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="truncate">{toast.text}</span>
        </div>
      )}

      {/* Mode 1: Book Cab (Local Directory) */}
      {activeTab === 'book' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verified Bir-Billing Taxi Stands
            </span>
            <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Calling
            </span>
          </div>

          <div className="space-y-3">
            {LOCAL_CAB_SERVICES.map((agency) => (
              <div
                key={agency.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-4.5 shadow-lg flex items-center justify-between gap-3 hover:border-slate-700/80 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-black text-slate-100 text-sm sm:text-base leading-tight">
                      {agency.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {agency.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-1.5">{agency.tagline}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {agency.rating}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-medium">{agency.vehicle}</span>
                  </div>
                </div>

                <a
                  href={`tel:${agency.phone}`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                  title={`Call ${agency.name}`}
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Mode 2: Share Ride */
        <div className="space-y-3.5">
          {/* Simple Clean Filters Bar matching screenshot */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filterType === 'ALL'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setFilterType('OPEN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filterType === 'OPEN'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OPEN
              </button>
              <button
                onClick={() => setFilterType('MY_RIDES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filterType === 'MY_RIDES'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                MY RIDES
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs sm:text-sm font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 py-1.5 px-2.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Post Ride</span>
            </button>
          </div>

          {/* Rides List */}
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-900/60 rounded-3xl animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : filteredTrips.length > 0 ? (
            <div className="space-y-3">
              {filteredTrips.map((trip) => (
                <TaxiCard
                  key={trip.id}
                  trip={trip}
                  currentUser={user}
                  onJoinClick={(t) => setSelectedTripForJoin(t)}
                  onLeaveClick={handleLeaveTrip}
                  onCancelTrip={handleCancelTrip}
                />
              ))}
            </div>
          ) : (
            /* Minimalist Dashed Empty State from screenshot */
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 space-y-2.5 bg-slate-950/40">
              <Car className="w-10 h-10 text-slate-600 mx-auto stroke-[1.5]" />
              <h3 className="text-sm font-bold text-slate-300">
                {filterType === 'MY_RIDES' ? 'No Bookings or Hosted Rides' : 'No active ride requests.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {filterType === 'MY_RIDES'
                  ? 'Join an open taxi or host a new ride to Billing Take-Off.'
                  : 'Post a ride or switch to "Book Cab" to call the local taxi union.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedTripForJoin && (
        <JoinTaxiModal
          trip={selectedTripForJoin}
          currentUser={user}
          onClose={() => setSelectedTripForJoin(null)}
          onSuccess={() => {
            setSelectedTripForJoin(null);
            setToast({ type: 'success', text: 'Seat booked successfully!' });
            fetchTrips();
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}

      {showCreateModal && (
        <CreateTaxiModal
          currentUser={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setToast({ type: 'success', text: 'Taxi trip published successfully!' });
            fetchTrips();
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}
    </div>
  );
}
