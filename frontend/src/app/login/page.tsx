'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Calendar,
  UserCheck
} from 'lucide-react';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import { useAuth } from '@/context/AuthContext';

const QUICK_ACCOUNTS = [
  {
    role: 'Super Admin',
    name: 'Aris Setiyono',
    email: 'admin@mra.co.id',
    badge: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  {
    role: 'GA Holding',
    name: 'Bambang Sudibyo',
    email: 'ga.holding@mra.co.id',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  {
    role: 'GA Mogems',
    name: 'Staff GA Mogems',
    email: 'ga.mogems@mogems.co.id',
    badge: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  {
    role: 'Employee User',
    name: 'Dina Lestari',
    email: 'user@mra.co.id',
    badge: 'bg-purple-100 text-purple-700 border-purple-200'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    const res = await login(email, password);
    if (res.success) {
      router.push('/');
    } else {
      setApiError(res.message || 'Login failed. Please check your email and password.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Admin@123');
    setApiError(null);
  };

  const inputCls =
    'w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ' +
    'focus:border-blue-500 transition-all font-medium';

  return (
    <div className="min-h-screen w-full flex bg-white font-sans h-screen overflow-hidden">
      {/* Decorative Left Graphic Panel (HR HUB / GLC Pattern) */}
      <AuthSidePanel />

      {/* Right Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white overflow-y-auto h-full">
        <div className="w-full max-w-md">
          {/* Mobile Top Header (Visible on smaller screens) */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-xs p-1.5">
                <img src="/mra_logo.png" alt="MRA Group" className="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">MRA Meeting Room</span>
                <span className="text-[10px] text-slate-500">Corporate Booking Portal</span>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Title & Subtitle */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs flex-shrink-0 p-2">
                <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Sign in to MRA Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Access room reservations, amenities management, and corporate directory.
                </p>
              </div>
            </div>

            {/* Error Message Alert */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{apiError}</span>
              </motion.div>
            )}

            {/* Credentials Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Work Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aris@mra.co.id"
                    required
                    className={inputCls}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <span className="text-[10px] text-slate-400">Default demo: Admin@123</span>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={inputCls}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/25 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Meeting Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Quick One-Click Demo Role Switcher */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-xs font-bold text-slate-800">Quick Demo Accounts (Click to Fill)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email)}
                    className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-2.5 hover:border-blue-400 hover:shadow-xs transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${acc.badge}`}>
                        {acc.role}
                      </span>
                      <UserCheck className="h-3 w-3 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 mt-1 truncate">{acc.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Back to Public Calendar Link */}
            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition inline-flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Return to Public Room Calendar</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
