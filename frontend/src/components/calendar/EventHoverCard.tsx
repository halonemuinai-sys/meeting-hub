'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Lock, MapPin, StickyNote, User, Users } from 'lucide-react';
import { MeetingEvent, fmtDay, fmtTime } from './calendarFormat';

const SHOW_DELAY = 250;
const CARD_WIDTH = 288;
const GAP = 8;

type HoverState = { event: MeetingEvent; rect: DOMRect } | null;

function durationLabel(e: MeetingEvent) {
  const mins = Math.round((new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
}

function HoverCard({ state }: { state: HoverState }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!state) {
      setPos(null);
      return;
    }
    const { rect } = state;
    const height = ref.current?.offsetHeight || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right + GAP;
    if (left + CARD_WIDTH > vw - GAP) left = rect.left - CARD_WIDTH - GAP;
    if (left < GAP) left = Math.min(Math.max(GAP, rect.left), vw - CARD_WIDTH - GAP);

    let top = rect.top;
    if (top + height > vh - GAP) top = vh - height - GAP;
    setPos({ left, top: Math.max(GAP, top) });
  }, [state]);

  if (typeof document === 'undefined') return null;

  const e = state?.event;
  const masked = e ? e.isConfidential && !e.canViewConfidential : false;

  return createPortal(
    <AnimatePresence>
      {e && (
        <motion.div
          key={e.id}
          ref={ref}
          role="tooltip"
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: pos ? 1 : 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          style={{ position: 'fixed', left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: CARD_WIDTH }}
          className="pointer-events-none z-[60] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="h-1 w-full" style={{ backgroundColor: e.colorCode || '#2563eb' }} />
          <div className="space-y-2.5 p-3.5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span>{masked ? 'Confidential' : e.category || 'General Meeting'}</span>
                {e.status === 'CANCELLED' && <span className="font-semibold text-red-600">· Cancelled</span>}
              </div>
              <p className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold leading-snug text-slate-900">
                {e.isConfidential && <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />}
                <span className="line-clamp-2">{e.title}</span>
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="tabular-nums">
                  {fmtDay(new Date(e.start), { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(e.start)}–{fmtTime(e.end)}
                  <span className="text-slate-400"> ({durationLabel(e)})</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>
                  {e.roomName}
                  {e.roomFloor ? <span className="text-slate-400"> · {e.roomFloor}</span> : null}
                </span>
              </li>
              {!masked && (
                <>
                  <li className="flex items-start gap-2">
                    <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>
                      {e.organizerName}
                      {e.department ? <span className="text-slate-400"> · {e.department}</span> : null}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{e.attendeesCount} attendees</span>
                  </li>
                  {e.specialRequests && (
                    <li className="flex items-start gap-2">
                      <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-2">{e.specialRequests}</span>
                    </li>
                  )}
                </>
              )}
            </ul>

            <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-400">
              {masked ? 'Details are visible only to the organizer.' : 'Click to view details'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Hover preview for calendar events.
 * Spread `bind(event)` onto an event element and render `card` once inside the view.
 */
export function useEventHover() {
  const [state, setState] = useState<HoverState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setState(null);
  }, []);

  // Positions go stale when the page scrolls, so close the preview instead
  useEffect(() => {
    if (!state) return;
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [state, hide]);

  useEffect(() => hide, [hide]);

  const bind = useCallback(
    (event: MeetingEvent) => ({
      onMouseEnter: (ev: React.MouseEvent<HTMLElement>) => {
        const rect = ev.currentTarget.getBoundingClientRect();
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState({ event, rect }), SHOW_DELAY);
      },
      onMouseLeave: hide,
      onMouseDown: hide
    }),
    [hide]
  );

  return { bind, hide, card: <HoverCard state={state} /> };
}
