'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type MainTab = 'calendar' | 'users' | 'amenities' | 'attendees';

interface SidebarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse
}: SidebarProps) {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'MR';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'GA_ADMIN') return 'GA Admin';
    if (role === 'USER') return 'Employee User';
    return 'Guest';
  };

  const menuItems = [
    {
      id: 'calendar' as MainTab,
      label: 'Meeting Calendar',
      sublabel: 'Booking & Timeline',
      icon: CalendarDays,
      badge: null
    },
    {
      id: 'users' as MainTab,
      label: 'Users & Access',
      sublabel: 'Roles & Permissions',
      icon: ShieldCheck,
      badge: 'RBAC'
    },
    {
      id: 'amenities' as MainTab,
      label: 'Room Amenities',
      sublabel: 'Equipment & Facilities',
      icon: Sparkles,
      badge: null
    },
    {
      id: 'attendees' as MainTab,
      label: 'Attendees Directory',
      sublabel: 'Employee Directory',
      icon: UserCheck,
      badge: null
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-slate-200/90 bg-white shadow-xs flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="flex h-18 items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-600/20">
              <Building2 className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 block">
                  MRA GROUP
                </span>
                <h1 className="text-sm font-extrabold text-slate-900 truncate">
                  Meeting Portal
                </h1>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {!collapsed ? 'Main Menu' : '•••'}
          </div>

          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />

                {!collapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                      <p className="text-xs leading-none truncate">{item.label}</p>
                      <p
                        className={`text-[10px] mt-1 truncate ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.sublabel}
                      </p>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile Badge & Auth Actions */}
      <div className="p-3 border-t border-slate-100">
        {user ? (
          <div
            className={`flex items-center gap-3 rounded-2xl p-2 transition ${
              collapsed ? 'justify-center' : 'bg-slate-50 border border-slate-100'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-xs shadow-xs">
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold text-slate-500 truncate">
                    {getRoleLabel(user.role)} {user.department ? `· ${user.department}` : ''}
                  </span>
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={`flex items-center gap-2.5 rounded-2xl p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 transition border border-blue-200/80 ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign In to MRA Portal"
          >
            <LogIn className="h-4 w-4 shrink-0 text-blue-600" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block leading-none">Sign In</span>
                <span className="text-[10px] text-blue-500 mt-1 block">Access Admin & Booking</span>
              </div>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
