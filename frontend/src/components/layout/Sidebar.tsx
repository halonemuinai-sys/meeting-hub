'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  DoorOpen,
  PanelLeftClose,
  ShieldCheck,
  Armchair,
  UserCheck,
  BarChart3,
  LogIn,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { can, Permission, ROLE_LABELS } from '@/lib/permissions';

export type MainTab = 'calendar' | 'rooms' | 'amenities' | 'attendees' | 'reports' | 'users';

export const MENU_ITEMS: {
  id: MainTab;
  label: string;
  icon: React.ElementType;
  group: string;
  permission: Permission;
}[] = [
  { id: 'calendar', label: 'Meeting Calendar', icon: CalendarDays, group: 'Booking', permission: 'calendar.view' },
  { id: 'rooms', label: 'Meeting Rooms', icon: DoorOpen, group: 'Facility', permission: 'facility.manage' },
  { id: 'amenities', label: 'Room Amenities', icon: Armchair, group: 'Facility', permission: 'facility.manage' },
  { id: 'attendees', label: 'Attendees Directory', icon: UserCheck, group: 'Facility', permission: 'facility.manage' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, group: 'Analytics', permission: 'reports.view' },
  { id: 'users', label: 'Users & Access', icon: ShieldCheck, group: 'Administration', permission: 'users.manage' }
];

const MENU_GROUPS = ['Booking', 'Facility', 'Analytics', 'Administration'];

interface SidebarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  hidden: boolean;
  onToggleHidden: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return 'MR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Sidebar({
  activeTab,
  onSelectTab,
  hidden,
  onToggleHidden,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const { user, requestLogout } = useAuth();

  // Close the mobile drawer with Escape and when the viewport grows to desktop size
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    const desktop = window.matchMedia('(min-width: 768px)');
    const onResize = () => {
      if (desktop.matches) onCloseMobile();
    };
    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
    };
  }, [mobileOpen, onCloseMobile]);

  const handleLogout = () => {
    requestLogout();
  };

  const renderSidebar = (mobile = false) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5">
        <button
          type="button"
          onClick={() => {
            onSelectTab('calendar');
            onCloseMobile();
          }}
          className="flex items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
          aria-label="Meeting Hub home"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <img src="/mra_logo.png" alt="" className="max-h-full max-w-full object-contain" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-white">MEETING HUB</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">MRA Group</span>
          </span>
        </button>
        <button
          type="button"
          onClick={mobile ? onCloseMobile : onToggleHidden}
          aria-label={mobile ? 'Close navigation' : 'Hide sidebar'}
          title={mobile ? 'Close navigation' : 'Hide sidebar'}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          {mobile ? <X className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {MENU_GROUPS.map((group) => {
          const items = MENU_ITEMS.filter((item) => item.group === group && can(user, item.permission));
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group}</p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-slate-400 ${
                          isActive
                            ? 'bg-white/[0.07] text-white'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                        }`}
                      >
                        {isActive && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-blue-500" />}
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span className="flex-1 leading-relaxed">{item.label}</span>
                        
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        {user ? (
          <div className="flex items-center gap-3 px-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-semibold text-slate-200">
              {getInitials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-100" title={user.name}>{user.name}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                {ROLE_LABELS[user.role] || user.role}
                {user.department ? ` · ${user.department}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            Sign In to Meeting Hub
            <LogIn className="h-3.5 w-3.5 text-slate-500" />
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop navigation is fully removed from the tab order when hidden. */}
      <aside
        id="desktop-sidebar"
        aria-label="Sidebar"
        className={`${hidden ? 'hidden' : 'hidden md:flex'} w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white`}
      >
        {renderSidebar()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Main navigation">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" aria-hidden="true" onClick={onCloseMobile} />
          <div id="mobile-sidebar" className="relative h-full w-80 max-w-[88vw] bg-slate-900 text-white shadow-2xl">
            {renderSidebar(true)}
          </div>
        </div>
      )}
    </>
  );
}
