'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  Plus,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Users,
  Settings,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { getCompanyBadge } from '../calendar/calendarFormat';

interface GaRoomManageModalProps {
  rooms: any[];
  onClose: () => void;
  onUpdated: (message: string) => void;
}

const COMMON_AMENITIES = [
  'Smart TV 65 Inch',
  'Smart TV 55 Inch',
  'Dual Screen Projector',
  '4K Video Conference',
  'Polycom Conference',
  'Glass Whiteboard',
  'Surround Mic Board',
  'Soundbar Mic',
  'Air Purifier',
  'High-speed WiFi 6',
  'Studio Mics',
  'Acoustic Soundproofing',
  'Wireless Presentation Pointer',
  'Extension Power Bar'
];

export default function GaRoomManageModal({ rooms, onClose, onUpdated }: GaRoomManageModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const [amenities, setAmenities] = useState<string[]>(activeRoom?.amenities || []);
  const [customTag, setCustomTag] = useState('');
  const [capacityMin, setCapacityMin] = useState(activeRoom?.capacityMin || 1);
  const [capacityMax, setCapacityMax] = useState(activeRoom?.capacityMax || 10);
  const [isMaintenance, setIsMaintenance] = useState(activeRoom?.isMaintenance || false);
  const [maintenanceNote, setMaintenanceNote] = useState(activeRoom?.maintenanceNote || '');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSelectRoom = (roomId: string) => {
    const r = rooms.find((item) => item.id === roomId);
    if (!r) return;
    setSelectedRoomId(roomId);
    setAmenities(r.amenities || []);
    setCapacityMin(r.capacityMin);
    setCapacityMax(r.capacityMax);
    setIsMaintenance(r.isMaintenance);
    setMaintenanceNote(r.maintenanceNote || '');
    setMessage('');
    setError('');
  };

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (!amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
    }
    setCustomTag('');
  };

  const handleRemoveAmenity = (tag: string) => {
    setAmenities(amenities.filter((a) => a !== tag));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.updateRoom(activeRoom.id, {
        amenities,
        capacityMin,
        capacityMax,
        isMaintenance,
        maintenanceNote
      });
      setMessage('Room amenities & settings successfully saved!');
      setTimeout(() => {
        onUpdated('Room settings updated successfully.');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update room settings.');
    } finally {
      setSaving(false);
    }
  };

  const badge = getCompanyBadge(activeRoom?.company?.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl z-10 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                  GA Control Panel
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Manage Room Amenities & Setup
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Room Tab Selector */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {rooms.map((r) => {
            const isSelected = r.id === activeRoom.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRoom(r.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{r.name}</span>
                <span className={`text-[10px] opacity-80 font-normal`}>({r.capacityMin}-{r.capacityMax})</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Active Room Info Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                  {activeRoom.company?.name}
                </span>
                <span className="text-xs font-bold text-slate-900">{activeRoom.name}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{activeRoom.floor || 'Main Hall'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Capacity</span>
              <span className="text-xs font-bold text-slate-800">{capacityMin} - {capacityMax} Seats</span>
            </div>
          </div>

          {/* Amenities Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Quick Amenities Checklist (Click to toggle)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_AMENITIES.map((item) => {
                const isChecked = amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-medium transition ${
                      isChecked
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tag Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Add Custom Amenity / Equipment
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type custom amenity name and click Add..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom(e);
                  }
                }}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Current Active Amenities Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Installed Amenities in this Room ({amenities.length})
            </label>
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/90 bg-white p-3 min-h-[60px]">
              {amenities.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No amenities specified for this room yet.</span>
              ) : (
                amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800"
                  >
                    <span>{a}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(a)}
                      className="text-blue-500 hover:text-red-600 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Capacity & Maintenance Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Capacity (Min - Max Seats)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  value={capacityMin}
                  onChange={(e) => setCapacityMin(parseInt(e.target.value, 10) || 1)}
                  placeholder="Min"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={capacityMax}
                  onChange={(e) => setCapacityMax(parseInt(e.target.value, 10) || 1)}
                  placeholder="Max"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Maintenance Status
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isMaintenance}
                  onChange={(e) => setIsMaintenance(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Mark Room as Under Maintenance</span>
              </label>
              {isMaintenance && (
                <input
                  type="text"
                  placeholder="Maintenance note: e.g. AC servicing until Friday"
                  value={maintenanceNote}
                  onChange={(e) => setMaintenanceNote(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-1.5 text-xs text-amber-900 focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Save Room Setup (GA)</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
