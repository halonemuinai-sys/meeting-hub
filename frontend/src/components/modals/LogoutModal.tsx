'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertTriangle, Shield, CheckCircle2, Loader2, Building2 } from 'lucide-react';
import { AuthUser } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/permissions';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: AuthUser | null;
}

const getInitials = (name?: string) => {
  if (!name) return 'MR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  user
}: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoggingOut) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoggingOut, onClose]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          {/* Backdrop with rich blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!isLoggingOut ? onClose : undefined}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl"
          >
            {/* Top Decorative Header Accent */}
            <div className="relative h-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 pt-6 text-white flex items-center justify-between overflow-hidden">
              {/* Subtle luxury background glows */}
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-red-500/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />

              <div className="relative flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-rose-400 shadow-inner">
                  <LogOut className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                </div>
                <div>
                  <h3 id="logout-title" className="text-base font-extrabold tracking-tight text-white">
                    Sign Out Session
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    MRA Corporate Meeting Hub
                  </p>
                </div>
              </div>

              {!isLoggingOut && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Active User Identity Card */}
              {user && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-sm font-black text-white shadow-sm">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-extrabold text-blue-700">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                    {user.company && (
                      <p className="truncate text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span>{user.company.name} {user.department ? `· ${user.department}` : ''}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Informative Explanation */}
              <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                <p className="font-semibold text-slate-800">
                  Are you sure you want to log out of your corporate account?
                </p>
                <p className="text-slate-500 text-[11px]">
                  You will need to sign in again to book rooms, adjust GA amenities, access confidential meetings, or generate analytics reports.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 cursor-pointer"
                >
                  Stay Signed In
                </button>

                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleSignOut}
                  className="group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/25 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign Out Now</span>
                      <LogOut className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
