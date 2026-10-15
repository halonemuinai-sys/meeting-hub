'use client';

import React, { useMemo } from 'react';
import { MeetingEvent, addDays, fmtTime, sameDay, startOfWeek, getCompanyBadge } from './calendarFormat';

interface MonthViewProps {
  anchor: Date;
  events: MeetingEvent[];
  onOpenBooking: (e: MeetingEvent) => void;
  onSelectDay: (d: Date) => void;
}

export default function MonthView({ anchor, events, onOpenBooking, onSelectDay }: MonthViewProps) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);

  const days = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => addDays(gridStart, i));
  }, [gridStart]);

  const today = new Date();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      {/* Day Names Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 py-2.5">
        {dayNames.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>

      {/* 35 Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {days.map((d) => {
          const isCurrentMonth = d.getMonth() === anchor.getMonth();
          const isToday = sameDay(d, today);
          const dayEvents = events.filter((e) => e.status === 'CONFIRMED' && sameDay(new Date(e.start), d));

          return (
            <div
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className={`group min-h-[110px] p-2 transition hover:bg-blue-50/30 cursor-pointer ${
                !isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                    isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700'
                  }`}
                >
                  {d.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event preview chips */}
              <div className="mt-1.5 space-y-1">
                {dayEvents.slice(0, 3).map((e) => {
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onOpenBooking(e);
                      }}
                      className="w-full truncate rounded border border-slate-200/80 bg-white px-1.5 py-0.5 text-left text-[10px] font-semibold text-slate-800 shadow-2xs hover:border-blue-400 hover:text-blue-600 focus:outline-none"
                      style={{ borderLeftWidth: '3px', borderLeftColor: e.colorCode || '#2563eb' }}
                    >
                      <span className="font-mono text-[9px] text-slate-500 mr-1">{fmtTime(e.start)}</span>
                      {e.isConfidential ? '🔒 ' : ''}{e.title}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="text-[9px] font-semibold text-slate-400 pl-1">
                    +{dayEvents.length - 3} more meetings
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
