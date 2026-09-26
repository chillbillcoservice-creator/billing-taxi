'use client';

import React from 'react';
import { TaxiTripInfo, UserSummary } from '@/lib/types';
import { Clock, MapPin, Users, Phone, ShieldCheck, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

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

  const totalSeats = trip.totalSeats;
  const bookedSeats = totalSeats - trip.availableSeats;
  const percentFilled = Math.min(100, Math.round((bookedSeats / totalSeats) * 100));

  // Status badge styling
  const getStatusBadge = () => {
    switch (trip.status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            OPEN ({trip.availableSeats} left)
          </span>
        );
      case 'ALMOST_FULL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            ALMOST FULL ({trip.availableSeats} left)
          </span>
        );
      case 'FULL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            FULL
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-900">
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  const tripDateStr = new Date(trip.tripDate).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-lg transition-all">
      {/* Header: Time, Date & Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-sky-950/80 border border-sky-800/80 px-2.5 py-1 rounded-xl text-sky-300 font-bold text-sm">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{trip.pickupTime}</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">{tripDateStr}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Route: Pickup -> Destination */}
      <div className="space-y-1.5 mb-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
        <div className="flex items-start gap-2 text-xs">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Pickup</span>
            <span className="font-semibold text-slate-100 text-sm leading-tight">{trip.pickupLocation}</span>
          </div>
        </div>
        <div className="ml-2 pl-3 border-l-2 border-dashed border-slate-700/80 py-0.5 my-0.5" />
        <div className="flex items-start gap-2 text-xs">
          <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Destination</span>
            <span className="font-semibold text-sky-300 text-sm leading-tight">{trip.destination}</span>
          </div>
        </div>
      </div>

      {/* Driver, Vehicle & Fare */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block font-medium">DRIVER / VEHICLE</span>
          <span className="font-semibold text-slate-200 block truncate">{trip.driverName}</span>
          <span className="text-[11px] text-slate-400 block truncate">
            {trip.vehicleType || 'Taxi 4x4'} {trip.vehicleNumber ? `• ${trip.vehicleNumber}` : ''}
          </span>
        </div>

        <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block font-medium">FARE PER PASSENGER</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-amber-400">₹{trip.farePerSeat}</span>
            <span className="text-[10px] text-slate-400">/ seat</span>
          </div>
        </div>
      </div>

      {/* Seat Capacity Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="flex items-center gap-1 text-slate-300">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Seats: {bookedSeats}/{totalSeats} occupied</span>
          </span>
          <span className="text-slate-400 font-semibold">{trip.availableSeats} available</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              percentFilled >= 100
                ? 'bg-rose-500'
                : percentFilled >= 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${percentFilled}%` }}
          />
        </div>
      </div>

      {/* Passengers Roster */}
      {trip.bookings && trip.bookings.length > 0 && (
        <div className="mb-3 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold mb-1.5 tracking-wider">
            Confirmed Pilots / Riders ({trip.bookings.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {trip.bookings.map((booking) => (
              <span
                key={booking.id}
                className="inline-flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg text-[11px] text-slate-200 border border-slate-700/60"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-medium">{booking.user.name.split(' ')[0]}</span>
                {booking.passengerCount > 1 && (
                  <span className="text-sky-400 font-bold">+{booking.passengerCount - 1}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes if any */}
      {trip.notes && (
        <p className="text-xs text-slate-400 italic mb-3 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
          "{trip.notes}"
        </p>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Contact driver */}
        <a
          href={`tel:${trip.driverPhone}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          title="Call driver"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Call Driver</span>
        </a>

        {/* Join / Leave / Manage buttons */}
        <div className="flex items-center gap-1.5">
          {hasBooked ? (
            <button
              onClick={() => onLeaveClick(trip.id)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors"
            >
              Cancel My Seat
            </button>
          ) : trip.status === 'OPEN' || trip.status === 'ALMOST_FULL' ? (
            <button
              onClick={() => onJoinClick(trip)}
              disabled={trip.availableSeats <= 0}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all active:scale-95"
            >
              Join Taxi (₹{trip.farePerSeat})
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-semibold px-3 py-1.5 bg-slate-800/50 rounded-xl">
              Taxi {trip.status}
            </span>
          )}

          {/* Host / Admin Actions */}
          {(isHost || isStaff) && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
            <div className="flex items-center gap-1">
              {onCompleteTrip && (
                <button
                  onClick={() => onCompleteTrip(trip.id)}
                  className="px-2.5 py-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900 text-xs font-semibold transition-colors"
                  title="Mark Completed"
                >
                  Done
                </button>
              )}
              {onCancelTrip && (
                <button
                  onClick={() => onCancelTrip(trip.id)}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 text-xs font-semibold transition-colors"
                  title="Cancel Trip"
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
