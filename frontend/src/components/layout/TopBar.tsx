'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, PanelLeftClose, PanelLeftOpen, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/permissions';

interface TopBarProps {
  title: string;
  sidebarHidden: boolean;
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function TopBar({
  title,
  sidebarHidden,
  mobileOpen,
  onToggleSidebar,
  onOpenMobile
}: TopBarProps) {
  const { user, requestLogout } = useAuth();

  const handleLogout = () => {
    requestLogout();
  };

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Slide Menu Toggle Buttons & User Name / Workspace */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          title={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          aria-expanded={!sidebarHidden}
          aria-controls="desktop-sidebar"
          className="hidden rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500 md:inline-flex"
        >
          {sidebarHidden ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* User Identity at the right side of the slide menu toggle */}
        {user ? (
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white shadow-xs">
              {getInitials(user.name)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-xs" title={user.name}>
                  {user.name}
                </span>
                <span className="hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate hidden md:block">
                {title} {user.department ? `· ${user.department}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden sm:block">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Workspace</p>
            <p className="text-xs font-semibold text-slate-800">{title}</p>
          </div>
        )}
      </div>

      {/* Right section: Profile indicator & Sign Out button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <>
            <div className="hidden lg:flex items-center gap-2 py-1 px-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600 truncate max-w-[160px]">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
