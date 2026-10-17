'use client';

import React from 'react';
import { Users, Lock } from 'lucide-react';
import { MeetingEvent, fmtTime, getCompanyBadge, sameDay } from './calendarFormat';
import { useEventHover } from './EventHoverCard';

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
  const { bind, card } = useEventHover();
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
  const today = new Date();
  const isToday = sameDay(date, today);

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const startMinutes = FIRST_HOUR * 60;
  const nowTop = ((nowMinutes - startMinutes) / 60) * ROW_HEIGHT;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
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
                    className="group relative cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/40"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <span className="absolute left-2 top-1.5 hidden text-[10px] font-medium text-blue-600 group-hover:inline-block">
                      + Book {String(h).padStart(2, '0')}:00
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

                  const masked = e.isConfidential && !e.canViewConfidential;
                  const color = masked ? '#64748b' : e.colorCode || '#2563eb';

                  return (
                    <button
                      key={e.id}
                      type="button"
                      {...bind(e)}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onOpenBooking(e);
                      }}
                      className="group absolute inset-x-1.5 z-10 flex flex-col overflow-hidden rounded-lg border border-l-[3px] px-2.5 py-1.5 text-left transition hover:z-20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      style={{
                        top: top + 2,
                        height,
                        borderColor: `${color}33`,
                        borderLeftColor: color,
                        backgroundColor: `${color}0f`
                      }}
                    >
                      <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                        {fmtTime(e.start)} – {fmtTime(e.end)}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-900">
                        {e.isConfidential && <Lock className="h-3 w-3 shrink-0 text-slate-500" />}
                        <span className="truncate">{e.title}</span>
                      </span>
                      {height > 56 && (
                        <span className="mt-0.5 truncate text-[11px] text-slate-500">
                          {masked ? 'Confidential' : `${e.organizerName} · ${e.department}`}
                        </span>
                      )}
                      {height > 76 && !masked && e.category && (
                        <span className="mt-auto truncate text-[10px] font-medium text-slate-400">{e.category}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {card}
    </div>
  );
}
