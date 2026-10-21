'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Shield
} from 'lucide-react';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Check URL query parameters for reset success
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('reset') === 'success') {
        setSuccessMsg('Your password has been reset successfully! Please sign in with your new password.');
      }
      if (sp.get('email')) {
        setEmail(sp.get('email') || '');
      }
    }
  }, []);

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

  const inputCls =
    'w-full pl-11 pr-11 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ' +
    'focus:border-blue-500 focus:bg-white hover:border-slate-300 transition-colors duration-200 disabled:opacity-60';

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-dvh w-full flex bg-white font-sans">
      {/* Decorative Left Graphic Panel (HR HUB / GLC Pattern) */}
      <AuthSidePanel />

      {/* Right Login Form Panel */}
      <div className="flex-1 flex min-w-0 flex-col items-center justify-center px-6 py-10 sm:px-12 lg:px-10 xl:px-16">
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

          <div className="space-y-7">
            {/* Title & Subtitle */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs flex-shrink-0 p-2">
                <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
                  Sign in to MRA Portal
                </h2>
                <p className="text-sm leading-relaxed text-slate-500 mt-2">
                  Access room reservations, amenities management, and corporate directory.
                </p>
              </div>
            </div>

            {/* Success Message Alert (e.g. after password reset) */}
            {successMsg && (
              <motion.div role="status"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Error Message Alert */}
            {apiError && (
              <motion.div role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{apiError}</span>
              </motion.div>
            )}

            {/* Credentials Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">Work Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                  <input
                    id="login-email"
                    name="email"
                    autoComplete="username"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setApiError(null);
                      setSuccessMsg(null);
                    }}
                    placeholder="e.g. name@mra.co.id"
                    required
                    className={inputCls}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">Password</label>
                  <Link
                    href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                  <input
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    disabled={isLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={isLoading ? undefined : { y: -1 }}
                whileTap={isLoading ? undefined : { scale: 0.99 }}
                className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait transition-colors duration-200 shadow-sm shadow-blue-500/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 cursor-pointer mt-2"
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

            {/* Corporate Security Footer Note */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                <span>Authorized MRA Group personnel only</span>
              </div>
            </div>

            {/* Back to Public Calendar Link */}
            <div className="text-center pt-1">
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
    </MotionConfig>
  );
}
