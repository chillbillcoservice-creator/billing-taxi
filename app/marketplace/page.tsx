'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/ClientShell';
import { MarketplaceInfo } from '@/lib/types';
import { GEAR_CATEGORIES } from '@/lib/constants';
import {
  ShoppingBag,
  Plus,
  Filter,
  Search,
  Tag,
  Phone,
  MessageCircle,
  MapPin,
  ShieldCheck,
  CheckCircle,
  X,
  Camera,
  IndianRupee,
} from 'lucide-react';

export default function MarketplacePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'BROWSE' | 'MY_LISTINGS'>('BROWSE');
  const [listings, setListings] = useState<MarketplaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(GEAR_CATEGORIES[0].id);
  const [condition, setCondition] = useState('EXCELLENT');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('Bir Tibetan Colony');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let url = `/api/marketplace?category=${categoryFilter}&condition=${conditionFilter}&status=${statusFilter}`;
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setListings(data.listings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [categoryFilter, conditionFilter, statusFilter, searchQuery]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isSecure', 'false');

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setPhotos([...photos, data.url]);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          condition,
          price,
          location,
          description,
          photos,
          contactPhone,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setTitle('');
        setPrice('');
        setDescription('');
        setPhotos([]);
        setToast('Equipment listed successfully!');
        fetchListings();
        setTimeout(() => setToast(null), 4000);
      } else {
        alert(data.error || 'Failed to create listing');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setToast(`Status updated to ${newStatus}`);
        fetchListings();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const displayedListings = activeTab === 'MY_LISTINGS'
    ? listings.filter((l) => l.sellerId === user?.id)
    : listings;

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-4 space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span>Paragliding Gear Market</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Verified classifieds for gliders, harnesses, varios, and reserves
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              window.location.href = '/auth/login';
              return;
            }
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Post Gear</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 bg-emerald-950 text-emerald-200 border border-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-2.5 shadow-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setActiveTab('BROWSE')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            activeTab === 'BROWSE' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Browse Gear ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('MY_LISTINGS')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            activeTab === 'MY_LISTINGS' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Listings
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Gin, Ozone, Niviuk, Supair, Naviter..."
            className="w-full min-h-[48px] bg-slate-900 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-xs sm:text-sm w-full">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full min-w-0 min-h-[46px] bg-slate-900 border border-slate-700/80 rounded-2xl px-2 sm:px-3 py-2.5 font-semibold text-slate-100 focus:outline-none cursor-pointer shadow-sm truncate"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Gear</option>
            {GEAR_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.id}
              </option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-full min-w-0 min-h-[46px] bg-slate-900 border border-slate-700/80 rounded-2xl px-2 sm:px-3 py-2.5 font-semibold text-slate-100 focus:outline-none cursor-pointer shadow-sm truncate"
          >
            <option value="ALL" className="bg-slate-900 text-white">Condition</option>
            <option value="NEW" className="bg-slate-900 text-white">New</option>
            <option value="EXCELLENT" className="bg-slate-900 text-white">Excellent</option>
            <option value="GOOD" className="bg-slate-900 text-white">Good</option>
            <option value="FAIR" className="bg-slate-900 text-white">Fair</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full min-w-0 min-h-[46px] bg-slate-900 border border-slate-700/80 rounded-2xl px-2 sm:px-3 py-2.5 font-semibold text-slate-100 focus:outline-none cursor-pointer shadow-sm truncate"
          >
            <option value="ALL" className="bg-slate-900 text-white">Status</option>
            <option value="AVAILABLE" className="bg-slate-900 text-white">Available</option>
            <option value="RESERVED" className="bg-slate-900 text-white">Reserved</option>
            <option value="SOLD" className="bg-slate-900 text-white">Sold</option>
          </select>
        </div>
      </div>

      {/* Listings Stream */}
      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-56 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayedListings.length > 0 ? (
        <div className="space-y-3">
          {displayedListings.map((item) => {
            const isSeller = user?.id === item.sellerId;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3"
              >
                {/* Images Carousel / Preview */}
                {item.photos && item.photos.length > 0 ? (
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={item.photos[0]}
                      alt={item.title}
                      onClick={() => setSelectedPhoto(item.photos[0])}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur text-[10px] font-bold text-sky-300 border border-sky-500/30">
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        {item.condition}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : item.status === 'RESERVED'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] text-white">
                        +{item.photos.length - 1} more photos
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="p-4 pt-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">{item.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-amber-400">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>

                  {/* Seller Bio Pill */}
                  <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xs text-white">
                        {item.seller.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-semibold text-slate-200">
                          <span>{item.seller.name}</span>
                          {item.seller.isPilotVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Verified Bir Pilot</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${item.contactPhone}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/${item.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${item.seller.name}, I'm interested in your "${item.title}" listed on the Billing Taxi app.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    {isSeller && item.status !== 'SOLD' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'SOLD')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 text-xs font-bold"
                      >
                        Mark Sold
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Listings Found</h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'MY_LISTINGS'
              ? "You haven't listed any flying gear for sale yet."
              : 'No equipment matching your filters. Try adjusting criteria.'}
          </p>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl relative my-8 text-slate-100">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">List Paragliding Equipment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Sell your wing, harness, rescue, or avionics to fellow pilots.
            </p>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product / Wing Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Ozone Mojo 6 (Size S, 65-85kg)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {GEAR_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label.split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="EXCELLENT">Excellent (Crisp cloth)</option>
                    <option value="NEW">Brand New / Unflown</option>
                    <option value="GOOD">Good (Normal wear)</option>
                    <option value="FAIR">Fair (Training/ground handling)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="e.g. 75000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="Bir Tibetan Colony / Upper Bir"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description (Hours, Porosity, History)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Detail hours flown, porosity test results, inspection date, line condition..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  placeholder="+91 98050 XXXXX"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Gear Photos</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold border border-slate-700"
                >
                  <Camera className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Add Photo (Camera/Gallery)'}</span>
                </button>

                {photos.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative">
                        <img src={p} alt="Upload" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 p-0.5 bg-rose-600 rounded-full text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md"
              >
                {submitting ? 'Publishing Gear...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-pointer"
        >
          <img src={selectedPhoto} alt="Full view" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
