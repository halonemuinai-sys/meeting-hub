'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, PanelLeftClose, PanelLeftOpen, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  title: string;
  sidebarHidden: boolean;
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
}

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

        <div className="hidden sm:block">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Workspace</p>
          <p className="text-xs font-semibold text-slate-800">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Sign out</span>
          </button>
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
