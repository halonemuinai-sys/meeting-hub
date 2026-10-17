'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Calendar
} from 'lucide-react';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import { api } from '@/lib/api';

const QUICK_ACCOUNTS = [
  { role: 'Super Admin', name: 'Aris Setiyono', email: 'admin@mra.co.id' },
  { role: 'GA Holding', name: 'Bambang Sudibyo', email: 'ga.holding@mra.co.id' },
  { role: 'Employee', name: 'Dina Lestari', email: 'user@mra.co.id' }
];

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Steps: 1 = Request Code, 2 = Verify & Set Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form States
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');

  // UI feedback states
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Check URL query parameters on mount (direct link from email)
  useEffect(() => {
    const qEmail = searchParams.get('email');
    const qCode = searchParams.get('code');
    const qToken = searchParams.get('token');

    if (qEmail) {
      setEmail(qEmail);
    }
    if (qCode) {
      setCode(qCode);
      setStep(2);
    }
    if (qToken) {
      setToken(qToken);
      setStep(2);
    }
  }, [searchParams]);

  // Step 1: Request Password Reset Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setApiError(null);
    setSuccessNotice(null);

    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setSuccessNotice(res.message);
        if (res.devOtp) {
          setDevOtp(res.devOtp);
        }
        if (res.resetToken) {
          setToken(res.resetToken);
        }
        setStep(2);
      } else {
        setApiError(res.message || 'Failed to send reset code.');
      }
    } catch (err: any) {
      setApiError(err.message || 'An error occurred while requesting reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit Code & New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!code.trim() && !token) {
      setApiError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setApiError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setApiError('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
        token: token || undefined
      });

      if (res.success) {
        setStep(3);
        // Start auto-redirect countdown
        let count = 5;
        const timer = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            router.push(`/login?email=${encodeURIComponent(email)}&reset=success`);
          }
        }, 1000);
      } else {
        setApiError(res.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to update password. Please check your verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setSuccessNotice('New verification code sent to your email.');
        if (res.devOtp) {
          setDevOtp(res.devOtp);
          setCode(res.devOtp);
        }
        if (res.resetToken) {
          setToken(res.resetToken);
        }
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    'w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ' +
    'focus:border-blue-500 transition-all font-medium';

  return (
    <div className="min-h-screen w-full flex bg-white font-sans h-screen overflow-hidden">
      {/* Decorative Left Graphic Panel (Consistent MRA Theme) */}
      <AuthSidePanel />

      {/* Right Content Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white overflow-y-auto h-full">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
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
              href="/login"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs flex-shrink-0 text-blue-600">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {step === 1 && 'Reset Your Password'}
                  {step === 2 && 'Verify & Set Password'}
                  {step === 3 && 'Password Reset Complete'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {step === 1 && 'Enter your work email address to receive a 6-digit recovery code.'}
                  {step === 2 && `Enter the verification code sent to ${email} and choose a new password.`}
                  {step === 3 && 'Your credentials have been securely updated.'}
                </p>
              </div>
            </div>

            {/* Error Message */}
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

            {/* Success Notice Banner */}
            {successNotice && step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                <span>{successNotice}</span>
              </motion.div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleRequestCode} className="space-y-4">
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
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* Quick Autofill for Registered Users */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 mt-6">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-xs font-bold text-slate-800">Quick Test Accounts</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUICK_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => setEmail(acc.email)}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-400 transition cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-800">{acc.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{acc.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: Verify Code & Set New Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Dev OTP Helper Banner for Smooth Testing */}
                {devOtp && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold flex items-center gap-1 text-amber-800">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        Testing Mode Code Available
                      </p>
                      <p className="mt-0.5 text-[11px] text-amber-700">
                        Verification OTP: <strong className="font-mono text-sm tracking-widest text-amber-900">{devOtp}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCode(devOtp)}
                      className="rounded-lg bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-900 transition"
                    >
                      Autofill Code
                    </button>
                  </div>
                )}

                {/* Verification Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">6-Digit OTP Code</label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      Resend Code
                    </button>
                  </div>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 482910"
                      required
                      className={`${inputCls} tracking-widest font-mono text-base`}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
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

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      className={inputCls}
                      disabled={isLoading}
                    />
                  </div>
                </div>

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
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    ← Back to enter different email
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {step === 3 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Password Updated Successfully!</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Your password has been changed. You will be automatically redirected to the login page in{' '}
                    <strong className="text-emerald-700">{countdown}s</strong>.
                  </p>
                </div>
                <Link
                  href={`/login?email=${encodeURIComponent(email)}&reset=success`}
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Bottom Back to Sign In Link */}
            {step !== 3 && (
              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
