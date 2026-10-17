'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CalendarPlus,
  Clock,
  Loader2,
  Lock,
  MapPin,
  StickyNote,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { MeetingEvent, fmtDay, fmtTime } from '../calendar/calendarFormat';

interface BookingDetailModalProps {
  event: MeetingEvent;
  onClose: () => void;
  onCancelled: (message: string) => void;
}

function durationLabel(e: MeetingEvent) {
  const mins = Math.round((new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
}

function initials(value: string) {
  const name = value.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function DetailRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export default function BookingDetailModal({ event: e, onClose, onCancelled }: BookingDetailModalProps) {
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const isCancelled = e.status === 'CANCELLED';
  const masked = e.isConfidential && !e.canViewConfidential;
  const color = masked ? '#64748b' : e.colorCode || '#2563eb';

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDownloadIcs = () => {
    const s = new Date(e.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(e.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `mra-ics-${e.id}@mra.co.id`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MRA Group//Booking Meeting Room//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${s}`,
      `DTSTART:${s}`,
      `DTEND:${end}`,
      `SUMMARY:${e.title}`,
      `DESCRIPTION:${e.description || 'Internal MRA Meeting'}`,
      `LOCATION:${e.roomName} - ${e.companyName}`,
      `ORGANIZER;CN="${e.organizerName}":mailto:${e.organizerEmail}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Meeting_${e.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      const res = await api.cancelBooking(e.id, reason || 'Cancelled by organizer');
      onCancelled(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation.');
      setCancelling(false);
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
        aria-labelledby="booking-detail-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative z-10 my-8 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-500">{masked ? 'Confidential' : e.category || 'General Meeting'}</span>
              {e.isConfidential && !masked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  <Lock className="h-3 w-3" /> Confidential
                </span>
              )}
              {isCancelled && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Cancelled</span>
              )}
            </div>
            <h2
              id="booking-detail-title"
              className={`mt-1 flex items-start gap-1.5 text-lg font-bold leading-snug text-slate-900 ${isCancelled ? 'line-through decoration-slate-300' : ''}`}
            >
              {masked && <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-500" />}
              {e.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4 px-6 pb-5">
          <DetailRow icon={Clock}>
            <p className="font-medium text-slate-900">
              {fmtDay(new Date(e.start), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="tabular-nums text-slate-500">
              {fmtTime(e.start)} – {fmtTime(e.end)} WIB · {durationLabel(e)}
            </p>
          </DetailRow>

          <DetailRow icon={MapPin}>
            <p className="font-medium text-slate-900">{e.roomName}</p>
            <p className="text-slate-500">
              {[e.roomFloor, e.companyName].filter(Boolean).join(' · ')}
            </p>
          </DetailRow>

          {masked ? (
            <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              This meeting is confidential. The title, organizer and attendees are visible only to the organizer.
            </div>
          ) : (
            <>
              <DetailRow icon={User}>
                <p className="font-medium text-slate-900">{e.organizerName}</p>
                <p className="truncate text-slate-500">
                  {[e.department, e.organizerEmail].filter(Boolean).join(' · ')}
                </p>
              </DetailRow>

              <DetailRow icon={Users}>
                <p className="font-medium text-slate-900">
                  {e.attendeesCount} attendees
                  {e.attendees && e.attendees.length > 0 && (
                    <span className="font-normal text-slate-500"> · {e.attendees.length} invited</span>
                  )}
                </p>
                {e.attendees && e.attendees.length > 0 && (
                  <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
                    {e.attendees.map((email) => (
                      <li key={email} className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {initials(email)}
                        </span>
                        <span className="truncate text-xs text-slate-600">{email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailRow>

              {e.specialRequests && (
                <DetailRow icon={StickyNote}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes for GA</p>
                  <p className="mt-0.5">{e.specialRequests}</p>
                </DetailRow>
              )}

              {e.isConfidential && (
                <p className="text-xs text-slate-400">
                  You can see these details because you are the organizer or a Super Admin.
                </p>
              )}
            </>
          )}

          {isCancelled && e.cancelReason && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
              <span className="font-semibold">Cancellation reason:</span> {e.cancelReason}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence initial={false}>
            {showCancelConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
                  <p className="text-sm font-semibold text-red-800">Cancel this booking?</p>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Reason (optional), e.g. Rescheduled"
                    value={reason}
                    onChange={(ev) => setReason(ev.target.value)}
                    className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
                    >
                      Keep booking
                    </button>
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={handleCancel}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Cancel booking
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
          {!masked && !isCancelled ? (
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <CalendarPlus className="h-4 w-4" />
              Add to calendar
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {!isCancelled && !showCancelConfirm && e.canCancel && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                Cancel booking
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
