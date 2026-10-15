'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ShieldCheck, MailCheck, Sparkles, Building2 } from 'lucide-react';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: ((i * 43 + 7) % 86) + 7,
  top: ((i * 39 + 11) % 80) + 8,
  size: i % 4 === 0 ? 5 : i % 3 === 0 ? 4 : 3,
  duration: 4.5 + (i % 3),
  delay: (i * 0.35) % 2.5,
  yOffset: i % 2 === 0 ? -12 : 12,
}));

export default function AuthSidePanel() {
  return (
    <div
      className="hidden lg:flex w-[48%] relative overflow-hidden flex-col items-center justify-between h-screen select-none p-12 text-slate-800"
      style={{
        background: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 38%, #e8edff 70%, #f8fafc 100%)'
      }}
    >
      {/* Decorative Circuit Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.25]" xmlns="http://www.w3.org/2000/svg">
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

      {/* Floating Animated Particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-500/40"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
          animate={{ y: [0, p.yOffset, 0], opacity: [0.3, 0.75, 0.3] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Top Header Pill */}
      <div className="relative z-10 w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white shadow-md border border-blue-100 flex items-center justify-center p-2">
            <img src="/mra_logo.png" alt="MRA Group" className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-slate-800 uppercase block">MRA GROUP</span>
            <span className="text-[10px] font-medium text-slate-500">Corporate Shared Services</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-blue-100/80 shadow-xs text-[11px] font-bold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span>v1.2 Live Enterprise</span>
        </div>
      </div>

      {/* Center Branding Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-24 h-24 rounded-3xl bg-white shadow-2xl shadow-blue-200/60 flex items-center justify-center border border-blue-100 p-4 mb-6"
        >
          <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
        </motion.div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Meeting Room<br />Booking System
        </h1>
        <p className="mt-2.5 text-xs font-medium text-slate-600 leading-relaxed max-w-sm">
          Multi-entity corporate room reservation cockpit for PT Mugi Rekso Abadi, PT Mogems Putri International, and MRA Media.
        </p>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-1 gap-2.5 w-full text-left">
          <div className="flex items-center gap-3 rounded-2xl bg-white/85 border border-blue-100 p-3 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Anti-Collision Engine</p>
              <p className="text-[10px] text-slate-500">Real-time slot conflict prevention & capacity warnings</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/85 border border-blue-100 p-3 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MailCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Automated Calendar Invitations</p>
              <p className="text-[10px] text-slate-500">Instant RFC 5545 .ics delivery to Outlook & Google Calendar</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/85 border border-blue-100 p-3 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">6 Corporate Master Rooms</p>
              <p className="text-[10px] text-slate-500">Lt 10 Mogems, Lt 8 MRA Holding (A, B, C), & MRA Media</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 w-full flex items-center justify-between text-[11px] text-slate-500 border-t border-blue-100/60 pt-4">
        <span>© 2026 MRA Group. IT Shared Services.</span>
        <span>Secured with JWT & RBAC</span>
      </div>
    </div>
  );
}
