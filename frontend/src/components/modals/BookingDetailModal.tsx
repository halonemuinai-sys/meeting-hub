'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Download,
  Trash2,
  X,
  Mail,
  Sparkles,
  AlertTriangle,
  Loader2,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import { MeetingEvent, fmtDay, fmtTime, getCompanyBadge, getCategoryBadge } from '../calendar/calendarFormat';

interface BookingDetailModalProps {
  event: MeetingEvent;
  onClose: () => void;
  onCancelled: (message: string) => void;
}

export default function BookingDetailModal({ event: e, onClose, onCancelled }: BookingDetailModalProps) {
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const badge = getCompanyBadge(e.companyCode);
  const catBadge = getCategoryBadge(e.category);
  const isCancelled = e.status === 'CANCELLED';

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
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl z-10"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
              style={{ backgroundColor: e.colorCode || '#2563eb' }}
            >
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                  {badge.label}
                </span>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}>
                  {catBadge.label}
                </span>
                {e.isConfidential && (
                  <span className="flex items-center gap-1 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    <Lock className="h-2.5 w-2.5" /> Confidential
                  </span>
                )}
                {isCancelled && (
                  <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                    Cancelled
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {e.title}
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

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Details Content */}
        <div className="mt-5 space-y-3.5 text-xs">
          {e.isConfidential && (
            <div className={`flex items-start gap-2.5 rounded-2xl p-3 border text-xs ${
              e.canViewConfidential
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Lock className={`h-4 w-4 shrink-0 mt-0.5 ${e.canViewConfidential ? 'text-amber-700' : 'text-slate-500'}`} />
              <div>
                <p className="font-bold">
                  {e.canViewConfidential ? 'Confidential Meeting (Visible to You)' : 'Private Meeting Notice'}
                </p>
                <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                  {e.canViewConfidential
                    ? 'You are viewing full meeting details because you are the meeting organizer (or Super Admin). Agenda details and attendees are hidden from other staff on the public calendar.'
                    : 'Meeting title, description, and participant list have been marked as confidential by the organizer and are hidden.'}
                </p>
              </div>
            </div>
          )}
          {/* Time & Room Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Date & Time
              </span>
              <p className="mt-1 font-bold text-slate-900">
                {fmtDay(new Date(e.start), { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="font-mono text-blue-600 font-bold mt-0.5">
                {fmtTime(e.start)} - {fmtTime(e.end)} WIB
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Room & Location
              </span>
              <p className="mt-1 font-bold text-slate-900">{e.roomName}</p>
              <p className="text-slate-500 mt-0.5">{e.roomFloor || 'Main Hall'} · {e.companyName}</p>
            </div>
          </div>

          {/* Organizer */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Host / Organizer
            </span>
            <p className="mt-1 font-bold text-slate-900">
              {e.organizerName} ({e.organizerEmail})
            </p>
            <p className="text-slate-500 mt-0.5">Department: {e.department} · {e.attendeesCount} Attendees</p>
          </div>

          {/* Attendees Email */}
          {e.attendees && e.attendees.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Invited Attendees
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {e.attendees.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700 font-medium"
                  >
                    <Mail className="h-3 w-3 text-slate-400" />
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Special Requests */}
          {e.specialRequests && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                <Sparkles className="h-3 w-3" /> Special Requests
              </span>
              <p className="mt-1 font-medium text-amber-900">{e.specialRequests}</p>
            </div>
          )}

          {/* Cancellation Confirm Form */}
          {showCancelConfirm && (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 space-y-2 mt-4">
              <span className="block font-bold text-red-800 text-xs">
                Confirm Meeting Cancellation
              </span>
              <input
                type="text"
                placeholder="Reason for cancellation (e.g. Rescheduled / Organizer unavailable)..."
                value={reason}
                onChange={(ev) => setReason(ev.target.value)}
                className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Yes, Cancel Booking</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <span>Download .ics Invite</span>
          </button>

          <div className="flex items-center gap-2">
            {!isCancelled && !showCancelConfirm && (!e.isConfidential || e.canViewConfidential) && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Cancel Booking</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
