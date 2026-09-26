'use client';

import React, { useState } from 'react';
import { PICKUP_LOCATIONS, DESTINATIONS } from '@/lib/constants';
import { UserSummary } from '@/lib/types';
import { X, Car, MapPin, Clock, Calendar, Users, IndianRupee, Phone, FileText } from 'lucide-react';

interface CreateTaxiModalProps {
  currentUser: UserSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaxiModal({ currentUser, onClose, onSuccess }: CreateTaxiModalProps) {
  const [pickupLocation, setPickupLocation] = useState(PICKUP_LOCATIONS[0]);
  const [customPickup, setCustomPickup] = useState('');
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('09:30 AM');
  const [totalSeats, setTotalSeats] = useState('6');
  const [farePerSeat, setFarePerSeat] = useState('250');
  const [driverName, setDriverName] = useState(currentUser?.name || '');
  const [driverPhone, setDriverPhone] = useState(currentUser?.phone || '');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Mahindra Bolero 4x4 (Roof Rack)');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      window.location.href = '/auth/login';
      return;
    }

    const finalPickup = pickupLocation === 'Custom Pickup (Specify in notes)'
      ? (customPickup.trim() || 'Bir Valley Pickup')
      : pickupLocation;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/taxis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLocation: finalPickup,
          destination,
          tripDate,
          pickupTime,
          totalSeats,
          farePerSeat,
          driverName,
          driverPhone,
          vehicleNumber,
          vehicleType,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create trip');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl relative my-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-400" />
          <span>Host a Shared Taxi Trip</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Add an uphill ride to Billing Take-off or return shuttle to Bir.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Pickup */}
          <div>
            <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Pickup Location</span>
            </label>
            <select
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {PICKUP_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc}
                </option>
              ))}
            </select>
            {pickupLocation === 'Custom Pickup (Specify in notes)' && (
              <input
                type="text"
                value={customPickup}
                onChange={(e) => setCustomPickup(e.target.value)}
                placeholder="Enter specific landmark or hotel name"
                className="mt-2 w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            )}
          </div>

          {/* Destination */}
          <div>
            <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Destination</span>
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {DESTINATIONS.map((dest) => (
                <option key={dest} value={dest} className="bg-slate-900 text-white">
                  {dest}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                required
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Departure Time</span>
              </label>
              <input
                type="text"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="e.g. 09:30 AM"
                required
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Seats & Fare Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Available Seats</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                required
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                <span>Fare / Seat (₹)</span>
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={farePerSeat}
                onChange={(e) => setFarePerSeat(e.target.value)}
                required
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Driver Name & Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-200 mb-1.5">Host Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
                placeholder="Ramesh Bolero"
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Phone</span>
              </label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                required
                placeholder="+91 98160 XXXXX"
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-200 mb-1.5">Vehicle Model</label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="Bolero 4WD / Alto"
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-200 mb-1.5">Plate No. (Optional)</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="HP 68 X XXXX"
                className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Special Trip Notes (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Roof carrier fits 6 tandem bags, waiting at Northern Cafe"
              className="w-full min-h-[48px] bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-3 text-base text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 min-h-[50px] rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <span>Publishing Trip...</span> : <span>Publish Taxi Trip</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
