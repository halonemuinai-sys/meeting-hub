'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { getCompanyBadge } from '../calendar/calendarFormat';

export default function AttendeesModule() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    companyId: '',
    department: '',
    jobTitle: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, compRes] = await Promise.all([
        api.getAttendees(),
        api.getCompanies()
      ]);
      setAttendees(attRes.data || []);
      setCompanies(compRes.data || []);
      if (compRes.data?.length > 0 && !form.companyId) {
        setForm((prev) => ({ ...prev, companyId: compRes.data[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load attendees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      fullName: '',
      email: '',
      companyId: companies[0]?.id || '',
      department: '',
      jobTitle: '',
      phone: ''
    });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setForm({
      fullName: item.fullName,
      email: item.email,
      companyId: item.companyId,
      department: item.department,
      jobTitle: item.jobTitle || '',
      phone: item.phone || ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingItem) {
        await api.updateAttendee(editingItem.id, form);
      } else {
        await api.createAttendee(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save attendee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete attendee "${name}" from directory?`)) return;
    try {
      await api.deleteAttendee(id);
      loadData();
    } catch (err: any) {
      alert('Failed to delete attendee: ' + err.message);
    }
  };

  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      if (companyId && a.companyId !== companyId) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          (a.jobTitle && a.jobTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [attendees, companyId, search]);

  const stats = useMemo(() => {
    return {
      total: attendees.length,
      mogems: attendees.filter((a) => a.company?.code === 'MOGEMS').length,
      holding: attendees.filter((a) => a.company?.code === 'MRA_HOLDING').length,
      media: attendees.filter((a) => a.company?.code === 'MRA_MEDIA').length
    };
  }, [attendees]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/70 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                EMPLOYEE DIRECTORY · MASTER ATTENDEES
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                Attendees Directory
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Centralized directory of MRA Group employees, seamlessly integrated with booking auto-complete and .ics invites.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add New Attendee</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Registered</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Across all business units</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">PT Mugi Rekso Abadi</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-blue-600">{stats.holding}</p>
          <span className="text-[11px] text-slate-400">Holding Staff & Executives</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Mogems Putri Int.</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.mogems}</p>
          <span className="text-[11px] text-slate-400">Boutique & Retail Staff</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">MRA Media</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-rose-600">{stats.media}</p>
          <span className="text-[11px] text-slate-400">Creative & Broadcasting</span>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Companies / Entities</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search attendee by name, email, or dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Attendee Name</th>
                <th className="px-4 py-3.5">Corporate Email</th>
                <th className="px-4 py-3.5">Entity</th>
                <th className="px-4 py-3.5">Department & Title</th>
                <th className="px-4 py-3.5">Phone / WhatsApp</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No attendees found with matching filters.
                  </td>
                </tr>
              ) : (
                filteredAttendees.map((a) => {
                  const badge = getCompanyBadge(a.company?.code);
                  const initials = a.fullName
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={a.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                            {initials}
                          </div>
                          <span>{a.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {a.email}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                          {a.company?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{a.department}</p>
                        <p className="text-[10px] text-slate-400">{a.jobTitle || '-'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {a.phone || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(a)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="Edit Attendee"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id, a.fullName)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete Attendee"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Modal Add / Edit Peserta */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Attendee' : 'Add New Attendee'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Iskandar"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corporate Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="jessica@mogems.co.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Entity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Merchandising"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="Senior Specialist"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+62 811..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save Attendee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
