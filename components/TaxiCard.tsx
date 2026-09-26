'use client';

import React from 'react';
import Link from 'next/link';
import { TaxiTripInfo, UserSummary } from '@/lib/types';
import { Clock, Phone, ChevronRight, User } from 'lucide-react';

interface TaxiCardProps {
  trip: TaxiTripInfo;
  currentUser: UserSummary | null;
  onJoinClick: (trip: TaxiTripInfo) => void;
  onLeaveClick: (tripId: string) => void;
  onCancelTrip?: (tripId: string) => void;
  onCompleteTrip?: (tripId: string) => void;
}

export default function TaxiCard({
  trip,
  currentUser,
  onJoinClick,
  onLeaveClick,
  onCancelTrip,
  onCompleteTrip,
}: TaxiCardProps) {
  const isHost = currentUser?.id === trip.hostId;
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR';
  const hasBooked = currentUser
    ? trip.bookings.some((b) => b.userId === currentUser.id && b.status === 'CONFIRMED')
    : false;

  const cleanPickup = trip.pickupLocation.split('(')[0].trim();
  const cleanDest = trip.destination.split('(')[0].trim();

  // Status badge
  const getStatusBadge = () => {
    switch (trip.status) {
      case 'OPEN':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {trip.availableSeats} seats open
          </span>
        );
      case 'ALMOST_FULL':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Only {trip.availableSeats} left
          </span>
        );
      case 'FULL':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Full
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-900">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-3.5 sm:p-4 shadow-lg transition-all w-full max-w-full space-y-2.5">
      {/* Line 1: Time, Route & Fare */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 bg-sky-950 border border-sky-800/80 px-2 py-0.5 rounded-lg text-sky-300 font-black text-xs shrink-0">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{trip.pickupTime}</span>
          </span>

          <span className="font-extrabold text-white text-xs sm:text-sm truncate">
            {cleanPickup} <span className="text-sky-400 font-bold">→</span> {cleanDest}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-base font-black text-amber-400">₹{trip.farePerSeat}</span>
          <span className="text-[10px] text-slate-400 font-medium">/seat</span>
        </div>
      </div>

      {/* Line 2: Driver, Vehicle & Notes */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 font-semibold text-slate-200 truncate">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{trip.driverName}</span>
          </span>
          <span className="text-slate-600 font-bold">•</span>
          <span className="text-slate-400 truncate text-[11px]">
            {trip.vehicleType ? trip.vehicleType.split('(')[0].trim() : 'Taxi 4x4'}
          </span>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Notes if any */}
      {trip.notes && (
        <p className="text-[11px] text-slate-300 italic bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800/80 truncate">
          "{trip.notes}"
        </p>
      )}

      {/* Line 3: Direct Actions & Manifest Link */}
      <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Quick Call Button */}
          <a
            href={`tel:${trip.driverPhone}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors active:scale-95"
            title="Call driver"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs">Call</span>
          </a>

          {/* Passenger Manifest Link */}
          <Link
            href={`/taxis/${trip.id}`}
            className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5 hover:underline"
            title="View booked passengers"
          >
            <span>{trip.bookings?.length || 0} Booked</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Join / Leave / Host Actions */}
        <div className="flex items-center gap-1.5">
          {hasBooked ? (
            <button
              onClick={() => onLeaveClick(trip.id)}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors active:scale-95"
            >
              Cancel Seat
            </button>
          ) : trip.status === 'OPEN' || trip.status === 'ALMOST_FULL' ? (
            <button
              onClick={() => onJoinClick(trip)}
              disabled={trip.availableSeats <= 0}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-black text-xs shadow-md shadow-sky-600/20 transition-all active:scale-95"
            >
              Join (₹{trip.farePerSeat})
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-bold px-2 py-1 bg-slate-800/40 rounded-lg">
              {trip.status}
            </span>
          )}

          {/* Host Done / Cancel */}
          {(isHost || isStaff) && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
            <div className="flex items-center gap-1">
              {onCompleteTrip && (
                <button
                  onClick={() => onCompleteTrip(trip.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900 text-xs font-bold transition-colors"
                >
                  Done
                </button>
              )}
              {onCancelTrip && (
                <button
                  onClick={() => onCancelTrip(trip.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
