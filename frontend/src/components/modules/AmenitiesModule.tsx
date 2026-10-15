'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';

const CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'VISUAL_DISPLAY', label: 'Visual & Displays' },
  { id: 'AUDIO_CONFERENCE', label: 'Audio & Conference' },
  { id: 'CONNECTIVITY', label: 'Connectivity & Power' },
  { id: 'ROOM_COMFORT', label: 'Room Comfort' }
];

export default function AmenitiesModule() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'VISUAL_DISPLAY',
    description: '',
    icon: 'Tv'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAmenities();
      setAmenities(res.data || []);
    } catch (err: any) {
      console.error('Failed to load amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      name: '',
      category: 'VISUAL_DISPLAY',
      description: '',
      icon: 'Tv'
    });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || '',
      icon: item.icon || 'Sparkles'
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingItem) {
        await api.updateAmenity(editingItem.id, form);
      } else {
        await api.createAmenity(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save amenity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete amenity "${name}" from master database?`)) return;
    try {
      await api.deleteAmenity(id);
      loadData();
    } catch (err: any) {
      alert('Failed to delete amenity: ' + err.message);
    }
  };

  const filteredAmenities = useMemo(() => {
    return amenities.filter((a) => {
      if (category && a.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [amenities, category, search]);

  const stats = useMemo(() => {
    return {
      total: amenities.length,
      visual: amenities.filter((a) => a.category === 'VISUAL_DISPLAY').length,
      audio: amenities.filter((a) => a.category === 'AUDIO_CONFERENCE').length,
      connectivity: amenities.filter((a) => a.category === 'CONNECTIVITY').length,
      comfort: amenities.filter((a) => a.category === 'ROOM_COMFORT').length
    };
  }, [amenities]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/70 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                GENERAL AFFAIRS · MASTER DATA
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                Master Amenities Database
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Centralized equipment catalog for MRA Group meeting rooms (Smart TVs, Video Conference, Connectivity, & Acoustics).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add New Amenity</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Amenities</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Available across directory</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Visual & Displays</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-blue-600">{stats.visual}</p>
          <span className="text-[11px] text-slate-400">Smart TVs, 4K Screens, Projectors</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Audio & Conference</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.audio}</p>
          <span className="text-[11px] text-slate-400">Polycom, Studio Mics, 4K Cams</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Connectivity & Comfort</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.connectivity + stats.comfort}</p>
          <span className="text-[11px] text-slate-400">WiFi 6, Whiteboards, Purifiers</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                category === c.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search amenity name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAmenities.map((a) => {
          return (
            <div
              key={a.id}
              className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                        {a.name}
                      </h3>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
                        {a.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => openEditModal(a)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Edit Amenity"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id, a.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete Amenity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[32px]">
                  {a.description || 'No detailed specifications.'}
                </p>
              </div>

              {/* Assigned Rooms Tag */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="font-semibold uppercase tracking-wider">Installed In</span>
                  <span className="font-bold text-amber-700">{a.roomsCount} Rooms</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.assignedRooms && a.assignedRooms.length > 0 ? (
                    a.assignedRooms.map((rm: string) => (
                      <span
                        key={rm}
                        className="rounded-md bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 truncate max-w-[140px]"
                      >
                        {rm}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Not assigned to any room yet</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Amenity' : 'Add New Amenity'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amenity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart TV 75 Inch 4K"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="VISUAL_DISPLAY">Visual & Displays</option>
                  <option value="AUDIO_CONFERENCE">Audio & Conference</option>
                  <option value="CONNECTIVITY">Connectivity, Cables & Power</option>
                  <option value="ROOM_COMFORT">Room Comfort & Acoustics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Technical Specs
                </label>
                <textarea
                  rows={3}
                  placeholder="Dimensions, resolution, input ports, or usage instructions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save Amenity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
