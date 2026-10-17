'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  DoorOpen,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
  Users
} from 'lucide-react';
import { api } from '@/lib/api';
import RoomFormModal from '@/components/modals/RoomFormModal';

type StatusFilter = 'active' | 'inactive' | 'all';

interface RoomsModuleProps {
  onRoomsChanged?: () => void;
}

export default function RoomsModule({ onRoomsChanged }: RoomsModuleProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');

  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (message: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ tone, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, compRes] = await Promise.all([
        api.getRooms({ includeInactive: 'true' }),
        api.getCompanies()
      ]);
      setRooms(roomsRes.data || []);
      setCompanies(compRes.data || []);
    } catch (err: any) {
      showNotice(err.message || 'Failed to load rooms.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const afterChange = (message: string) => {
    showNotice(message);
    loadData();
    onRoomsChanged?.();
  };

  const counts = useMemo(
    () => ({
      active: rooms.filter((r) => r.isActive).length,
      inactive: rooms.filter((r) => !r.isActive).length,
      all: rooms.length
    }),
    [rooms]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      if (status === 'active' && !r.isActive) return false;
      if (status === 'inactive' && r.isActive) return false;
      if (companyId && r.companyId !== companyId) return false;
      if (q && !`${r.name} ${r.floor || ''} ${r.company?.name || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rooms, status, companyId, search]);

  const toggleActive = async (room: any) => {
    if (room.isActive) {
      const upcoming = room.activeBookingsCount || 0;
      const warning = upcoming
        ? `\n\n${upcoming} upcoming booking(s) will be hidden from the calendar. Organizers are not notified automatically.`
        : '';
      if (!confirm(`Deactivate ${room.name}? It will no longer appear on the calendar or be bookable.${warning}`)) return;
    }
    setBusyId(room.id);
    try {
      const res = await api.updateRoom(room.id, { isActive: !room.isActive });
      afterChange(res.message);
    } catch (err: any) {
      showNotice(err.message || 'Failed to update room.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteRoom = async (room: any) => {
    if (!confirm(`Permanently delete ${room.name}? This cannot be undone.`)) return;
    setBusyId(room.id);
    try {
      const res = await api.deleteRoom(room.id);
      afterChange(res.message);
    } catch (err: any) {
      showNotice(err.message || 'Failed to delete room.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Meeting Rooms</h1>
          <p className="mt-1 text-xs text-slate-500">
            Add rooms, update capacity and amenities, or take rooms out of service.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingRoom(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${
            notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {notice.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {(['active', 'inactive', 'all'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 capitalize transition ${
                status === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s} <span className="ml-0.5 tabular-nums text-slate-400">{counts[s]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            aria-label="Filter by entity"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All entities</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search rooms"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Room Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Amenities</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !rooms.length ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <DoorOpen className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-600">No rooms found</p>
                    <p className="mt-0.5 text-xs text-slate-400">Try another filter, or add a new room.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const amenities: string[] = r.amenities || [];
                  const busy = busyId === r.id;
                  return (
                    <tr key={r.id} className={`transition-colors hover:bg-slate-50/60 ${!r.isActive ? 'text-slate-400' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.colorCode }} />
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${r.isActive ? 'text-slate-900' : 'text-slate-500'}`}>{r.name}</p>
                            <p className="truncate text-xs text-slate-400">{r.floor || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.company?.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 tabular-nums text-slate-600">
                          <Users className="h-3 w-3 text-slate-400" />
                          {r.capacityMin}–{r.capacityMax}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {amenities.length ? (
                          <span className="text-slate-600" title={amenities.join(', ')}>
                            {amenities.slice(0, 2).join(', ')}
                            {amenities.length > 2 && <span className="text-slate-400"> +{amenities.length - 2}</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!r.isActive ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Inactive</span>
                        ) : r.isMaintenance ? (
                          <span
                            className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                            title={r.maintenanceNote || undefined}
                          >
                            Maintenance
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
                        )}
                        {r.isActive && r.activeBookingsCount > 0 && (
                          <p className="mt-1 text-[11px] text-slate-400">{r.activeBookingsCount} upcoming</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingRoom(r);
                              setFormOpen(true);
                            }}
                            title="Edit room"
                            aria-label={`Edit ${r.name}`}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleActive(r)}
                            title={r.isActive ? 'Deactivate room' : 'Reactivate room'}
                            aria-label={r.isActive ? `Deactivate ${r.name}` : `Reactivate ${r.name}`}
                            className={`rounded-lg p-2 transition disabled:opacity-40 ${
                              r.isActive
                                ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-600'
                                : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                          >
                            {r.isActive ? <Power className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          </button>
                          {r.totalBookingsCount === 0 && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => deleteRoom(r)}
                              title="Delete room (no booking history)"
                              aria-label={`Delete ${r.name}`}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Rooms with booking history can only be deactivated, so past reservations stay on record.
      </p>

      <AnimatePresence>
        {formOpen && (
          <RoomFormModal
            room={editingRoom}
            companies={companies}
            onClose={() => setFormOpen(false)}
            onSaved={(msg) => {
              setFormOpen(false);
              afterChange(msg);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
