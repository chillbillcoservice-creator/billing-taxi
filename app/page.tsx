'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/ClientShell';
import TaxiCard from '@/components/TaxiCard';
import JoinTaxiModal from '@/components/JoinTaxiModal';
import CreateTaxiModal from '@/components/CreateTaxiModal';
import { TaxiTripInfo } from '@/lib/types';
import {
  Car,
  Wind,
  Plus,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sun,
  Activity,
  MessageSquare,
  Search,
  ShoppingBag,
  Award,
  Phone,
  ShieldCheck,
  Star,
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

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'share' | 'book'>('share');
  const [filterType, setFilterType] = useState<'ALL' | 'OPEN' | 'MY_RIDES'>('ALL');
  const [trips, setTrips] = useState<TaxiTripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
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

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taxis');
      const data = await res.json();
      if (res.ok) {
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error('Failed to load trips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    fetchTrips();
    const interval = setInterval(fetchWeather, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLeaveTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel your seat in this taxi?')) return;
    try {
      const res = await fetch(`/api/taxis/${tripId}/leave`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Seat booking cancelled. Your seat was freed.' });
        fetchTrips();
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
        fetchTrips();
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
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
        fetchTrips();
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Filter trips for Share Ride
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
      {/* 1. Compact Mountain Flight Telemetry Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-3.5 sm:p-4 shadow-xl w-full max-w-full space-y-2.5">
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

        {/* Metrics Strip */}
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

      {/* 2. Quick Category Shortcuts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black shrink-0">
          <Car className="w-3.5 h-3.5" />
          <span>Cabs</span>
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold shrink-0 transition-colors active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Pilot Chat</span>
        </Link>
        <Link
          href="/lost-found"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold shrink-0 transition-colors active:scale-95"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Lost & Found</span>
        </Link>
        <Link
          href="/marketplace"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold shrink-0 transition-colors active:scale-95"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Gear Market</span>
        </Link>
        <Link
          href="/permissions"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold shrink-0 transition-colors active:scale-95"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Permits</span>
        </Link>
      </div>

      {/* 3. Segmented Switch: Share Ride vs Book Cab */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl space-y-3">
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

      {/* Feedback Toast */}
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

      {/* Mode A: Share Ride */}
      {activeTab === 'share' ? (
        <div className="space-y-3">
          {/* Filter Pills + Post Ride Button */}
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
              className="text-xs sm:text-sm font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Post Ride</span>
            </button>
          </div>

          {/* Rides List */}
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-900/60 rounded-3xl animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : filteredTrips.length > 0 ? (
            <div className="space-y-2.5">
              {filteredTrips.map((trip) => (
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
            <div className="text-center py-14 px-4 rounded-3xl border border-dashed border-slate-800 space-y-2.5 bg-slate-950/40">
              <Car className="w-10 h-10 text-slate-600 mx-auto stroke-[1.5]" />
              <h3 className="text-sm font-bold text-slate-300">
                {filterType === 'MY_RIDES' ? 'No Bookings or Hosted Rides' : 'No active ride requests.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {filterType === 'MY_RIDES'
                  ? 'Join an open taxi or host a new ride to Billing Take-Off.'
                  : 'Post a ride or switch to "Book Cab" to call the local taxi union.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Post Ride Now</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Mode B: Book Cab Directory */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verified Bir-Billing Taxi Stands
            </span>
            <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Calling
            </span>
          </div>

          <div className="space-y-2.5">
            {LOCAL_CAB_SERVICES.map((agency) => (
              <div
                key={agency.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-lg flex items-center justify-between gap-3 hover:border-slate-700/80 transition-all"
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
                  <p className="text-xs text-slate-400 mb-2 truncate">{agency.tagline}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="text-slate-300 font-medium truncate">{agency.vehicle}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{agency.rating}</span>
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${agency.phone}`}
                  className="p-3 sm:px-4 sm:py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-amber-500/25 shrink-0 active:scale-95 transition-all"
                  title={`Call ${agency.name}`}
                >
                  <Phone className="w-4 h-4 fill-slate-950" />
                  <span className="hidden sm:inline text-xs font-black">Call</span>
                </a>
              </div>
            ))}
          </div>
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
            setFeedbackMsg({ type: 'success', text: 'Seat booked successfully!' });
            fetchTrips();
            setTimeout(() => setFeedbackMsg(null), 4000);
          }}
        />
      )}

      {showCreateModal && (
        <CreateTaxiModal
          currentUser={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setFeedbackMsg({ type: 'success', text: 'Taxi trip published successfully!' });
            fetchTrips();
            setTimeout(() => setFeedbackMsg(null), 4000);
          }}
        />
      )}
    </div>
  );
}
