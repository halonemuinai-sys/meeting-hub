'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, CheckCircle2, Loader2, Plus, Search, X } from 'lucide-react';

// Shared building blocks for the admin pages (rooms, amenities, attendees, users)

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
export const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-700';

export function PageHeader({
  title,
  description,
  actionLabel,
  onAction
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Notice({ notice }: { notice: { tone: 'success' | 'error'; message: string } | null }) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${
        notice.tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {notice.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {notice.message}
    </div>
  );
}

export function useNotice() {
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = React.useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setNotice({ tone, message });
    timer.current = setTimeout(() => setNotice(null), 4000);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return { notice, show };
}

export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange
}: {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1 text-xs font-semibold">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 transition ${
            value === o.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1 tabular-nums text-slate-400">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-60"
      />
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}

export function TableShell({ children, minWidth = 720 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export const thCls = 'px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500';
export const theadCls = 'border-b border-slate-100 bg-slate-50/70';

export function TableState({ colSpan, loading, empty }: { colSpan: number; loading: boolean; empty: string }) {
  if (loading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <tr key={i}>
            <td colSpan={colSpan} className="px-4 py-4">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            </td>
          </tr>
        ))}
      </>
    );
  }
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <p className="text-sm font-medium text-slate-600">{empty}</p>
        <p className="mt-0.5 text-xs text-slate-400">Try another filter or search term.</p>
      </td>
    </tr>
  );
}

export function IconAction({
  label,
  onClick,
  tone = 'neutral',
  disabled,
  children
}: {
  label: string;
  onClick: () => void;
  tone?: 'neutral' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const toneCls = {
    neutral: 'hover:bg-slate-100 hover:text-slate-700',
    danger: 'hover:bg-red-50 hover:text-red-600',
    warning: 'hover:bg-amber-50 hover:text-amber-600',
    success: 'hover:bg-emerald-50 hover:text-emerald-600'
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 text-slate-400 transition disabled:opacity-40 ${toneCls}`}
    >
      {children}
    </button>
  );
}

export function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
      {initials || '?'}
    </span>
  );
}

export function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  saving,
  error,
  submitLabel,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  error?: string;
  submitLabel: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
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
            aria-label={title}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative z-10 my-8 w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSubmit}>
              <div className="space-y-4 px-6 py-5">
                {children}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {submitLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
