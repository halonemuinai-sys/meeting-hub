'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  CalendarClock,
  Clock,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Columns3,
  Calendar as CalendarIcon,
  List,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Sidebar, { MainTab } from '@/components/layout/Sidebar';
import AmenitiesModule from '@/components/modules/AmenitiesModule';
import AttendeesModule from '@/components/modules/AttendeesModule';
import UsersAccessModule from '@/components/modules/UsersAccessModule';

import RoomTimelineView from '@/components/calendar/RoomTimelineView';
import WeekView from '@/components/calendar/WeekView';
import MonthView from '@/components/calendar/MonthView';
import AgendaView from '@/components/calendar/AgendaView';
import BookingModal from '@/components/modals/BookingModal';
import BookingDetailModal from '@/components/modals/BookingDetailModal';
import GaRoomManageModal from '@/components/modals/GaRoomManageModal';
import {
  MeetingEvent,
  addDays,
  fmtDay,
  sameDay,
  startOfWeek,
  startOfDay
} from '@/components/calendar/calendarFormat';

type ViewMode = 'timeline' | 'week' | 'month' | 'agenda';

export default function MeetingRoomBookingPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>('calendar');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [view, setView] = useState<ViewMode>('timeline');
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));

  const [rooms, setRooms] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [summary, setSummary] = useState<any>({
    today: 0,
    thisWeek: 0,
    ongoing: 0,
    totalRooms: 6
  });
  const [loading, setLoading] = useState(true);

  const [companyId, setCompanyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ room?: any; hour?: number; date?: Date } | null>(null);
  const [activeDetailEvent, setActiveDetailEvent] = useState<MeetingEvent | null>(null);
  const [gaModalOpen, setGaModalOpen] = useState(false);

  const [toast, setToast] = useState<{ id: number; tone: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), tone, message });
    setTimeout(() => setToast(null), 4000);
  };

  const range = useMemo(() => {
    if (view === 'timeline') {
      const from = startOfDay(anchor);
      return { from, to: addDays(from, 1) };
    }
    if (view === 'week') {
      const from = startOfWeek(anchor);
      return { from, to: addDays(from, 7) };
    }
    if (view === 'month') {
      const from = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
      return { from, to: addDays(from, 35) };
    }
    const from = startOfDay(anchor);
    return { from, to: addDays(from, 30) };
  }, [view, anchor]);

  const loadMasterData = useCallback(async () => {
    try {
      const [compRes, roomsRes, sumRes] = await Promise.all([
        api.getCompanies(),
        api.getRooms(),
        api.getAnalyticsSummary()
      ]);
      setCompanies(compRes.data || []);
      setRooms(roomsRes.data || []);
      if (sumRes.data?.summary) {
        setSummary(sumRes.data.summary);
      }
    } catch (err: any) {
      console.error('Failed to load master data:', err);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        from: range.from.toISOString(),
        to: range.to.toISOString()
      };
      if (companyId) params.companyId = companyId;
      if (roomId) params.roomId = roomId;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;

      const res = await api.getBookings(params);
      setEvents(res.data?.events || []);

      const sumRes = await api.getAnalyticsSummary();
      if (sumRes.data?.summary) {
        setSummary(sumRes.data.summary);
      }
    } catch (err: any) {
      showToast('Failed to load bookings: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [range, companyId, roomId, categoryFilter, search]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      loadBookings();
    }
  }, [loadBookings, activeTab]);

  const stepDate = (dir: 1 | -1) => {
    if (view === 'timeline') setAnchor((a) => addDays(a, 1 * dir));
    else if (view === 'week') setAnchor((a) => addDays(a, 7 * dir));
    else if (view === 'month') setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + dir, 1));
    else setAnchor((a) => addDays(a, 30 * dir));
  };

  const jumpToday = () => {
    setAnchor(startOfDay(new Date()));
  };

  const title = useMemo(() => {
    if (view === 'timeline') {
      return fmtDay(anchor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      return `${fmtDay(range.from, { day: 'numeric', month: 'short' })} – ${fmtDay(addDays(range.to, -1), { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (view === 'month') {
      return anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    return 'Upcoming Agenda (30 Days)';
  }, [view, anchor, range]);

  const metricTiles = [
    {
      label: 'Meetings Today',
      hint: 'Confirmed reservations today',
      value: summary?.today ?? 0,
      icon: CalendarDays,
      cls: 'text-blue-600',
      surface: 'bg-blue-50 ring-blue-100',
      accent: 'bg-blue-600'
    },
    {
      label: 'This Week',
      hint: 'Scheduled across all rooms',
      value: summary?.thisWeek ?? 0,
      icon: CalendarClock,
      cls: 'text-indigo-600',
      surface: 'bg-indigo-50 ring-indigo-100',
      accent: 'bg-indigo-600'
    },
    {
      label: 'In Progress Now',
      hint: 'Currently occupied rooms',
      value: summary?.ongoing ?? 0,
      icon: Clock,
      cls: summary?.ongoing > 0 ? 'text-emerald-600' : 'text-slate-500',
      surface: summary?.ongoing > 0 ? 'bg-emerald-50 ring-emerald-100' : 'bg-slate-50 ring-slate-100',
      accent: summary?.ongoing > 0 ? 'bg-emerald-500' : 'bg-slate-400'
    },
    {
      label: 'Active Rooms',
      hint: 'Mogems, Holding & MRA Media',
      value: summary?.totalRooms ?? 6,
      icon: Building2,
      cls: 'text-amber-600',
      surface: 'bg-amber-50 ring-amber-100',
      accent: 'bg-amber-500'
    }
  ];

  const visibleRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (companyId && r.companyId !== companyId) return false;
      if (roomId && r.id !== roomId) return false;
      return true;
    });
  }, [rooms, companyId, roomId]);

  const handleSlotClick = (room: any, hour: number) => {
    setSelectedSlot({ room, hour, date: anchor });
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      <AnimatePresence>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg border text-xs font-semibold ${
                toast.tone === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-red-600 text-white border-red-500'
              }`}
            >
              {toast.tone === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 pb-16 ${
          sidebarCollapsed ? 'pl-24' : 'pl-72'
        }`}
      >
        <div className="mx-auto max-w-[1600px] space-y-6">
          {activeTab === 'calendar' && (
            <>
              {/* Header Banner */}
              <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/70 p-6 sm:p-8 shadow-xs">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border-[36px] border-blue-100/50"
                />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                        MRA Corporate General Affairs & IT SS
                      </p>
                      <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Meeting Room Booking
                      </h1>
                      <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Centralized room reservation portal across MRA Group entities (PT Mogems Putri International, PT Mugi Rekso Abadi, MRA Media) with smart collision detection and .ics calendar sync.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setGaModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                    >
                      <Wrench className="h-4 w-4 text-amber-500" />
                      <span>Room Setup (GA)</span>
                    </button>

                    <button
                      type="button"
                      onClick={loadBookings}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSlot(null);
                        setBookingModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                      <span>Book Room</span>
                    </button>

                    {/* Auth Status & Login Button */}
                    {user ? (
                      <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-xs shadow-xs">
                          {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="hidden sm:block text-left text-xs">
                          <p className="font-bold text-slate-900 leading-none truncate max-w-[120px]">{user.name}</p>
                          <span className="text-[10px] text-blue-600 font-semibold">{user.role}</span>
                        </div>
                        <button
                          type="button"
                          onClick={logout}
                          title="Sign Out"
                          className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>Sign In</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Metric KPI Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {metricTiles.map((t) => (
                  <div
                    key={t.label}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs"
                  >
                    <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full ${t.accent}`} />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-500">{t.label}</p>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${t.surface}`}>
                        <t.icon className={`h-4 w-4 ${t.cls}`} />
                      </div>
                    </div>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900">
                      {loading && !events.length ? (
                        <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-slate-100" />
                      ) : (
                        t.value
                      )}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{t.hint}</p>
                  </div>
                ))}
              </div>

              {/* Calendar Navigation & Filter Strip */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Date Navigator */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stepDate(-1)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                      title="Previous"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={jumpToday}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() => stepDate(1)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                      title="Next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <h2 className="ml-2 text-base sm:text-lg font-bold text-slate-900">{title}</h2>
                  </div>

                  {/* View Switcher Tabs */}
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setView('timeline')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        view === 'timeline'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Columns3 className="h-3.5 w-3.5" />
                      <span>Room Timeline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setView('week')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        view === 'week'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>Week</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setView('month')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        view === 'month'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>Month</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setView('agenda')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        view === 'agenda'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                      <span>Agenda</span>
                    </button>
                  </div>
                </div>

                {/* Secondary Filters Strip */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Filter:</span>
                  </div>

                  <select
                    value={companyId}
                    onChange={(e) => {
                      setCompanyId(e.target.value);
                      setRoomId('');
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All MRA Entities</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Rooms</option>
                    {visibleRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.floor ? `• ${r.floor}` : ''} ({r.capacityMin}-{r.capacityMax} seats)
                      </option>
                    ))}
                  </select>

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Categories</option>
                    <option value="Weekly Meeting">Weekly Meeting</option>
                    <option value="Bi-weekly Meeting">Bi-weekly Meeting</option>
                    <option value="Monthly Meeting">Monthly Meeting</option>
                    <option value="Quarterly Meeting">Quarterly Meeting</option>
                    <option value="Interview">Interview</option>
                    <option value="Townhall / All-Hands">Townhall / All-Hands</option>
                    <option value="Client / Vendor Meeting">Client / Vendor Meeting</option>
                    <option value="Ad-hoc / Urgent Meeting">Ad-hoc / Urgent Meeting</option>
                  </select>

                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search meeting title or host name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {(companyId || roomId || categoryFilter || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyId('');
                        setRoomId('');
                        setCategoryFilter('');
                        setSearch('');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline px-2 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Calendar Views */}
              {view === 'timeline' && (
                <RoomTimelineView
                  date={anchor}
                  rooms={visibleRooms}
                  events={events}
                  onOpenBooking={(e) => setActiveDetailEvent(e)}
                  onSlotClick={(room, hour) => handleSlotClick(room, hour)}
                />
              )}

              {view === 'week' && (
                <WeekView
                  weekStart={range.from}
                  events={events}
                  onOpenBooking={(e) => setActiveDetailEvent(e)}
                  onSlotClick={(date, hour) => {
                    setSelectedSlot({ date, hour });
                    setBookingModalOpen(true);
                  }}
                />
              )}

              {view === 'month' && (
                <MonthView
                  anchor={anchor}
                  events={events}
                  onOpenBooking={(e) => setActiveDetailEvent(e)}
                  onSelectDay={(d) => {
                    setAnchor(d);
                    setView('timeline');
                  }}
                />
              )}

              {view === 'agenda' && (
                <AgendaView
                  events={events}
                  onOpenBooking={(e) => setActiveDetailEvent(e)}
                />
              )}
            </>
          )}

          {activeTab === 'users' && <UsersAccessModule />}
          {activeTab === 'amenities' && <AmenitiesModule />}
          {activeTab === 'attendees' && <AttendeesModule />}
        </div>
      </main>

      <AnimatePresence>
        {bookingModalOpen && (
          <BookingModal
            rooms={rooms}
            defaultRoomId={selectedSlot?.room?.id || roomId}
            defaultDate={selectedSlot?.date || anchor}
            defaultHour={selectedSlot?.hour}
            onClose={() => setBookingModalOpen(false)}
            onSuccess={(msg) => {
              setBookingModalOpen(false);
              showToast(msg);
              loadBookings();
            }}
          />
        )}

        {activeDetailEvent && (
          <BookingDetailModal
            event={activeDetailEvent}
            onClose={() => setActiveDetailEvent(null)}
            onCancelled={(msg) => {
              setActiveDetailEvent(null);
              showToast(msg);
              loadBookings();
            }}
          />
        )}

        {gaModalOpen && (
          <GaRoomManageModal
            rooms={rooms}
            onClose={() => setGaModalOpen(false)}
            onUpdated={(msg) => {
              setGaModalOpen(false);
              showToast(msg);
              loadMasterData();
              loadBookings();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
