'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown } from 'lucide-react';

interface TimeSelectProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  options: string[];
  isDisabled?: (option: string) => boolean;
  hint?: (option: string) => string | null;
  id?: string;
}

export default function TimeSelect({ value, onChange, options, isDisabled, hint, id }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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
    // Bring the current selection into view when the list opens
    requestAnimationFrame(() => {
      listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
    });
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
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-left text-sm text-slate-800 transition-colors ${
          open ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <Clock className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 font-medium tabular-nums">{value}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
            {options.map((opt) => {
              const disabled = isDisabled?.(opt) ?? false;
              const selected = opt === value;
              const note = hint?.(opt);
              return (
                <li key={opt} role="option" aria-selected={selected} aria-disabled={disabled}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm tabular-nums transition-colors ${
                      selected
                        ? 'bg-blue-600 font-semibold text-white'
                        : disabled
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt}</span>
                    {note && <span className={`text-xs ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{note}</span>}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
