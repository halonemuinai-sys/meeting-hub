'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, Clock, MapPin, Users, Lock } from 'lucide-react';
import { MeetingEvent, addDays, fmtDay, fmtTime, sameDay, getCompanyBadge } from './calendarFormat';

const FIRST_HOUR = 8;
const LAST_HOUR = 19;
const ROW_HEIGHT = 64;

function layout(events: MeetingEvent[]) {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const out: { e: MeetingEvent; lane: number; lanes: number }[] = [];
  let cluster: { e: MeetingEvent; lane: number; lanes: number }[] = [];
  let clusterEnd = 0;

  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => out.push({ ...c, lanes }));
    cluster = [];
  };

  sorted.forEach((e) => {
    const s = new Date(e.start).getTime();
    const end = new Date(e.end).getTime();
    if (cluster.length && s >= clusterEnd) flush();
    const used = new Set(cluster.filter((c) => new Date(c.e.end).getTime() > s).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ e, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, end);
  });
  flush();
  return out;
}

interface WeekViewProps {
  weekStart: Date;
  events: MeetingEvent[];
  onOpenBooking: (e: MeetingEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}

export default function WeekView({ weekStart, events, onOpenBooking, onSlotClick }: WeekViewProps) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = new Date();
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const startMinutes = FIRST_HOUR * 60;
  const nowTop = ((nowMinutes - startMinutes) / 60) * ROW_HEIGHT;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="min-w-[880px]">
        {/* Days Header */}
        <div className="sticky top-0 z-30 grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-200 bg-white">
          <div className="flex items-center justify-center border-r border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            WIB
          </div>
          {days.map((d) => {
            const isToday = sameDay(d, today);
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const count = events.filter((e) => sameDay(new Date(e.start), d) && e.status === 'CONFIRMED').length;

            return (
              <div
                key={d.toISOString()}
                className={`border-r border-slate-100 px-2 py-3 text-center transition last:border-r-0 ${
                  isToday ? 'bg-blue-50/70' : weekend ? 'bg-slate-50/70' : ''
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                  {fmtDay(d, { weekday: 'short' })}
                </p>
                <p
                  className={`my-1 inline-flex h-8 w-8 items-center justify-center rounded-xl text-base font-bold ${
                    isToday ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-800'
                  }`}
                >
                  {d.getDate()}
                </p>
                <p className="h-3 text-[10px] font-medium text-slate-400">
                  {count ? `${count} meeting${count > 1 ? 's' : ''}` : ''}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="relative grid grid-cols-[64px_repeat(7,1fr)] select-none">
          <div className="border-r border-slate-100 bg-slate-50/30">
            {hours.map((h) => (
              <div
                key={h}
                className="border-b border-slate-100 pr-2 pt-1 text-right font-mono text-[10px] text-slate-400 tabular-nums"
                style={{ height: ROW_HEIGHT }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((d) => {
            const isToday = sameDay(d, today);
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const dayEvents = events.filter((e) => e.status === 'CONFIRMED' && sameDay(new Date(e.start), d));

            return (
              <div
                key={d.toISOString()}
                className={`relative border-r border-slate-100 last:border-r-0 ${
                  isToday ? 'bg-blue-50/20' : weekend ? 'bg-slate-50/50' : ''
                }`}
                style={{ height: hours.length * ROW_HEIGHT }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    onClick={() => onSlotClick && onSlotClick(d, h)}
                    className="border-t border-slate-100 cursor-pointer hover:bg-blue-50/30 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                  />
                ))}

                {isToday && nowTop >= 0 && nowTop <= hours.length * ROW_HEIGHT && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                    <div className="h-0.5 bg-red-500 shadow-xs" />
                    <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>
                )}

                {layout(dayEvents).map(({ e, lane, lanes }) => {
                  const s = new Date(e.start);
                  const end = new Date(e.end);

                  const startHour = s.getHours() + s.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;

                  const top = Math.max(0, (startHour - FIRST_HOUR) * ROW_HEIGHT);
                  const height = Math.max(30, (endHour - startHour) * ROW_HEIGHT - 4);
                  const badge = getCompanyBadge(e.companyCode);

                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onOpenBooking(e)}
                      title={`${fmtTime(e.start)} - ${fmtTime(e.end)}: ${e.title} (${e.roomName})`}
                      className="absolute z-10 overflow-hidden rounded-lg border border-l-[3px] p-1.5 text-left shadow-xs transition hover:z-30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        top: top + 2,
                        height,
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                        borderLeftColor: e.colorCode || '#2563eb',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-700">
                        <span className="tabular-nums text-blue-700">{fmtTime(e.start)}</span>
                        <span className={`rounded px-1 py-0.2 text-[8px] ${badge.bg} ${badge.text}`}>
                          {e.roomName}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-slate-900 leading-tight flex items-center gap-1">
                        {e.isConfidential && <Lock className="h-2.5 w-2.5 text-amber-600 shrink-0" />}
                        <span className="truncate">{e.title}</span>
                      </p>
                      {height > 44 && (
                        <p className="truncate text-[9px] text-slate-500">
                          {e.category && (
                            <span className="font-semibold text-slate-700">{e.category} · </span>
                          )}
                          {e.isConfidential && !e.canViewConfidential ? 'Private Organizer' : e.organizerName}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
