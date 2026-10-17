'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Loader2, Wrench, X } from 'lucide-react';
import { api } from '@/lib/api';

interface RoomFormModalProps {
  room: any | null; // null = create
  companies: any[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

const COLOR_OPTIONS = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#d97706', '#059669', '#0891b2', '#475569'];

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-700';

export default function RoomFormModal({ room, companies, onClose, onSaved }: RoomFormModalProps) {
  const isEdit = Boolean(room);
  const [form, setForm] = useState({
    companyId: room?.companyId || companies[0]?.id || '',
    name: room?.name || '',
    floor: room?.floor || '',
    capacityMin: room?.capacityMin ?? 1,
    capacityMax: room?.capacityMax ?? 8,
    colorCode: room?.colorCode || COLOR_OPTIONS[0],
    amenities: (room?.amenities as string[]) || [],
    isMaintenance: room?.isMaintenance || false,
    maintenanceNote: room?.maintenanceNote || ''
  });
  const [amenityOptions, setAmenityOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAmenities()
      .then((res) => setAmenityOptions((res.data || []).map((a: any) => a.name)))
      .catch((err) => console.error('Failed to load amenities:', err));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Keep amenities already on the room selectable even if removed from the master list
  const allAmenities = Array.from(new Set([...amenityOptions, ...form.amenities]));

  const toggleAmenity = (name: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(name) ? f.amenities.filter((a) => a !== name) : [...f.amenities, name]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (Number(form.capacityMin) > Number(form.capacityMax)) {
      setError('Minimum capacity cannot exceed maximum capacity.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacityMin: Number(form.capacityMin),
        capacityMax: Number(form.capacityMax),
        maintenanceNote: form.isMaintenance ? form.maintenanceNote : ''
      };
      const res = isEdit ? await api.updateRoom(room.id, payload) : await api.createRoom(payload);
      onSaved(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to save room.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-form-title"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative z-10 my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <h2 id="room-form-title" className="text-base font-bold text-slate-900">
            {isEdit ? `Edit ${room.name}` : 'Add Meeting Room'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label htmlFor="room-company" className={labelCls}>Entity</label>
              <select
                id="room-company"
                required
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className={inputCls}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="room-name" className={labelCls}>Room name</label>
                <input
                  id="room-name"
                  type="text"
                  required
                  autoFocus={!isEdit}
                  placeholder="e.g. Ruang Meeting D"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="room-floor" className={labelCls}>Floor / location</label>
                <input
                  id="room-floor"
                  type="text"
                  placeholder="e.g. 8th Floor (Lt 8)"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <span className={labelCls}>Capacity (pax)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  required
                  aria-label="Minimum capacity"
                  value={form.capacityMin}
                  onChange={(e) => setForm({ ...form, capacityMin: parseInt(e.target.value, 10) || 1 })}
                  className={inputCls}
                />
                <span className="text-sm text-slate-400">to</span>
                <input
                  type="number"
                  min={1}
                  required
                  aria-label="Maximum capacity"
                  value={form.capacityMax}
                  onChange={(e) => setForm({ ...form, capacityMax: parseInt(e.target.value, 10) || 1 })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <span className={labelCls}>Calendar color</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Calendar color">
                {COLOR_OPTIONS.map((c) => {
                  const selected = form.colorCode.toLowerCase() === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={c}
                      onClick={() => setForm({ ...form, colorCode: c })}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                        selected ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {selected && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className={labelCls}>
                Amenities <span className="font-normal text-slate-400">({form.amenities.length} selected)</span>
              </span>
              {allAmenities.length === 0 ? (
                <p className="text-xs text-slate-400">No amenities in the master list yet.</p>
              ) : (
                <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                  {allAmenities.map((a) => {
                    const selected = form.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleAmenity(a)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Wrench className="h-3.5 w-3.5 text-slate-500" /> Under maintenance
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">Room stays visible but cannot be booked.</span>
                </span>
                <span className="relative inline-flex shrink-0">
                  <input
                    type="checkbox"
                    checked={form.isMaintenance}
                    onChange={(e) => setForm({ ...form, isMaintenance: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-amber-500 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/40" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                </span>
              </label>
              {form.isMaintenance && (
                <input
                  type="text"
                  aria-label="Maintenance note"
                  placeholder="e.g. Projector repair until Friday"
                  value={form.maintenanceNote}
                  onChange={(e) => setForm({ ...form, maintenanceNote: e.target.value })}
                  className={inputCls + ' mt-3'}
                />
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isEdit ? 'Save changes' : 'Add room'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
