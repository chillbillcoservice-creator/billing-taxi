'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/ClientShell';
import TaxiCard from '@/components/TaxiCard';
import JoinTaxiModal from '@/components/JoinTaxiModal';
import CreateTaxiModal from '@/components/CreateTaxiModal';
import { TaxiTripInfo } from '@/lib/types';
import { PICKUP_LOCATIONS } from '@/lib/constants';
import {
  Car,
  MessageSquare,
  Search,
  ShoppingBag,
  Award,
  Wind,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Compass,
  Cloud,
  Sun,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TaxiTripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterSeats, setFilterSeats] = useState('');
  const [selectedTripForJoin, setSelectedTripForJoin] = useState<TaxiTripInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTodayTrips = async () => {
    setLoading(true);
    try {
      let url = '/api/taxis?date=today';
      if (filterLocation !== 'ALL') url += `&pickupLocation=${encodeURIComponent(filterLocation)}`;
      if (filterSeats) url += `&minSeats=${filterSeats}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error('Failed to load today trips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayTrips();
  }, [filterLocation, filterSeats]);

  const handleLeaveTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel your seat in this taxi?')) return;
    try {
      const res = await fetch(`/api/taxis/${tripId}/leave`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Booking cancelled. Your seat was freed.' });
        fetchTodayTrips();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to cancel booking' });
      }
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Error cancelling booking' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel this entire taxi trip? All passengers will be notified.')) return;
    try {
      const res = await fetch(`/api/taxis/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Trip has been marked CANCELLED.' });
        fetchTodayTrips();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    try {
      const res = await fetch(`/api/taxis/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Trip marked completed.' });
        fetchTodayTrips();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-6">
      {/* Mountain Flight Telemetry Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 p-5 border border-sky-800/60 shadow-2xl">
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
          <Compass className="w-52 h-52 text-sky-400" />
        </div>

        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            Bir-Billing Launch Telemetry
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40 shadow-sm">
            FLYABLE 🟢
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1.5">
          Shared Mountain Taxis
        </h1>
        <p className="text-sm text-sky-200/90 leading-relaxed mb-4">
          Bir Landing Site (1,525m) → Billing Take-Off (2,430m). Book an open seat or share your vehicle.
        </p>

        {/* Live Weather Metrics */}
        <div className="grid grid-cols-3 gap-2.5 text-center bg-slate-950/75 rounded-2xl p-3 border border-sky-900/60 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-300 font-bold tracking-wider mb-1 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-sky-400" /> WIND
            </span>
            <span className="text-sm sm:text-base font-black text-sky-300">12-14 km/h</span>
            <span className="text-[11px] text-slate-400 font-semibold">SW Breeze</span>
          </div>
          <div className="border-x border-slate-800 flex flex-col items-center">
            <span className="text-xs text-slate-300 font-bold tracking-wider mb-1 flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-amber-400" /> CLOUDBASE
            </span>
            <span className="text-sm sm:text-base font-black text-amber-400">3,800m</span>
            <span className="text-[11px] text-slate-400 font-semibold">High Ceiling</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-300 font-bold tracking-wider mb-1 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-emerald-400" /> TEMP
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-400">18°C</span>
            <span className="text-[11px] text-slate-400 font-semibold">Sunny & Clear</span>
          </div>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2.5 shadow-lg ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-800'
              : 'bg-rose-950/90 text-rose-200 border border-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Module Navigation Quick Cards */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        <Link
          href="/taxis"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-950/80 border border-sky-800/80 hover:border-sky-500 hover:bg-sky-900/50 transition-all text-center group active:scale-95 shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-inner">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100">Taxis</span>
        </Link>

        <Link
          href="/chat"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500 hover:bg-slate-850 transition-all text-center group active:scale-95 shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-inner">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100">Chat</span>
        </Link>

        <Link
          href="/lost-found"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500 hover:bg-slate-850 transition-all text-center group active:scale-95 shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-inner">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100">Lost/Found</span>
        </Link>

        <Link
          href="/marketplace"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500 hover:bg-slate-850 transition-all text-center group active:scale-95 shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-inner">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100">Market</span>
        </Link>

        <Link
          href="/permissions"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500 hover:bg-slate-850 transition-all text-center group active:scale-95 shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-inner">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-100">Permits</span>
        </Link>
      </div>

      {/* Section Header: TODAY'S BILLING TAXIS */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                TODAY'S BILLING TAXIS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-extrabold border border-sky-500/30">
                {trips.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Available rides departing today</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Create Taxi</span>
          </button>
        </div>

        {/* Clean, Non-Overflowing Responsive Filters */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <div className="flex items-center gap-2 bg-slate-850/90 border border-slate-750 rounded-2xl px-3 h-12 shadow-sm">
            <Filter className="w-4 h-4 text-sky-400 shrink-0" />
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full bg-transparent text-slate-100 focus:outline-none text-sm font-semibold truncate cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Pickup Spots</option>
              {PICKUP_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-850/90 border border-slate-750 rounded-2xl px-3 h-12 shadow-sm">
            <select
              value={filterSeats}
              onChange={(e) => setFilterSeats(e.target.value)}
              className="w-full bg-transparent text-slate-100 focus:outline-none text-sm font-semibold truncate cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">Any Seats</option>
              <option value="1" className="bg-slate-900 text-white">1+ Seats Open</option>
              <option value="2" className="bg-slate-900 text-white">2+ Seats Open</option>
              <option value="4" className="bg-slate-900 text-white">4+ Seats Open</option>
            </select>
          </div>

          <button
            onClick={fetchTodayTrips}
            className="h-12 w-12 rounded-2xl bg-slate-850/90 border border-slate-750 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center shrink-0 transition-colors shadow-sm active:scale-95"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="space-y-3">
            {trips.map((trip) => (
              <TaxiCard
                key={trip.id}
                trip={trip}
                currentUser={user}
                onJoinClick={(t) => setSelectedTripForJoin(t)}
                onLeaveClick={handleLeaveTrip}
                onCancelTrip={handleCancelTrip}
                onCompleteTrip={handleCompleteTrip}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 space-y-2">
            <Car className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No Taxis Listed Yet Today</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Be the first to create a taxi trip to Billing Take-Off Point or check back shortly.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Ride</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTripForJoin && (
        <JoinTaxiModal
          trip={selectedTripForJoin}
          currentUser={user}
          onClose={() => setSelectedTripForJoin(null)}
          onSuccess={() => {
            setFeedbackMsg({ type: 'success', text: 'Seat booked successfully! See you at pickup.' });
            fetchTodayTrips();
            setTimeout(() => setFeedbackMsg(null), 4000);
          }}
        />
      )}

      {showCreateModal && (
        <CreateTaxiModal
          currentUser={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setFeedbackMsg({ type: 'success', text: 'New taxi trip published successfully!' });
            fetchTodayTrips();
            setTimeout(() => setFeedbackMsg(null), 4000);
          }}
        />
      )}
    </div>
  );
}
