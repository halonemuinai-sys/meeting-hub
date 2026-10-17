'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  Pencil,
  Search,
  Users,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DatePicker from '@/components/ui/DatePicker';
import TimeSelect from '@/components/ui/TimeSelect';

interface BookingModalProps {
  rooms: any[];
  defaultRoomId?: string;
  defaultDate?: Date;
  defaultHour?: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CATEGORY_PRESETS = [
  'Weekly Meeting',
  'Bi-weekly Meeting',
  'Monthly Meeting',
  'Quarterly Meeting',
  'Interview',
  'Townhall / All-Hands',
  'Client / Vendor Meeting',
  'Ad-hoc / Urgent Meeting',
  'General Meeting'
];
const CUSTOM_CATEGORY = '__custom__';

// Bookable slots every 30 minutes, 07:00 – 21:00
const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
});

const DURATIONS = [
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '1.5h', mins: 90 },
  { label: '2h', mins: 120 }
];

const toMinutes = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
};
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-700';

function getInitialSchedule(defaultDate?: Date, defaultHour?: number) {
  const date = defaultDate ? new Date(defaultDate) : new Date();
  let startMins: number;
  if (defaultHour !== undefined) {
    startMins = defaultHour * 60;
  } else {
    // Next full hour from now
    const now = new Date();
    startMins = (now.getHours() + 1) * 60;
  }
  startMins = Math.min(Math.max(startMins, toMinutes(TIME_OPTIONS[0])), toMinutes(TIME_OPTIONS[TIME_OPTIONS.length - 2]));
  return { date, start: fromMinutes(startMins), end: fromMinutes(startMins + 60) };
}

export default function BookingModal({
  rooms,
  defaultRoomId,
  defaultDate,
  defaultHour,
  onClose,
  onSuccess
}: BookingModalProps) {
  const { user } = useAuth();
  // Employees always book under their own identity; admins may book on behalf of others
  const canChangeOrganizer = user?.role === 'SUPER_ADMIN' || user?.role === 'GA_ADMIN';

  const initial = useMemo(() => getInitialSchedule(defaultDate, defaultHour), [defaultDate, defaultHour]);

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — schedule & room
  const [date, setDate] = useState<Date>(initial.date);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [roomId, setRoomId] = useState<string>(defaultRoomId || rooms[0]?.id || '');
  const [busyRooms, setBusyRooms] = useState<Record<string, any>>({});
  const [checking, setChecking] = useState(false);

  // Step 2 — meeting details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_PRESETS[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(5);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [organizer, setOrganizer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || ''
  });
  const [editOrganizer, setEditOrganizer] = useState(!user?.department);

  const [directory, setDirectory] = useState<any[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);
  const attendeeBoxRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const durationMins = toMinutes(end) - toMinutes(start);
  const selectedRoom = rooms.find((r) => r.id === roomId);
  const selectedRoomBusy = roomId ? busyRooms[roomId] : null;
  const dateKey = toDateKey(date);
  const startIso = `${dateKey}T${start}`;
  const endIso = `${dateKey}T${end}`;
  const isPast = new Date(startIso) < new Date();
  const isOverCapacity = selectedRoom && attendeesCount > selectedRoom.capacityMax;
  const scheduleValid = durationMins > 0 && !!roomId && !selectedRoomBusy && !isPast;

  useEffect(() => {
    api.getAttendees()
      .then((res) => setDirectory(res.data || []))
      .catch((err) => console.error('Failed to load attendee directory:', err));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close the attendee suggestions when clicking elsewhere
  useEffect(() => {
    if (!showDirectory) return;
    const onPointer = (e: MouseEvent) => {
      if (attendeeBoxRef.current && !attendeeBoxRef.current.contains(e.target as Node)) setShowDirectory(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [showDirectory]);

  // Check every room for the chosen slot so unavailable rooms are flagged in the list
  useEffect(() => {
    if (durationMins <= 0 || !rooms.length) {
      setBusyRooms({});
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const results = await Promise.all(
          rooms.map((r) =>
            api
              .checkAvailability({ roomId: r.id, startTime: startIso, endTime: endIso })
              .then((res) => [r.id, res.isAvailable ? null : res.conflicts?.[0] || {}] as const)
              .catch(() => [r.id, null] as const)
          )
        );
        if (!cancelled) {
          setBusyRooms(Object.fromEntries(results.filter(([, clash]) => clash)));
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [rooms, startIso, endIso, durationMins]);

  const changeStart = (value: string) => {
    // Keep the current duration when moving the start time
    const keep = durationMins > 0 ? durationMins : 60;
    const maxEnd = toMinutes(TIME_OPTIONS[TIME_OPTIONS.length - 1]);
    setStart(value);
    setEnd(fromMinutes(Math.min(toMinutes(value) + keep, maxEnd)));
  };

  const addAttendee = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && trimmed.includes('@') && !attendees.includes(trimmed)) {
      const updated = [...attendees, trimmed];
      setAttendees(updated);
      setAttendeesCount((c) => Math.max(updated.length + 1, c));
    }
    setAttendeeSearch('');
  };

  const filteredDirectory = directory
    .filter((d) => !attendees.includes(d.email))
    .filter((d) => {
      if (!attendeeSearch) return true;
      const q = attendeeSearch.toLowerCase();
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        (d.department || '').toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 2) return;
    setErrorMessage('');
    setSubmitting(true);
    try {
      const res = await api.createBooking({
        title,
        description: '',
        roomId,
        startTime: startIso,
        endTime: endIso,
        organizerName: organizer.name,
        organizerEmail: organizer.email,
        department: organizer.department,
        category,
        isConfidential,
        specialRequests,
        attendees,
        attendeesCount
      });
      onSuccess(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit room reservation.');
      setSubmitting(false);
    }
  };

  const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

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
        aria-labelledby="booking-modal-title"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative z-10 my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="booking-modal-title" className="text-base font-bold text-slate-900">Book a Meeting Room</h2>
            <ol className="mt-1.5 flex items-center gap-2 text-xs">
              {['Schedule & room', 'Meeting details'].map((label, i) => {
                const n = (i + 1) as 1 | 2;
                const done = step > n;
                const active = step === n;
                return (
                  <li key={label} className="flex items-center gap-2">
                    {i > 0 && <span className="h-px w-5 bg-slate-200" />}
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                        done || active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" /> : n}
                    </span>
                    <span className={active ? 'font-semibold text-slate-800' : 'text-slate-400'}>{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
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
          <div className="px-6 py-5">
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  {/* Date & time */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="booking-date" className={labelCls}>Date</label>
                      <DatePicker id="booking-date" value={date} onChange={setDate} minDate={new Date()} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="booking-start" className={labelCls}>Start</label>
                        <TimeSelect
                          id="booking-start"
                          value={start}
                          onChange={changeStart}
                          options={TIME_OPTIONS.slice(0, -1)}
                        />
                      </div>
                      <div>
                        <label htmlFor="booking-end" className={labelCls}>End</label>
                        <TimeSelect
                          id="booking-end"
                          value={end}
                          onChange={setEnd}
                          options={TIME_OPTIONS}
                          isDisabled={(opt) => toMinutes(opt) <= toMinutes(start)}
                          hint={(opt) => {
                            const d = toMinutes(opt) - toMinutes(start);
                            return d > 0 ? formatDuration(d) : null;
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-xs text-slate-500">Duration</span>
                      {DURATIONS.map((d) => {
                        const active = durationMins === d.mins;
                        const fits = toMinutes(start) + d.mins <= toMinutes(TIME_OPTIONS[TIME_OPTIONS.length - 1]);
                        return (
                          <button
                            key={d.label}
                            type="button"
                            disabled={!fits}
                            onClick={() => setEnd(fromMinutes(toMinutes(start) + d.mins))}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                              active
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>

                    {isPast && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        This time has already passed. Choose a later start time.
                      </p>
                    )}
                  </div>

                  {/* Room list */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={labelCls + ' mb-0'}>Room</span>
                      {checking && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking availability
                        </span>
                      )}
                    </div>
                    <div role="radiogroup" aria-label="Meeting room" className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                      {rooms.map((r) => {
                        const selected = roomId === r.id;
                        const clash = busyRooms[r.id];
                        const unavailable = Boolean(clash) || r.isMaintenance;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={r.isMaintenance}
                            onClick={() => setRoomId(r.id)}
                            className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors ${
                              selected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                            } ${r.isMaintenance ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                selected ? 'border-blue-600' : 'border-slate-300'
                              }`}
                            >
                              {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900">{r.name}</span>
                              <span className="block truncate text-xs text-slate-500">
                                {r.company?.name} · {r.floor || 'Main Hall'}
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-0.5">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Users className="h-3 w-3" />
                                {r.capacityMin}–{r.capacityMax}
                              </span>
                              {r.isMaintenance ? (
                                <span className="text-[11px] font-medium text-slate-500">Maintenance</span>
                              ) : unavailable ? (
                                <span className="text-[11px] font-medium text-amber-600">Booked</span>
                              ) : (
                                <span className="text-[11px] font-medium text-emerald-600">Available</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedRoomBusy && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {selectedRoom?.name} is booked
                          {selectedRoomBusy.title ? ` for "${selectedRoomBusy.title}"` : ''} at this time. Pick another
                          room or time.
                        </span>
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  {/* Booking summary */}
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{selectedRoom?.name}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {dateLabel} · {start}–{end} ({formatDuration(durationMins)})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Pencil className="h-3 w-3" /> Change
                    </button>
                  </div>

                  <div>
                    <label htmlFor="booking-title" className={labelCls}>Meeting title</label>
                    <input
                      id="booking-title"
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Q4 Sales Target Alignment"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
                    <div>
                      <label htmlFor="booking-category" className={labelCls}>Category</label>
                      {isCustomCategory ? (
                        <div className="relative">
                          <input
                            id="booking-category"
                            type="text"
                            required
                            autoFocus
                            placeholder="Type a category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={inputCls + ' pr-20'}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCategory(false);
                              setCategory(CATEGORY_PRESETS[0]);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Presets
                          </button>
                        </div>
                      ) : (
                        <select
                          id="booking-category"
                          value={category}
                          onChange={(e) => {
                            if (e.target.value === CUSTOM_CATEGORY) {
                              setIsCustomCategory(true);
                              setCategory('');
                            } else {
                              setCategory(e.target.value);
                            }
                          }}
                          className={inputCls}
                        >
                          {CATEGORY_PRESETS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value={CUSTOM_CATEGORY}>Other (custom)…</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label htmlFor="booking-count" className={labelCls}>Attendees</label>
                      <input
                        id="booking-count"
                        type="number"
                        min={1}
                        required
                        value={attendeesCount}
                        onChange={(e) => setAttendeesCount(parseInt(e.target.value, 10) || 1)}
                        className={`${inputCls} ${isOverCapacity ? 'border-amber-400 bg-amber-50' : ''}`}
                      />
                    </div>
                  </div>

                  {isOverCapacity && (
                    <p className="-mt-1 flex items-center gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Exceeds room capacity ({selectedRoom?.capacityMax} seats).
                    </p>
                  )}

                  {/* Invitees */}
                  <div ref={attendeeBoxRef} className="relative">
                    <label htmlFor="booking-invitees" className={labelCls}>
                      Invite attendees <span className="font-normal text-slate-400">(optional · receives a calendar invite)</span>
                    </label>
                    <div
                      onClick={() => document.getElementById('booking-invitees')?.focus()}
                      className="flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 hover:border-slate-400"
                    >
                      <AnimatePresence initial={false}>
                        {attendees.map((email) => (
                          <motion.span
                            key={email}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-0.5 pl-2 pr-1 text-xs font-medium text-slate-700"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAttendees(attendees.filter((a) => a !== email));
                              }}
                              aria-label={`Remove ${email}`}
                              className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      <div className="flex min-w-[10rem] flex-1 items-center gap-1.5 px-1">
                        {attendees.length === 0 && <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                        <input
                          id="booking-invitees"
                          type="text"
                          autoComplete="off"
                          placeholder={attendees.length ? 'Add more…' : 'Search name or type an email'}
                          value={attendeeSearch}
                          onFocus={() => setShowDirectory(true)}
                          onChange={(e) => {
                            setAttendeeSearch(e.target.value);
                            setShowDirectory(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              if (attendeeSearch.includes('@')) addAttendee(attendeeSearch);
                              else if (filteredDirectory[0]) addAttendee(filteredDirectory[0].email);
                            } else if (e.key === 'Backspace' && !attendeeSearch && attendees.length) {
                              setAttendees(attendees.slice(0, -1));
                            }
                          }}
                          className="w-full bg-transparent py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {showDirectory && filteredDirectory.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                        >
                          {filteredDirectory.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => addAttendee(item.email)}
                                className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50"
                              >
                                <span className="text-sm font-medium text-slate-800">{item.fullName}</span>
                                <span className="text-xs text-slate-400">
                                  {item.email} · {item.department}
                                </span>
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label htmlFor="booking-requests" className={labelCls}>
                      Notes for GA <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="booking-requests"
                      type="text"
                      placeholder="e.g. HDMI cable, mineral water for 10 pax"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* Confidential toggle */}
                  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50">
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        <Lock className="h-3.5 w-3.5 text-slate-500" /> Confidential meeting
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Others see only &ldquo;Private Meeting&rdquo; on the calendar.
                      </span>
                    </span>
                    <span className="relative mt-0.5 inline-flex shrink-0">
                      <input
                        type="checkbox"
                        checked={isConfidential}
                        onChange={(e) => setIsConfidential(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40" />
                      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                    </span>
                  </label>

                  {/* Organizer */}
                  {editOrganizer && canChangeOrganizer ? (
                    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-700">Organizer</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          required
                          aria-label="Organizer name"
                          placeholder="Full name"
                          value={organizer.name}
                          onChange={(e) => setOrganizer({ ...organizer, name: e.target.value })}
                          className={inputCls}
                        />
                        <input
                          type="email"
                          required
                          aria-label="Organizer email"
                          placeholder="name@mra.co.id"
                          value={organizer.email}
                          onChange={(e) => setOrganizer({ ...organizer, email: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <input
                        type="text"
                        required
                        aria-label="Department"
                        placeholder="Department"
                        value={organizer.department}
                        onChange={(e) => setOrganizer({ ...organizer, department: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  ) : editOrganizer ? (
                    <div>
                      <label htmlFor="booking-dept" className={labelCls}>Your department</label>
                      <input
                        id="booking-dept"
                        type="text"
                        required
                        placeholder="e.g. IT & Shared Services"
                        value={organizer.department}
                        onChange={(e) => setOrganizer({ ...organizer, department: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="min-w-0 truncate">
                        Organizer: <span className="font-semibold text-slate-700">{organizer.name}</span>
                        {organizer.department ? ` · ${organizer.department}` : ''}
                      </span>
                      {canChangeOrganizer && (
                        <button
                          type="button"
                          onClick={() => setEditOrganizer(true)}
                          className="shrink-0 font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Book for someone else
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            {step === 1 ? (
              <>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  {scheduleValid && !checking && (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {selectedRoom?.name} is available
                    </>
                  )}
                </span>
                <button
                  type="button"
                  disabled={!scheduleValid || checking}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Booking…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Confirm booking
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
