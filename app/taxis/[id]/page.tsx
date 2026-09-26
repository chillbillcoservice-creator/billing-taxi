'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/ClientShell';
import TaxiCard from '@/components/TaxiCard';
import JoinTaxiModal from '@/components/JoinTaxiModal';
import { TaxiTripInfo } from '@/lib/types';
import {
  ArrowLeft,
  Users,
  Phone,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Car,
  MessageCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function TaxiTripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<TaxiTripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTrip = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/taxis/${tripId}`);
      const data = await res.json();
      if (res.ok && data.trip) {
        setTrip(data.trip);
      } else {
        setError(data.error || 'Taxi trip not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const handleLeaveTrip = async () => {
    if (!confirm('Are you sure you want to cancel your seat booking in this taxi?')) return;
    try {
      const res = await fetch(`/api/taxis/${tripId}/leave`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', text: 'Seat booking cancelled. Your seat was freed.' });
        fetchTrip();
      } else {
        setToast({ type: 'error', text: data.error || 'Failed to cancel booking' });
      }
    } catch (e: any) {
      setToast({ type: 'error', text: e.message || 'Error cancelling booking' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancelTrip = async () => {
    if (!confirm('Are you sure you want to cancel this entire taxi trip? All passengers will be notified.')) return;
    try {
      const res = await fetch(`/api/taxis/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setToast({ type: 'success', text: 'Trip has been marked CANCELLED.' });
        fetchTrip();
      }
    } catch (e: any) {
      console.error(e);
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleCompleteTrip = async () => {
    try {
      const res = await fetch(`/api/taxis/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) {
        setToast({ type: 'success', text: 'Trip marked as COMPLETED.' });
        fetchTrip();
      }
    } catch (e: any) {
      console.error(e);
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Billing Taxi: ${trip?.pickupTime} ride to Billing Take-Off`,
          text: `Join our shared mountain taxi from ${trip?.pickupLocation} to ${trip?.destination}!`,
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setToast({ type: 'success', text: 'Trip link copied to clipboard!' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-4 space-y-4 max-w-md mx-auto w-full">
        <div className="h-8 w-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
        <div className="h-40 bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto w-full">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Taxi Trip Not Found</h2>
        <p className="text-sm text-slate-400">
          This ride may have departed, been cancelled, or the link has expired.
        </p>
        <Link
          href="/taxis"
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-md transition-all active:scale-95"
        >
          View Available Taxis
        </Link>
      </div>
    );
  }

  const isHost = user?.id === trip.hostId;
  const confirmedBookings = trip.bookings || [];
  const bookedSeatsCount = trip.totalSeats - trip.availableSeats;

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-4 space-y-4 max-w-md mx-auto w-full max-w-full overflow-x-hidden">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/taxis"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Taxis</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-all active:scale-95"
          title="Share trip with pilots on WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Share Ride</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-lg w-full ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-800'
              : 'bg-rose-950/90 text-rose-200 border border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span className="truncate">{toast.text}</span>
        </div>
      )}

      {/* Main Taxi Card */}
      <TaxiCard
        trip={trip}
        currentUser={user}
        onJoinClick={() => setShowJoinModal(true)}
        onLeaveClick={handleLeaveTrip}
        onCancelTrip={handleCancelTrip}
        onCompleteTrip={handleCompleteTrip}
      />

      {/* Passenger Manifest Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Confirmed Passengers ({bookedSeatsCount}/{trip.totalSeats})
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
            {trip.availableSeats} Open
          </span>
        </div>

        {confirmedBookings.length > 0 ? (
          <div className="space-y-2.5">
            {confirmedBookings.map((b) => {
              const isCurrentUserBooking = user?.id === b.userId;
              const cleanPhone = b.user.phone?.replace(/[^0-9]/g, '');

              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrentUserBooking
                      ? 'bg-sky-950/40 border-sky-800/60'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                      {b.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <span className="font-bold text-slate-100 text-sm truncate">
                          {b.user.name}
                        </span>
                        {isCurrentUserBooking && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block truncate">
                        @{b.user.username} • {b.passengerCount} seat(s)
                      </span>
                    </div>
                  </div>

                  {/* Call / WhatsApp Actions for Host or Fellow Passengers */}
                  {(b.contactPhone || b.user.phone) && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <a
                        href={`tel:${b.contactPhone || b.user.phone}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 transition-colors shadow-sm"
                        title={`Call ${b.user.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                            `Hi ${b.user.name}, regarding our Billing taxi trip today at ${trip.pickupTime}...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 transition-colors shadow-sm"
                          title={`WhatsApp ${b.user.name}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs">
            No passengers have joined this vehicle yet. Share this trip to fill open seats!
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <JoinTaxiModal
          trip={trip}
          currentUser={user}
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            setShowJoinModal(false);
            setToast({ type: 'success', text: 'You have joined this taxi trip!' });
            fetchTrip();
          }}
        />
      )}
    </div>
  );
}
