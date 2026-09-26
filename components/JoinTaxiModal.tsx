'use client';

import React, { useState } from 'react';
import { TaxiTripInfo, UserSummary } from '@/lib/types';
import { X, CheckCircle, ShieldAlert, Phone, Users } from 'lucide-react';

interface JoinTaxiModalProps {
  trip: TaxiTripInfo | null;
  currentUser: UserSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinTaxiModal({
  trip,
  currentUser,
  onClose,
  onSuccess,
}: JoinTaxiModalProps) {
  if (!trip) return null;

  const [seats, setSeats] = useState(1);
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalFare = trip.farePerSeat * seats;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      window.location.href = '/auth/login';
      return;
    }

    if (!phone) {
      setError('Please provide a contact phone number for the driver.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/taxis/${trip.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join taxi trip');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span>Confirm Taxi Booking</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Reserve your shared ride to Billing Take-Off (2,430m).
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          {/* Trip Summary Card */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Pickup:</span>
              <span className="font-semibold text-slate-200 text-right">{trip.pickupLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Time:</span>
              <span className="font-bold text-sky-400">{trip.pickupTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Driver:</span>
              <span className="text-slate-200">{trip.driverName}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Seats Available:</span>
              <span className="font-bold text-emerald-400">{trip.availableSeats}</span>
            </div>
          </div>

          {/* Seat Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Number of Seats</span>
              <span className="text-[11px] text-slate-400">₹{trip.farePerSeat} / seat</span>
            </label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <select
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                {Array.from({ length: trip.availableSeats }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Passenger / Wing' : 'Passengers / Wings'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contact Phone (for driver coordination)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+91 98050 XXXXX"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Total Fare Banner */}
          <div className="bg-sky-950/60 border border-sky-800/80 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-sky-200">Total Payable to Driver:</span>
            <span className="text-lg font-black text-amber-400">₹{totalFare}</span>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            * Please arrive at the pickup spot 10 minutes prior to departure with your glider bag ready.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Securing Seat...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Join Taxi</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
