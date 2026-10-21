'use client';

import React from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { ShieldCheck, MailCheck, Building2 } from 'lucide-react';

export default function AuthSidePanel() {
  return (
    <MotionConfig reducedMotion="user">
    <div
      className="hidden lg:flex w-[48%] shrink-0 relative overflow-hidden flex-col items-center justify-between min-h-dvh select-none px-8 py-8 xl:px-12 xl:py-10 text-slate-800"
      style={{
        background: 'linear-gradient(145deg, #eff6ff 0%, #e8f0fb 38%, #f1f5f9 70%, #f8fafc 100%)'
      }}
    >
      {/* Decorative Circuit Lines */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="20%" x2="35%" y2="20%" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="35%" y1="20%" x2="35%" y2="35%" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="35%" y1="35%" x2="60%" y2="35%" stroke="#2563eb" strokeWidth="1.2" />
        <circle cx="35%" cy="20%" r="3" fill="#2563eb" />
        <circle cx="60%" cy="35%" r="3" fill="#2563eb" />

        <line x1="100%" y1="65%" x2="70%" y2="65%" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="70%" y1="65%" x2="70%" y2="82%" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="70%" y1="82%" x2="40%" y2="82%" stroke="#2563eb" strokeWidth="1.2" />
        <circle cx="70%" cy="65%" r="3" fill="#2563eb" />
        <circle cx="40%" cy="82%" r="3" fill="#2563eb" />
      </svg>

      {/* Top Header Pill */}
      <div className="relative z-10 w-full flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-blue-100 flex items-center justify-center p-2">
            <img src="/mra_logo.png" alt="MRA Group" className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-slate-800 uppercase block">MRA GROUP</span>
            <span className="text-[10px] font-medium text-slate-500">Corporate Shared Services</span>
          </div>
        </div>
      </div>

      {/* Center Branding Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm my-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-24 h-24 rounded-3xl bg-white shadow-sm shadow-blue-200/40 flex items-center justify-center border border-blue-100 p-4 mb-6"
        >
          <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Meeting Room<br />Booking System
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-sm">
          Room reservations for PT Mugi Rekso Abadi, PT Mogems Putri International, and MRA Media.
        </p>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-1 gap-3 w-full text-left">
          <div className="flex items-center gap-3 rounded-xl bg-white/80 border border-white/90 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Anti-Collision Engine</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Real-time slot conflict prevention & capacity warnings</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/80 border border-white/90 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MailCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Automated Calendar Invitations</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Calendar invitations for Outlook & Google Calendar</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/80 border border-white/90 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">6 Corporate Master Rooms</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Lt 10 Mogems, Lt 8 MRA Holding (A, B, C), & MRA Media</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 w-full flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 border-t border-blue-100/60 pt-4">
        <span>© 2026 MRA Group. IT Shared Services.</span>
        <span>Secure employee access</span>
      </div>
    </div>
    </MotionConfig>
  );
}
