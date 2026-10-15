'use client';

import React from 'react';
import { Calendar, Clock, MapPin, Users, Sparkles, Lock } from 'lucide-react';
import { MeetingEvent, fmtDay, fmtTime, getCompanyBadge, getCategoryBadge, sameDay } from './calendarFormat';

interface AgendaViewProps {
  events: MeetingEvent[];
  onOpenBooking: (e: MeetingEvent) => void;
}

export default function AgendaView({ events, onOpenBooking }: AgendaViewProps) {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const groups: { date: Date; items: MeetingEvent[] }[] = [];
  sorted.forEach((e) => {
    const d = new Date(e.start);
    const existing = groups.find((g) => sameDay(g.date, d));
    if (existing) {
      existing.items.push(e);
    } else {
      groups.push({ date: d, items: [e] });
    }
  });

  const today = new Date();

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <Calendar className="h-10 w-10 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-700">No Meetings Scheduled</h3>
        <p className="mt-1 text-xs text-slate-400">There are no meeting room reservations for this time period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const isToday = sameDay(g.date, today);

        return (
          <div key={g.date.toISOString()} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            {/* Date Group Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
                  isToday ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {g.date.getDate()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {fmtDay(g.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  {isToday && (
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {g.items.length} meeting{g.items.length > 1 ? 's' : ''} scheduled
                </p>
              </div>
            </div>

            {/* List of Meetings */}
            <div className="mt-3 divide-y divide-slate-100">
              {g.items.map((e) => {
                const badge = getCompanyBadge(e.companyCode);
                const catBadge = getCategoryBadge(e.category);
                const isCancelled = e.status === 'CANCELLED';

                return (
                  <div
                    key={e.id}
                    onClick={() => onOpenBooking(e)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 transition hover:bg-slate-50/80 rounded-xl cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Time pill */}
                      <div className="flex flex-col items-center justify-center rounded-xl bg-slate-100/80 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-slate-400 mb-0.5" />
                        <span>{fmtTime(e.start)}</span>
                        <span className="text-[10px] text-slate-400">{fmtTime(e.end)}</span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}
                          >
                            {catBadge.label}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {e.roomName} {e.roomFloor ? `(${e.roomFloor})` : ''}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            · <Users className="h-3 w-3" /> {e.attendeesCount} pax
                          </span>
                          {e.isConfidential && (
                            <span className="flex items-center gap-1 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                              <Lock className="h-2.5 w-2.5" /> Confidential
                            </span>
                          )}
                          {isCancelled && (
                            <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                              Cancelled
                            </span>
                          )}
                        </div>

                        <h4 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          {e.isConfidential && <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                          <span>{e.title}</span>
                        </h4>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Host: <span className="font-medium text-slate-700">{e.isConfidential && !e.canViewConfidential ? 'Private Organizer' : e.organizerName}</span> {e.organizerEmail ? `(${e.organizerEmail})` : ''} · Dept: {e.department}
                        </p>

                        {e.specialRequests && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <Sparkles className="h-3 w-3 shrink-0" />
                            <span>Special Requests: {e.specialRequests}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs group-hover:border-blue-300 group-hover:text-blue-600 transition-all">
                        View Details
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
