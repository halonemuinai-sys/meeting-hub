'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarPlus,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  Mail,
  Building,
  Sparkles,
  Loader2,
  UserCheck,
  Search,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toLocalInput } from '../calendar/calendarFormat';

interface BookingModalProps {
  rooms: any[];
  defaultRoomId?: string;
  defaultDate?: Date;
  defaultHour?: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function BookingModal({
  rooms,
  defaultRoomId,
  defaultDate,
  defaultHour,
  onClose,
  onSuccess
}: BookingModalProps) {
  const getInitialTimes = () => {
    const start = defaultDate ? new Date(defaultDate) : new Date();
    if (defaultHour !== undefined) {
      start.setHours(defaultHour, 0, 0, 0);
    } else {
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
    }

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    return {
      startTime: toLocalInput(start),
      endTime: toLocalInput(end)
    };
  };

  const initialTimes = getInitialTimes();

  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    roomId: defaultRoomId || (rooms.length > 0 ? rooms[0].id : ''),
    startTime: initialTimes.startTime,
    endTime: initialTimes.endTime,
    organizerName: user?.name || '',
    organizerEmail: user?.email || '',
    department: user?.department || '',
    category: 'Weekly Meeting',
    isConfidential: false,
    specialRequests: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Keep organizer in sync with user login state if empty
  useEffect(() => {
    if (user && !form.organizerEmail) {
      setForm((prev) => ({
        ...prev,
        organizerName: prev.organizerName || user.name,
        organizerEmail: prev.organizerEmail || user.email,
        department: prev.department || user.department || ''
      }));
    }
  }, [user]);

  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [attendeesCount, setAttendeesCount] = useState(5);

  const [masterDirectory, setMasterDirectory] = useState<any[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [showDirectoryDropdown, setShowDirectoryDropdown] = useState(false);

  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{ isAvailable: boolean; conflicts: any[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedRoom = rooms.find((r) => r.id === form.roomId);

  useEffect(() => {
    api.getAttendees()
      .then((res) => setMasterDirectory(res.data || []))
      .catch((err) => console.error('Failed to load attendee directory:', err));
  }, []);

  useEffect(() => {
    if (!form.roomId || !form.startTime || !form.endTime) return;

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      setAvailability(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.checkAvailability({
          roomId: form.roomId,
          startTime: form.startTime,
          endTime: form.endTime
        });
        setAvailability({
          isAvailable: res.isAvailable,
          conflicts: res.conflicts || []
        });
      } catch (err) {
        console.error('Availability check error:', err);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.roomId, form.startTime, form.endTime]);

  const handleAddAttendee = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !selectedAttendees.includes(trimmed)) {
      const updated = [...selectedAttendees, trimmed];
      setSelectedAttendees(updated);
      setAttendeesCount(Math.max(updated.length + 1, attendeesCount));
    }
    setAttendeeSearch('');
    setShowDirectoryDropdown(false);
  };

  const handleRemoveAttendee = (email: string) => {
    setSelectedAttendees(selectedAttendees.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const res = await api.createBooking({
        ...form,
        attendees: selectedAttendees,
        attendeesCount
      });
      onSuccess(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit room reservation.');
      setSubmitting(false);
    }
  };

  const filteredDirectory = masterDirectory.filter((d) => {
    if (selectedAttendees.includes(d.email)) return false;
    if (!attendeeSearch) return true;
    const q = attendeeSearch.toLowerCase();
    return (
      d.fullName.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q)
    );
  });

  const isOverCapacity = selectedRoom && attendeesCount > selectedRoom.capacityMax;

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
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Book Meeting Room</h2>
              <p className="text-xs text-slate-500">MRA Group Multi-Entity Booking Portal</p>
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

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Room Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Meeting Room <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rooms.map((r) => {
                const isSelected = form.roomId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setForm({ ...form, roomId: r.id })}
                    className={`cursor-pointer rounded-xl border p-3 transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">{r.company?.name}</span>
                        <span className="text-slate-600 flex items-center gap-1 font-semibold">
                          <Users className="h-3 w-3" /> {r.capacityMin}-{r.capacityMax} seats
                        </span>
                      </div>
                      <h4 className="mt-0.5 text-xs font-bold text-slate-900">{r.name}</h4>
                      <p className="text-[10px] text-slate-400">{r.floor || 'Main Hall'}</p>
                    </div>

                    {r.amenities && r.amenities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.amenities.slice(0, 2).map((a: string) => (
                          <span
                            key={a}
                            className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] text-slate-600 font-medium truncate max-w-[120px]"
                          >
                            {a}
                          </span>
                        ))}
                        {r.amenities.length > 2 && (
                          <span className="text-[9px] text-slate-400">+{r.amenities.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Range Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Real-time Conflict Alert Strip */}
          {checking ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-500 border border-slate-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span>Checking room availability...</span>
            </div>
          ) : availability && !availability.isAvailable ? (
            <div className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-bold">Schedule Clash Detected!</span>
              </div>
              <p className="mt-1 text-[11px] font-normal text-amber-700">
                This room is already booked for "{availability.conflicts[0]?.title}" by{' '}
                {availability.conflicts[0]?.organizerName}. Please select another time or room.
              </p>
            </div>
          ) : availability && availability.isAvailable ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Room Available! No scheduling conflicts.</span>
            </div>
          ) : null}

          {/* Category & Title Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category Dropdown & Custom Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                {isCustomCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setForm({ ...form, category: 'Weekly Meeting' });
                    }}
                    className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    ← Presets
                  </button>
                )}
              </div>

              {!isCustomCategory ? (
                <select
                  value={[
                    'Weekly Meeting',
                    'Bi-weekly Meeting',
                    'Monthly Meeting',
                    'Quarterly Meeting',
                    'Interview',
                    'Townhall / All-Hands',
                    'Client / Vendor Meeting',
                    'Ad-hoc / Urgent Meeting'
                  ].includes(form.category) ? form.category : 'OTHER'}
                  onChange={(e) => {
                    if (e.target.value === 'OTHER') {
                      setIsCustomCategory(true);
                      setCustomCategoryInput('');
                      setForm({ ...form, category: '' });
                    } else {
                      setForm({ ...form, category: e.target.value });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Weekly Meeting">Weekly Meeting</option>
                  <option value="Bi-weekly Meeting">Bi-weekly Meeting</option>
                  <option value="Monthly Meeting">Monthly Meeting</option>
                  <option value="Quarterly Meeting">Quarterly Meeting</option>
                  <option value="Interview">Interview</option>
                  <option value="Townhall / All-Hands">Townhall / All-Hands</option>
                  <option value="Client / Vendor Meeting">Client / Vendor Meeting</option>
                  <option value="Ad-hoc / Urgent Meeting">Ad-hoc / Urgent Meeting</option>
                  <option value="OTHER">✍️ Other (Custom...)</option>
                </select>
              ) : (
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Type custom category..."
                  value={customCategoryInput}
                  onChange={(e) => {
                    setCustomCategoryInput(e.target.value);
                    setForm({ ...form, category: e.target.value });
                  }}
                  className="w-full rounded-xl border border-blue-400 bg-blue-50/30 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              )}
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meeting Title & Agenda <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Target Alignment MRA 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Organizer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Host / Organizer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={form.organizerName}
                onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Corporate Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@mra.co.id"
                value={form.organizerEmail}
                onChange={(e) => setForm({ ...form, organizerEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="IT / Marketing / GA"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Master Attendees Auto-complete & Directory Integration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Meeting Attendees (Auto-complete from Directory or type email)
              </label>
              <span className="text-[10px] text-blue-600 font-semibold">
                Auto-sends .ics Calendar Invites
              </span>
            </div>

            {/* Selected Attendees Tag Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 rounded-xl border border-slate-200 bg-slate-50/50">
              {selectedAttendees.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">
                  No attendees selected yet. Search names below to add from Employee Directory.
                </span>
              ) : (
                selectedAttendees.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-800"
                  >
                    <Mail className="h-3 w-3 text-blue-500" />
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(email)}
                      className="text-blue-500 hover:text-red-600 transition ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Search input with autocomplete dropdown */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type colleague's name or email to add..."
                  value={attendeeSearch}
                  onFocus={() => setShowDirectoryDropdown(true)}
                  onChange={(e) => {
                    setAttendeeSearch(e.target.value);
                    setShowDirectoryDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (attendeeSearch.includes('@')) {
                        handleAddAttendee(attendeeSearch);
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {showDirectoryDropdown && filteredDirectory.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-30">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    MRA Employee Directory
                  </div>
                  {filteredDirectory.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddAttendee(item.email)}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left transition hover:bg-blue-50"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.fullName}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.email} · {item.department} ({item.company?.name})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                        + Add
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attendees Count & Capacity Warning */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Attendees Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(parseInt(e.target.value, 10) || 1)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                  isOverCapacity
                    ? 'border-amber-400 bg-amber-50 focus:ring-amber-400/20'
                    : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Special Requests / Refreshment (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Extra long HDMI cable, mineral water for 10 pax"
                value={form.specialRequests}
                onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {isOverCapacity && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>
                Notice: Number of attendees ({attendeesCount} pax) exceeds room maximum capacity limit ({selectedRoom?.capacityMax} seats).
              </span>
            </div>
          )}

          {/* Confidential Meeting Checkbox & Security Notice */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5 transition hover:bg-amber-50">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={form.isConfidential}
                  onChange={(e) => setForm({ ...form, isConfidential: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Lock className="h-3.5 w-3.5 text-amber-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Mark as Confidential / Private Meeting
                  </span>
                  <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 uppercase">
                    Organizer-Only View
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  When enabled, the meeting title, agenda notes, and participant list will be masked as <span className="font-semibold text-slate-800">"🔒 Reserved (Private Meeting)"</span> on the public calendar. Only you (the creator) and Super Admin can see the full details.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (availability !== null && !availability.isAvailable)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Reservation...</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4" />
                  <span>Confirm Booking & Send Invites</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
