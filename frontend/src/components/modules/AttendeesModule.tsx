'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Sparkles,
  Trash2,
  UserPlus,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Avatar,
  FormDialog,
  IconAction,
  Notice,
  PageHeader,
  SearchInput,
  SegmentedFilter,
  TableShell,
  TableState,
  Toolbar,
  inputCls,
  labelCls,
  thCls,
  theadCls,
  useNotice
} from '@/components/ui/admin';

const emptyForm = (companyId = '') => ({
  fullName: '',
  email: '',
  companyId,
  department: '',
  jobTitle: '',
  phone: ''
});

export default function AttendeesModule() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');
  const [search, setSearch] = useState('');
  const { notice, show } = useNotice();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Quick Add by Email state
  const [quickEmailInput, setQuickEmailInput] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, compRes] = await Promise.all([api.getAttendees(), api.getCompanies()]);
      setAttendees(attRes.data || []);
      setCompanies(compRes.data || []);
    } catch (err: any) {
      show(err.message || 'Failed to load attendees.', 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (item: any | null) => {
    setEditingItem(item);
    setForm(
      item
        ? {
            fullName: item.fullName,
            email: item.email,
            companyId: item.companyId,
            department: item.department,
            jobTitle: item.jobTitle || '',
            phone: item.phone || ''
          }
        : emptyForm(companies[0]?.id || '')
    );
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingItem) await api.updateAttendee(editingItem.id, form);
      else await api.createAttendee(form);
      setModalOpen(false);
      show(editingItem ? `${form.fullName} has been updated.` : `${form.fullName} has been added.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save attendee.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickEmailInput.trim();
    if (!raw) return;

    // Support comma, semicolon, space, or newline separated emails
    const rawEmails = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && s.includes('@'));

    if (rawEmails.length === 0) {
      show('Please enter at least one valid work email (e.g. name@mra.co.id)', 'error');
      return;
    }

    setQuickAdding(true);
    try {
      const res = await api.quickAddAttendee({ emails: rawEmails });
      const newCount = res.newlyAdded?.length ?? 0;
      if (newCount > 0) {
        show(
          `Success: ${newCount} new attendee(s) registered. Click "Needs Review" to refine company & department details.`,
          'success'
        );
      } else {
        show('All provided emails are already registered in the directory.', 'success');
      }
      setQuickEmailInput('');
      await loadData();
    } catch (err: any) {
      show(err.message || 'Failed to quick add attendee.', 'error');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Remove ${item.fullName} from the directory?`)) return;
    try {
      await api.deleteAttendee(item.id);
      show(`${item.fullName} has been removed.`);
      loadData();
    } catch (err: any) {
      show(err.message || 'Failed to delete attendee.', 'error');
    }
  };

  const pendingCount = useMemo(
    () => attendees.filter((a) => a.department === 'Pending Admin Review').length,
    [attendees]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendees.filter((a) => {
      if (companyId === '__needs_review__') {
        if (a.department !== 'Pending Admin Review') return false;
      } else if (companyId && a.companyId !== companyId) {
        return false;
      }
      if (q && !`${a.fullName} ${a.email} ${a.department} ${a.jobTitle || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [attendees, companyId, search]);

  const filterOptions = [
    { id: '', label: 'All', count: attendees.length },
    {
      id: '__needs_review__',
      label: pendingCount > 0 ? '⚠️ Needs Review' : 'Needs Review',
      count: pendingCount
    },
    ...companies.map((c) => ({
      id: c.id,
      label: c.name.replace(/^PT\s+/i, ''),
      count: attendees.filter((a) => a.companyId === c.id).length
    }))
  ];

  const isCurrentItemPending = editingItem?.department === 'Pending Admin Review';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendees Directory"
        description="Employees available for invitation suggestions when booking a meeting room."
        actionLabel="Add Attendee"
        onAction={() => openModal(null)}
      />

      <Notice notice={notice} />

      {/* Quick Add Attendee by Email Card */}
      <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">⚡ Quick Add Attendee by Email</h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  Instant Save
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Simply type or paste email(s). Auto-saves into database with inferred name &amp; company entity. Tagged for Admin review.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleQuickAdd} className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={quickEmailInput}
              onChange={(e) => setQuickEmailInput(e.target.value)}
              placeholder="e.g. dimas.pratama@mra.co.id, maya.boutique@mogems.co.id (comma or space separated)"
              disabled={quickAdding}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={quickAdding || !quickEmailInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {quickAdding ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                + Quick Add by Email
              </>
            )}
          </button>
        </form>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-infers Full Name &amp; Company
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-amber-500" /> Auto-tagged as &ldquo;Pending Admin Review&rdquo;
          </span>
          <span className="text-slate-400">· Admin can complete phone, job title &amp; department details anytime</span>
        </div>
      </div>

      <Toolbar>
        <SegmentedFilter options={filterOptions} value={companyId} onChange={setCompanyId} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or department" />
      </Toolbar>

      <TableShell minWidth={760}>
        <thead className={theadCls}>
          <tr>
            <th className={thCls}>Name</th>
            <th className={thCls}>Entity</th>
            <th className={thCls}>Department</th>
            <th className={thCls}>Phone</th>
            <th className={`${thCls} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(loading && !attendees.length) || filtered.length === 0 ? (
            <TableState colSpan={5} loading={loading && !attendees.length} empty="No attendees found" />
          ) : (
            filtered.map((a) => {
              const isPending = a.department === 'Pending Admin Review';
              return (
                <tr
                  key={a.id}
                  className={`transition-colors ${
                    isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.fullName} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-slate-900">{a.fullName}</p>
                          {isPending && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <AlertCircle className="h-2.5 w-2.5 text-amber-600" />
                              Review
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-400">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="text-sm">{a.company?.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        Pending Admin Review
                      </span>
                    ) : (
                      <>
                        <p className="text-slate-700">{a.department}</p>
                        {a.jobTitle && <p className="text-xs text-slate-400">{a.jobTitle}</p>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {a.phone || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => openModal(a)}
                          className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
                        >
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          Complete Profile
                        </button>
                      ) : (
                        <IconAction label={`Edit ${a.fullName}`} onClick={() => openModal(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </IconAction>
                      )}
                      <IconAction label={`Remove ${a.fullName}`} tone="danger" onClick={() => handleDelete(a)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconAction>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableShell>

      <FormDialog
        open={modalOpen}
        title={
          editingItem
            ? isCurrentItemPending
              ? 'Complete Attendee Profile'
              : 'Edit Attendee'
            : 'Add Attendee'
        }
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
        submitLabel={editingItem ? 'Save profile' : 'Add attendee'}
      >
        {isCurrentItemPending && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Pending Admin Review</p>
              <p className="mt-0.5 text-amber-700">
                This attendee was quick-added via email. Please verify their Full Name, Company Entity, Department, and Contact Number.
              </p>
            </div>
          </div>
        )}
        <div>
          <label htmlFor="att-name" className={labelCls}>Full name</label>
          <input
            id="att-name"
            type="text"
            required
            autoFocus
            placeholder="e.g. Jessica Iskandar"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="att-email" className={labelCls}>Email</label>
          <input
            id="att-email"
            type="email"
            required
            placeholder="name@company.co.id"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="att-company" className={labelCls}>Entity</label>
            <select
              id="att-company"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className={inputCls}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="att-dept" className={labelCls}>Department</label>
            <input
              id="att-dept"
              type="text"
              required
              placeholder="e.g. Merchandising"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="att-title" className={labelCls}>
              Job title <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="att-title"
              type="text"
              placeholder="e.g. Senior Specialist"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="att-phone" className={labelCls}>
              Phone <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="att-phone"
              type="text"
              placeholder="+62 811…"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
