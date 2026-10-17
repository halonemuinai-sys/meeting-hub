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
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Columns3,
  Calendar as CalendarIcon,
  List,
  LogIn
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { can } from '@/lib/permissions';
import Sidebar, { MainTab, MENU_ITEMS } from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AmenitiesModule from '@/components/modules/AmenitiesModule';
import AttendeesModule from '@/components/modules/AttendeesModule';
import UsersAccessModule from '@/components/modules/UsersAccessModule';
import RoomsModule from '@/components/modules/RoomsModule';
import ReportsModule from '@/components/modules/ReportsModule';

import RoomTimelineView from '@/components/calendar/RoomTimelineView';
import WeekView from '@/components/calendar/WeekView';
import MonthView from '@/components/calendar/MonthView';
import AgendaView from '@/components/calendar/AgendaView';
import BookingModal from '@/components/modals/BookingModal';
import BookingDetailModal from '@/components/modals/BookingDetailModal';
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>('calendar');
  const activeMenu = MENU_ITEMS.find((m) => m.id === activeTab);
  const canAccessTab = !!activeMenu && can(user, activeMenu.permission);

  // Fall back to the calendar when the current role loses access (e.g. after signing out)
  useEffect(() => {
    if (!canAccessTab) setActiveTab('calendar');
  }, [canAccessTab]);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      setSidebarHidden(localStorage.getItem('mra_meeting_sidebar_hidden') === 'true');
    } catch {
      // Navigation remains available when browser storage is disabled.
    }
  }, []);

  const toggleSidebar = () => {
    const hidden = !sidebarHidden;
    setSidebarHidden(hidden);
    try {
      localStorage.setItem('mra_meeting_sidebar_hidden', String(hidden));
    } catch {
      // Saving the preference is optional.
    }
  };

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const [view, setView] = useState<ViewMode>('timeline');
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));

  const [rooms, setRooms] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [summary, setSummary] = useState<any>({
    today: 0,
    thisWeek: 0,
    ongoing: 0,
    totalRooms: 0
  });
  const [loading, setLoading] = useState(true);

  const [companyId, setCompanyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ room?: any; hour?: number; date?: Date } | null>(null);
  const [activeDetailEvent, setActiveDetailEvent] = useState<MeetingEvent | null>(null);

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
    },
    {
      label: 'This Week',
      hint: 'Scheduled across all rooms',
      value: summary?.thisWeek ?? 0,
      icon: CalendarClock,
      cls: 'text-indigo-600',
    },
    {
      label: 'In Progress Now',
      hint: 'Currently occupied rooms',
      value: summary?.ongoing ?? 0,
      icon: Clock,
      cls: summary?.ongoing > 0 ? 'text-emerald-600' : 'text-slate-500',
    },
    {
      label: 'Active Rooms',
      hint: 'Available for booking',
      value: summary?.totalRooms ?? 0,
      icon: Building2,
      cls: 'text-amber-600',
    }
  ];

  const visibleRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (companyId && r.companyId !== companyId) return false;
      if (roomId && r.id !== roomId) return false;
      return true;
    });
  }, [rooms, companyId, roomId]);

  const handleSlotClick = (room: any, hour: number, date: Date = anchor) => {
    if (!can(user, 'booking.create')) {
      showToast('Please sign in to book a meeting room.', 'error');
      return;
    }
    setSelectedSlot({ room: room || undefined, hour, date });
    setBookingModalOpen(true);
  };

  return (
    <div className="flex h-dvh bg-slate-100 overflow-hidden">
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
        hidden={sidebarHidden}
        onToggleHidden={toggleSidebar}
        mobileOpen={mobileNavOpen}
        onCloseMobile={closeMobileNav}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          title={activeMenu?.label || 'Meeting Hub'}
          sidebarHidden={sidebarHidden}
          mobileOpen={mobileNavOpen}
          onToggleSidebar={toggleSidebar}
          onOpenMobile={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 pb-16">
          <div className="mx-auto max-w-[1600px] space-y-6">
            {activeTab === 'calendar' && (
              <>
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Meeting Room Booking</h1>
                    <p className="mt-1 text-xs text-slate-500">
                      Room availability and reservations across MRA Group entities.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {can(user, 'facility.manage') && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('rooms')}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Wrench className="h-3.5 w-3.5 text-slate-500" />
                        <span>Manage Rooms</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={loadBookings}
                      disabled={loading}
                      title="Refresh"
                      aria-label="Refresh bookings"
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition disabled:opacity-60"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {can(user, 'booking.create') ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlot(null);
                          setBookingModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Book Room</span>
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>Sign in to Book</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Summary Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {metricTiles.map((t) => (
                    <div key={t.label} className="rounded-xl border border-slate-200/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-500">{t.label}</p>
                        <t.icon className={`h-4 w-4 ${t.cls}`} />
                      </div>
                      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-slate-900">
                        {loading && !events.length ? (
                          <span className="inline-block h-7 w-10 animate-pulse rounded-md bg-slate-100" />
                        ) : (
                          t.value
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{t.hint}</p>
                    </div>
                  ))}
                </div>

                {/* Calendar Navigation & Filter Strip */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Date Navigator */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stepDate(-1)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                        title="Previous"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={jumpToday}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={() => stepDate(1)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                        title="Next"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      <h2 className="ml-2 text-base sm:text-lg font-bold text-slate-900">{title}</h2>
                    </div>

                    {/* View Switcher Tabs */}
                    <div className="flex items-center rounded-lg bg-slate-100 p-1 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => setView('timeline')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
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
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
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
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
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
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
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
                    <select
                      value={companyId}
                      onChange={(e) => {
                        setCompanyId(e.target.value);
                        setRoomId('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">All entities</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">All rooms</option>
                      {visibleRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>

                    {/* Category Filter */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">All categories</option>
                      <option value="Weekly Meeting">Weekly Meeting</option>
                      <option value="Bi-weekly Meeting">Bi-weekly Meeting</option>
                      <option value="Monthly Meeting">Monthly Meeting</option>
                      <option value="Quarterly Meeting">Quarterly Meeting</option>
                      <option value="Interview">Interview</option>
                      <option value="Townhall / All-Hands">Townhall / All-Hands</option>
                      <option value="Client / Vendor Meeting">Client / Vendor Meeting</option>
                      <option value="Ad-hoc / Urgent Meeting">Ad-hoc / Urgent Meeting</option>
                      <option value="General Meeting">General Meeting</option>
                    </select>

                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search title or organizer"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                        Clear filters
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
                    onSlotClick={(date, hour) => handleSlotClick(null, hour, date)}
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

            {canAccessTab && activeTab === 'rooms' && <RoomsModule onRoomsChanged={loadMasterData} />}
            {canAccessTab && activeTab === 'reports' && <ReportsModule />}
            {canAccessTab && activeTab === 'users' && <UsersAccessModule />}
            {canAccessTab && activeTab === 'amenities' && <AmenitiesModule />}
            {canAccessTab && activeTab === 'attendees' && <AttendeesModule />}
          </div>
        </main>
      </div>

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
      </AnimatePresence>
    </div>
  );
}
