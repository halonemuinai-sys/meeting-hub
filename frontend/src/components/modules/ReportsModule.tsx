'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  Filter,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Building2,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, Notice, useNotice } from '@/components/ui/admin';
import { getCategoryBadge } from '@/components/calendar/calendarFormat';

interface KPI {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalHours: number;
  avgDurationMins: number;
  avgAttendees: number;
}

interface RoomStat {
  roomId: string;
  roomName: string;
  companyName: string;
  floor: string;
  colorCode: string;
  capacityMax: number;
  bookingCount: number;
  totalMinutes: number;
  totalHours: number;
  avgAttendees: number;
}

interface CategoryStat {
  category: string;
  count: number;
  totalMinutes: number;
  totalHours: number;
  percentage: number;
}

interface DeptStat {
  department: string;
  count: number;
  totalHours: number;
}

interface PeakHour {
  hour: string;
  bookings: number;
}

interface BookingRecord {
  id: string;
  title: string;
  roomName: string;
  roomFloor: string;
  companyName: string;
  organizerName: string;
  organizerEmail: string;
  department: string;
  category: string;
  isConfidential: boolean;
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  attendeesCount: number;
  cancelReason?: string | null;
  createdAt: string;
}

export default function ReportsModule() {
  const [loading, setLoading] = useState(true);
  const { notice, show } = useNotice();

  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState<'this_month' | 'this_week' | 'last_month' | 'all'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomId, setRoomId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [searchTable, setSearchTable] = useState('');

  // Master Data options
  const [rooms, setRooms] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Analytics Response Data
  const [kpi, setKpi] = useState<KPI>({
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalHours: 0,
    avgDurationMins: 0,
    avgAttendees: 0
  });
  const [roomStats, setRoomStats] = useState<RoomStat[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [detailedList, setDetailedList] = useState<BookingRecord[]>([]);

  // Quick Preset Calculator
  const applyPreset = (preset: 'this_month' | 'this_week' | 'last_month' | 'all') => {
    setDateRangePreset(preset);
    const now = new Date();
    if (preset === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(last.toISOString().split('T')[0]);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(sunday.toISOString().split('T')[0]);
    } else if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(last.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Initial load presets & master data
  useEffect(() => {
    applyPreset('this_month');
    Promise.all([api.getRooms(), api.getCompanies()])
      .then(([r, c]) => {
        setRooms(r.data || []);
        setCompanies(c.data || []);
      })
      .catch((err) => console.error('Error fetching filter options:', err));
  }, []);

  // Fetch Report Data
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (roomId) params.roomId = roomId;
      if (companyId) params.companyId = companyId;
      if (category) params.category = category;
      if (status) params.status = status;

      const res = await api.getReports(params);
      if (res.success && res.data) {
        setKpi(res.data.kpi);
        setRoomStats(res.data.roomUtilization || []);
        setCategoryStats(res.data.categoryBreakdown || []);
        setDeptStats(res.data.departmentBreakdown || []);
        setPeakHours(res.data.peakHours || []);
        setDetailedList(res.data.detailedList || []);
      }
    } catch (err: any) {
      show(err.message || 'Failed to load report analytics.', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, roomId, companyId, category, status, show]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Filtered detailed table rows
  const filteredRecords = useMemo(() => {
    if (!searchTable.trim()) return detailedList;
    const q = searchTable.toLowerCase().trim();
    return detailedList.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.roomName.toLowerCase().includes(q) ||
        b.organizerName.toLowerCase().includes(q) ||
        b.department.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }, [detailedList, searchTable]);

  // Export to CSV Function
  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      show('No data available to export.', 'error');
      return;
    }

    const headers = [
      'Meeting Title',
      'Room',
      'Floor',
      'Entity',
      'Organizer',
      'Email',
      'Department',
      'Category',
      'Status',
      'Start Time (WIB)',
      'End Time (WIB)',
      'Duration (Mins)',
      'Attendees Count',
      'Confidential'
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.roomName}"`,
      `"${r.roomFloor}"`,
      `"${r.companyName}"`,
      `"${r.organizerName}"`,
      `"${r.organizerEmail}"`,
      `"${r.department}"`,
      `"${r.category}"`,
      `"${r.status}"`,
      `"${new Date(r.startTime).toLocaleString('en-GB')}"`,
      `"${new Date(r.endTime).toLocaleString('en-GB')}"`,
      r.durationMinutes,
      r.attendeesCount,
      r.isConfidential ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MRA_Meeting_Room_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    show('Report exported successfully to CSV!', 'success');
  };

  // Max peak hour count for scale
  const maxPeakCount = useMemo(() => {
    return Math.max(1, ...peakHours.map((p) => p.bookings));
  }, [peakHours]);

  return (
    <div className="space-y-6">
      <Notice notice={notice} />

      {/* Top Header & Export Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <BarChart3 className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Reports & Room Analytics</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Comprehensive executive metrics, room utilization, and corporate meeting trends across MRA Group.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to CSV / Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3 lg:border-b-0 lg:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-blue-600" /> Period:
            </span>
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'this_week', label: 'This Week' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'all', label: 'All Time' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id as any)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  dateRangePreset === p.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Granular Filters */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRangePreset('all');
                }}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                title="Start Date"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRangePreset('all');
                }}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                title="End Date"
              />
            </div>

            {/* Room Filter */}
            <div>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.floor})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (6 Key Executive Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Meetings</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{kpi.totalBookings}</p>
          <p className="mt-1 text-[10px] text-slate-400">All registered slots</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Confirmed</p>
          <p className="mt-1.5 text-2xl font-extrabold text-emerald-800">{kpi.confirmedBookings}</p>
          <p className="mt-1 text-[10px] text-emerald-600">Active or completed</p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Cancelled</p>
          <p className="mt-1.5 text-2xl font-extrabold text-red-800">{kpi.cancelledBookings}</p>
          <p className="mt-1 text-[10px] text-red-600">Released early/cancelled</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Total Hours</p>
          <p className="mt-1.5 text-2xl font-extrabold text-blue-800">{kpi.totalHours} <span className="text-xs font-semibold">hrs</span></p>
          <p className="mt-1 text-[10px] text-blue-600">Room runtime</p>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Avg Duration</p>
          <p className="mt-1.5 text-2xl font-extrabold text-indigo-800">{kpi.avgDurationMins} <span className="text-xs font-semibold">min</span></p>
          <p className="mt-1 text-[10px] text-indigo-600">Per session</p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Avg Pax</p>
          <p className="mt-1.5 text-2xl font-extrabold text-purple-800">{kpi.avgAttendees} <span className="text-xs font-semibold">pax</span></p>
          <p className="mt-1 text-[10px] text-purple-600">Attendees / meeting</p>
        </div>
      </div>

      {/* Visual Analytics Grid: Room Utilization & Peak Hours */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room Utilization Ranking */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" /> Room Utilization Ranking
            </h2>
            <span className="text-[11px] font-medium text-slate-400">By hours reserved</span>
          </div>

          <div className="mt-4 space-y-4">
            {roomStats.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No meeting data for this period.</p>
            ) : (
              roomStats.map((r, i) => {
                const maxHours = Math.max(1, ...roomStats.map((s) => s.totalHours));
                const pct = Math.min(100, Math.round((r.totalHours / maxHours) * 100));

                return (
                  <div key={r.roomId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                          {i + 1}
                        </span>
                        <span className="font-bold text-slate-800">{r.roomName}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                          {r.floor}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900">{r.totalHours} hrs</span>
                        <span className="text-slate-400 text-[11px] ml-1">({r.bookingCount} bookings)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: r.colorCode || '#2563eb'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Peak Hours Heatmap / Hourly Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" /> Peak Meeting Hours (08:00 – 19:00 WIB)
            </h2>
            <span className="text-[11px] font-medium text-slate-400">Traffic volume</span>
          </div>

          <div className="mt-6 flex h-48 items-end gap-2 pt-4">
            {peakHours.map((p) => {
              const heightPct = p.bookings > 0 ? Math.max(12, Math.round((p.bookings / maxPeakCount) * 100)) : 4;
              return (
                <div key={p.hour} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  <span className="mb-1 text-[10px] font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition">
                    {p.bookings}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-blue-500/80 group-hover:bg-blue-600 transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="mt-2 text-[9px] font-medium text-slate-500">{p.hour.split(':')[0]}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">Hour of Day (WIB)</p>
        </div>
      </div>

      {/* Breakdown Cards: Meeting Categories & Active Departments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="h-4 w-4 text-purple-600" /> Distribution by Category
          </h2>

          <div className="mt-4 space-y-2.5">
            {categoryStats.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No category statistics available.</p>
            ) : (
              categoryStats.map((c) => {
                const badge = getCategoryBadge(c.category);
                return (
                  <div key={c.category} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                        {c.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="font-semibold text-slate-700">{c.totalHours} hrs</span>
                      <span className="font-extrabold text-slate-900 w-16 text-right">{c.count} mtgs ({c.percentage}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Department Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-4 w-4 text-emerald-600" /> Active Departments
          </h2>

          <div className="mt-4 space-y-2.5">
            {deptStats.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No department data recorded.</p>
            ) : (
              deptStats.map((d) => (
                <div key={d.department} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-xs">
                  <span className="font-semibold text-slate-800">{d.department}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{d.totalHours} hrs</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                      {d.count} meetings
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Bookings Record Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Detailed Booking Log</h2>
            <p className="text-[11px] text-slate-500">Showing {filteredRecords.length} records matching current criteria</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, organizer, dept..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 font-semibold text-slate-600 text-[11px]">
                <th className="py-2.5 px-3">Meeting Title & Room</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Organizer</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Schedule (WIB)</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Pax</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No booking records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((b) => {
                  const badge = getCategoryBadge(b.category);
                  const isCancelled = b.status === 'CANCELLED';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900 line-clamp-1">{b.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {b.roomName} · <span className="font-medium text-slate-700">{b.roomFloor}</span>
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-medium text-slate-600">{b.companyName}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-slate-900">{b.organizerName}</p>
                        <p className="text-[10px] text-slate-400">{b.department}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold ${badge.bg} ${badge.text}`}>
                          {b.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] tabular-nums">
                        <p className="font-semibold text-slate-900">
                          {new Date(b.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-slate-500 text-[10px]">
                          {new Date(b.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(b.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-semibold text-slate-700">
                        {b.durationMinutes} min
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-700">{b.attendeesCount}</td>
                      <td className="py-2.5 px-3">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            <XCircle className="h-3 w-3" /> Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Confirmed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
