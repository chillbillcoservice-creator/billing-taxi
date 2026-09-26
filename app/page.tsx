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
  Wind,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sun,
  Activity,
} from 'lucide-react';

interface WeatherData {
  windSpeed: number;
  windGusts: number;
  temperature: number;
  humidity: number;
  windDirection: string;
  windDegrees: number;
  condition: string;
  flightStatus: string;
  statusBadge: string;
  statusColor: 'emerald' | 'amber' | 'rose' | 'sky';
  updatedAt: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TaxiTripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterSeats, setFilterSeats] = useState('');
  const [selectedTripForJoin, setSelectedTripForJoin] = useState<TaxiTripInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather');
      const json = await res.json();
      if (json.data) {
        setWeather(json.data);
      }
    } catch (err) {
      console.error('Failed to load live weather', err);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex-1 flex flex-col p-3.5 sm:p-4 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Mountain Flight Telemetry Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-3.5 sm:p-4 shadow-xl w-full max-w-full space-y-2.5">
        {/* Header: Live Beacon + Title + Refresh + Flyable Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-sky-400 truncate">
              Bir-Billing Launch Telemetry
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchWeather}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh live telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <span
              className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-black border tracking-wide transition-colors ${
                weather?.statusColor === 'rose'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : weather?.statusColor === 'amber'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : weather?.statusColor === 'sky'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {weather ? weather.statusBadge : 'LIVE 🟢'}
            </span>
          </div>
        </div>

        {/* Route Subtitle */}
        <p className="text-xs sm:text-sm text-slate-300 leading-snug">
          Bir Landing Site (1,525m) → Billing Take-Off (2,430m). Book an open seat or share your vehicle.
        </p>

        {/* Live Weather Metrics Strip */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-center bg-slate-950/80 rounded-2xl p-2 sm:p-2.5 border border-slate-800/80 w-full">
          <div className="flex flex-col items-center min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold tracking-wider mb-0.5 flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-400 shrink-0" /> WIND
            </span>
            <span className="text-xs sm:text-sm font-black text-sky-300 truncate w-full">
              {weather ? `${weather.windSpeed} km/h` : '...'}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold truncate w-full">
              {weather ? `${weather.windDirection} (${weather.windDegrees}°)` : 'Live Wind'}
            </span>
          </div>

          <div className="border-x border-slate-800 flex flex-col items-center min-w-0 px-1">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold tracking-wider mb-0.5 flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400 shrink-0" /> GUSTS
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-400 truncate w-full">
              {weather ? `${weather.windGusts} km/h` : '...'}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold truncate w-full">
              {weather ? (weather.windGusts > 25 ? 'Strong Peak' : 'Peak Gust') : 'Peak'}
            </span>
          </div>

          <div className="flex flex-col items-center min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold tracking-wider mb-0.5 flex items-center gap-1">
              <Sun className="w-3 h-3 text-emerald-400 shrink-0" /> TAKEOFF TEMP
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 truncate w-full">
              {weather ? `${weather.temperature}°C` : '...'}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold truncate w-full">
              {weather ? weather.condition : '2,430m'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2.5 shadow-lg w-full max-w-full ${
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
          <span className="truncate">{feedbackMsg.text}</span>
        </div>
      )}



      {/* Section Header: TODAY'S BILLING TAXIS */}
      <div className="space-y-3.5 w-full max-w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                TODAY'S BILLING TAXIS
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-extrabold border border-sky-500/30 shrink-0">
                {trips.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate">Available rides departing today</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Create Taxi</span>
          </button>
        </div>

        {/* Clean, Non-Overflowing Responsive Filters */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center w-full max-w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-850/90 border border-slate-750 rounded-2xl px-2.5 sm:px-3 h-12 shadow-sm min-w-0">
            <Filter className="w-4 h-4 text-sky-400 shrink-0" />
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full min-w-0 bg-transparent text-slate-100 focus:outline-none text-xs sm:text-sm font-semibold truncate cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Pickup Spots</option>
              {PICKUP_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-850/90 border border-slate-750 rounded-2xl px-2.5 sm:px-3 h-12 shadow-sm min-w-0">
            <select
              value={filterSeats}
              onChange={(e) => setFilterSeats(e.target.value)}
              className="w-full min-w-0 bg-transparent text-slate-100 focus:outline-none text-xs sm:text-sm font-semibold truncate cursor-pointer"
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
