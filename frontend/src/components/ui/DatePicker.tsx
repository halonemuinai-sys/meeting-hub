'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { startOfDay } from '@/components/calendar/calendarFormat';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  id?: string;
}

export default function DatePicker({ value, onChange, minDate, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-left text-sm text-slate-800 transition-colors ${
          open ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 font-medium">
          {value.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choose date"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ transformOrigin: 'top left' }}
            className="absolute left-0 top-full z-40 mt-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          >
            <DayPicker
              mode="single"
              animate
              required
              weekStartsOn={1}
              selected={value}
              defaultMonth={value}
              disabled={minDate ? { before: startOfDay(minDate) } : undefined}
              onSelect={(d) => {
                if (d) {
                  onChange(d);
                  setOpen(false);
                }
              }}
              className="mra-day-picker"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
