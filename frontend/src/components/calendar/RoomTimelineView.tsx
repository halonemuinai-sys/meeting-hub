'use client';

import React from 'react';
import { Users, Clock, AlertTriangle, Sparkles, MapPin, Lock } from 'lucide-react';
import { MeetingEvent, fmtTime, getCompanyBadge, getCategoryBadge, sameDay } from './calendarFormat';

const FIRST_HOUR = 8;
const LAST_HOUR = 19;
const ROW_HEIGHT = 64; // px per hour

interface RoomTimelineViewProps {
  date: Date;
  rooms: any[];
  events: MeetingEvent[];
  onOpenBooking: (event: MeetingEvent) => void;
  onSlotClick: (room: any, startHour: number) => void;
}

export default function RoomTimelineView({
  date,
  rooms,
  events,
  onOpenBooking,
  onSlotClick
}: RoomTimelineViewProps) {
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
  const today = new Date();
  const isToday = sameDay(date, today);

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const startMinutes = FIRST_HOUR * 60;
  const nowTop = ((nowMinutes - startMinutes) / 60) * ROW_HEIGHT;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="min-w-[980px]">
        {/* Room Columns Header */}
        <div
          className="sticky top-0 z-30 grid border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs"
          style={{ gridTemplateColumns: `72px repeat(${rooms.length || 1}, 1fr)` }}
        >
          {/* Time header cell */}
          <div className="flex items-center justify-center border-r border-slate-200/80 px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            WIB
          </div>

          {/* Rooms header */}
          {rooms.map((room) => {
            const badge = getCompanyBadge(room.company?.code);
            const roomDayEvents = events.filter(
              (e) => e.roomId === room.id && e.status === 'CONFIRMED' && sameDay(new Date(e.start), date)
            );

            return (
              <div
                key={room.id}
                className="border-r border-slate-200/80 px-3 py-3 text-left transition hover:bg-slate-100/50 last:border-r-0"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                    {badge.label}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Users className="h-3 w-3 text-slate-400" />
                    {room.capacityMin}-{room.capacityMax} seats
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 truncate" title={room.name}>
                    {room.name}
                  </h3>
                </div>

                <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">{room.floor || 'Main Hall'}</span>
                  <span className="font-medium text-blue-600">
                    {roomDayEvents.length ? `${roomDayEvents.length} meeting${roomDayEvents.length > 1 ? 's' : ''}` : 'Available'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Grid Body */}
        <div
          className="relative grid select-none"
          style={{
            gridTemplateColumns: `72px repeat(${rooms.length || 1}, 1fr)`,
            height: hours.length * ROW_HEIGHT
          }}
        >
          {/* Time Column Labels */}
          <div className="border-r border-slate-200/80 bg-slate-50/40">
            {hours.map((h) => (
              <div
                key={h}
                className="relative border-b border-slate-100 pr-2.5 pt-1.5 text-right font-mono text-[11px] text-slate-400 tabular-nums"
                style={{ height: ROW_HEIGHT }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Current time red line across all rooms */}
          {isToday && nowTop >= 0 && nowTop <= hours.length * ROW_HEIGHT && (
            <div
              className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
              style={{ top: nowTop }}
            >
              <div className="relative -ml-2.5 h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
              <div className="h-[2px] flex-1 bg-red-500/90 shadow-xs" />
            </div>
          )}

          {/* Room Columns */}
          {rooms.map((room) => {
            const roomDayEvents = events.filter(
              (e) => e.roomId === room.id && e.status === 'CONFIRMED' && sameDay(new Date(e.start), date)
            );

            return (
              <div
                key={room.id}
                className="relative border-r border-slate-100 last:border-r-0 hover:bg-blue-50/10 transition-colors"
                style={{ height: hours.length * ROW_HEIGHT }}
              >
                {/* Horizontal hour lines (clickable for fast booking) */}
                {hours.map((h) => (
                  <div
                    key={h}
                    onClick={() => onSlotClick(room, h)}
                    title={`Click to book ${room.name} at ${String(h).padStart(2, '0')}:00`}
                    className="group relative cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/40"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <span className="absolute left-2 top-2 hidden text-[10px] font-semibold text-blue-600 group-hover:inline-block">
                      + Book slot
                    </span>
                  </div>
                ))}

                {/* Render Booked Meeting Cards */}
                {roomDayEvents.map((e) => {
                  const s = new Date(e.start);
                  const end = new Date(e.end);

                  const startHour = s.getHours() + s.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;

                  const top = Math.max(0, (startHour - FIRST_HOUR) * ROW_HEIGHT);
                  const height = Math.max(34, (endHour - startHour) * ROW_HEIGHT - 4);

                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onOpenBooking(e);
                      }}
                      className={`group absolute inset-x-1.5 z-10 flex flex-col justify-between overflow-hidden rounded-xl border p-2.5 text-left shadow-xs transition hover:z-20 hover:shadow-md focus:outline-none focus:ring-2 ${
                        e.isConfidential && !e.canViewConfidential
                          ? 'border-slate-300 bg-gradient-to-br from-slate-100/90 via-white to-slate-50 text-slate-700 hover:border-slate-400 focus:ring-slate-400'
                          : 'border-blue-200/90 bg-gradient-to-br from-blue-50/95 via-white to-blue-50/80 hover:border-blue-400 focus:ring-blue-500'
                      }`}
                      style={{
                        top: top + 2,
                        height,
                        borderLeftWidth: '4px',
                        borderLeftColor: e.isConfidential && !e.canViewConfidential ? '#64748b' : (e.colorCode || '#2563eb')
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                          <span className={`flex items-center gap-1 tabular-nums ${e.isConfidential && !e.canViewConfidential ? 'text-slate-600' : 'text-blue-800'}`}>
                            <Clock className="h-3 w-3 shrink-0" />
                            {fmtTime(e.start)} - {fmtTime(e.end)}
                          </span>
                          {e.isConfidential ? (
                            <span className="flex items-center gap-0.5 rounded bg-amber-100 border border-amber-300 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                              <Lock className="h-2 w-2" /> Private
                            </span>
                          ) : (
                            <span className={`rounded border px-1 py-0.2 text-[8px] font-bold ${getCategoryBadge(e.category).bg} ${getCategoryBadge(e.category).text} ${getCategoryBadge(e.category).border} truncate max-w-[90px]`}>
                              {e.category || `${e.attendeesCount} pax`}
                            </span>
                          )}
                        </div>
                        <h4 className={`mt-1 truncate text-xs font-bold flex items-center gap-1 ${
                          e.isConfidential && !e.canViewConfidential ? 'text-slate-700' : 'text-slate-900 group-hover:text-blue-700'
                        }`}>
                          {e.isConfidential && e.canViewConfidential && <Lock className="h-3 w-3 text-amber-600 shrink-0" />}
                          <span className="truncate">{e.title}</span>
                        </h4>
                        {height > 52 && (
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">
                            {e.isConfidential && !e.canViewConfidential ? 'Confidential Organizer' : `Host: ${e.organizerName} · ${e.department}`}
                          </p>
                        )}
                      </div>

                      {height > 74 && e.specialRequests && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-700 font-medium truncate">
                          <Sparkles className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{e.specialRequests}</span>
                        </div>
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
