'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/ClientShell';
import TaxiCard from '@/components/TaxiCard';
import JoinTaxiModal from '@/components/JoinTaxiModal';
import CreateTaxiModal from '@/components/CreateTaxiModal';
import { TaxiTripInfo } from '@/lib/types';
import { PICKUP_LOCATIONS } from '@/lib/constants';
import { Car, Plus, Filter, Search, Calendar, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function TaxisPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_RIDES'>('ALL');
  const [trips, setTrips] = useState<TaxiTripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [pickupFilter, setPickupFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTripForJoin, setSelectedTripForJoin] = useState<TaxiTripInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      let url = `/api/taxis?date=${dateFilter}`;
      if (pickupFilter !== 'ALL') url += `&pickupLocation=${encodeURIComponent(pickupFilter)}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;

      const res = await fetch(url);
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
  }, [dateFilter, pickupFilter, statusFilter]);

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

  const displayedTrips = activeTab === 'MY_RIDES'
    ? trips.filter(
        (t) =>
          t.hostId === user?.id ||
          t.bookings.some((b) => b.userId === user?.id && b.status === 'CONFIRMED')
      )
    : trips;

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-4 space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 truncate">
            <Car className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <span>Taxi Sharing Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium truncate">
            Bir Landing Ground ↔ Billing Launch (2,430m)
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Host Ride</span>
        </button>
      </div>

      {/* Toast */}
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

      {/* Segmented Tab */}
      <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner w-full">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all truncate ${
            activeTab === 'ALL'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Available Rides
        </button>
        <button
          onClick={() => setActiveTab('MY_RIDES')}
          className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all truncate ${
            activeTab === 'MY_RIDES'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Trips & Bookings
        </button>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-xs sm:text-sm w-full max-w-full">
        {/* Date Filter */}
        <div className="bg-slate-850/90 p-2 sm:p-2.5 rounded-2xl border border-slate-750 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-xs text-slate-400 block font-bold mb-0.5 sm:mb-1 uppercase tracking-wider">DATE</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="w-full min-w-0 bg-transparent text-slate-100 focus:outline-none text-xs sm:text-sm font-semibold cursor-pointer truncate"
          >
            <option value="today" className="bg-slate-900 text-white">Today</option>
            <option value="all" className="bg-slate-900 text-white">All</option>
          </select>
        </div>

        {/* Pickup Filter */}
        <div className="bg-slate-850/90 p-2 sm:p-2.5 rounded-2xl border border-slate-750 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-xs text-slate-400 block font-bold mb-0.5 sm:mb-1 uppercase tracking-wider">PICKUP</span>
          <select
            value={pickupFilter}
            onChange={(e) => setPickupFilter(e.target.value)}
            className="w-full min-w-0 bg-transparent text-slate-100 focus:outline-none text-xs sm:text-sm font-semibold truncate cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">All</option>
            {PICKUP_LOCATIONS.map((loc) => (
              <option key={loc} value={loc} className="bg-slate-900 text-white">
                {loc.split('(')[0].trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="bg-slate-850/90 p-2 sm:p-2.5 rounded-2xl border border-slate-750 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-xs text-slate-400 block font-bold mb-0.5 sm:mb-1 uppercase tracking-wider">STATUS</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full min-w-0 bg-transparent text-slate-100 focus:outline-none text-xs sm:text-sm font-semibold cursor-pointer truncate"
          >
            <option value="ALL" className="bg-slate-900 text-white">All</option>
            <option value="OPEN" className="bg-slate-900 text-white">Open</option>
            <option value="ALMOST_FULL" className="bg-slate-900 text-white">Almost</option>
            <option value="FULL" className="bg-slate-900 text-white">Full</option>
            <option value="COMPLETED" className="bg-slate-900 text-white">Done</option>
          </select>
        </div>
      </div>

      {/* Rides List */}
      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : displayedTrips.length > 0 ? (
        <div className="space-y-3">
          {displayedTrips.map((trip) => (
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
        <div className="text-center py-12 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-2">
          <Car className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            {activeTab === 'MY_RIDES' ? 'No Bookings or Hosted Rides' : 'No Taxis Found Matching Filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {activeTab === 'MY_RIDES'
              ? 'Join a shared taxi from the list or host a new trip to Billing.'
              : 'Try clearing your filters or create a new trip to the take-off.'}
          </p>
        </div>
      )}

      {/* Modals */}
      {selectedTripForJoin && (
        <JoinTaxiModal
          trip={selectedTripForJoin}
          currentUser={user}
          onClose={() => setSelectedTripForJoin(null)}
          onSuccess={() => {
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
            setToast({ type: 'success', text: 'Taxi trip published successfully!' });
            fetchTrips();
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}
    </div>
  );
}
