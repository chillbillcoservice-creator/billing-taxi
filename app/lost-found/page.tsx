'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/ClientShell';
import { LostFoundInfo } from '@/lib/types';
import { LOST_FOUND_CATEGORIES } from '@/lib/constants';
import {
  Search,
  Plus,
  Filter,
  Phone,
  CheckCircle,
  MapPin,
  Calendar,
  Tag,
  X,
  Camera,
  Upload,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function LostFoundPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LostFoundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Form states
  const [createType, setCreateType] = useState<'LOST' | 'FOUND'>('LOST');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(LOST_FOUND_CATEGORIES[0].id);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Bir Landing Ground (Chougan)');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/api/lost-found?type=${typeFilter}&category=${categoryFilter}&status=${statusFilter}`;
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter, categoryFilter, statusFilter, searchQuery]);

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

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: createType,
          title,
          category,
          description,
          location,
          contactPhone,
          photos,
          itemDate: new Date(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setPhotos([]);
        setToast(`Successfully reported ${createType.toLowerCase()} item!`);
        fetchItems();
        setTimeout(() => setToast(null), 4000);
      } else {
        alert(data.error || 'Failed to submit report');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/lost-found/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setToast(`Item status updated to ${newStatus}`);
        fetchItems();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-4 space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-amber-400" />
            <span>Lost & Found Board</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Recover lost radios, varios, cameras, & flying gear
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
          <span>Report Item</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 bg-emerald-950 text-emerald-200 border border-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-2.5 shadow-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Type Selector (ALL / LOST / FOUND) */}
      <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            typeFilter === 'ALL' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => setTypeFilter('LOST')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            typeFilter === 'LOST' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lost Gear
        </button>
        <button
          onClick={() => setTypeFilter('FOUND')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
            typeFilter === 'FOUND' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Found Gear
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lost walkie, vario, GoPro, harness..."
            className="w-full min-h-[48px] bg-slate-900 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-base text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm w-full">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full min-w-0 min-h-[46px] bg-slate-900 border border-slate-700/80 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Categories</option>
            {LOST_FOUND_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full min-w-0 min-h-[46px] bg-slate-900 border border-slate-700/80 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Status</option>
            <option value="OPEN" className="bg-slate-900 text-white">Open Only</option>
            <option value="RESOLVED" className="bg-slate-900 text-white">Resolved</option>
          </select>
        </div>
      </div>

      {/* Item Cards List */}
      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const isOwner = user?.id === item.userId;
            const isLost = item.type === 'LOST';

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
              >
                {/* Header: Type Badge, Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                        isLost
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-sky-400" />
                      {item.category}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'OPEN'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>

                {/* Location & Date */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-sky-400" />
                    <span>{new Date(item.itemDate).toLocaleDateString()}</span>
                  </span>
                </div>

                {/* Photos Grid if any */}
                {item.photos && item.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {item.photos.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="Item photo"
                        onClick={() => setSelectedPhoto(p)}
                        className="w-20 h-20 object-cover rounded-xl border border-slate-700 cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                      />
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                  <a
                    href={`tel:${item.contactPhone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contact {item.user.name.split(' ')[0]}</span>
                  </a>

                  {isOwner && item.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-2">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Items Found</h3>
          <p className="text-xs text-slate-500">
            No matching lost or found equipment matching your criteria.
          </p>
        </div>
      )}

        {/* Create Post Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl relative my-8 text-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Report Lost / Found Gear</h3>
              <p className="text-xs text-slate-400 mb-4">
                Help the paragliding community recover missing flying equipment.
              </p>

              <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
                {/* Type Selection */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateType('LOST')}
                    className={`flex-1 py-2 font-bold rounded-xl border ${
                      createType === 'LOST'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    I Lost Something
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateType('FOUND')}
                    className={`flex-1 py-2 font-bold rounded-xl border ${
                      createType === 'FOUND'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    I Found Something
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Item Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Baofeng UV-5R Radio with orange tag"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gear Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {LOST_FOUND_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Description & Details</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe color, markings, serial numbers, exact location details..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Approximate Location */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Approximate Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="e.g. Chougan Landing Ground near big pine tree"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Contact Phone */}
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

                {/* Photo Uploads from Camera / Gallery */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Attach Photos</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold border border-slate-700"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{uploading ? 'Uploading...' : 'Add Photo (Camera/Gallery)'}</span>
                    </button>
                    <span className="text-[11px] text-slate-500">{photos.length} photo(s) added</span>
                  </div>

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
                  {submitting ? 'Publishing Report...' : 'Publish to Board'}
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
