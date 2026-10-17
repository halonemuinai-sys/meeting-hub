'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendees.filter((a) => {
      if (companyId && a.companyId !== companyId) return false;
      if (q && !`${a.fullName} ${a.email} ${a.department} ${a.jobTitle || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [attendees, companyId, search]);

  const filterOptions = [
    { id: '', label: 'All', count: attendees.length },
    ...companies.map((c) => ({
      id: c.id,
      label: c.name.replace(/^PT\s+/i, ''),
      count: attendees.filter((a) => a.companyId === c.id).length
    }))
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendees Directory"
        description="Employees available for invitation suggestions when booking a meeting."
        actionLabel="Add Attendee"
        onAction={() => openModal(null)}
      />

      <Notice notice={notice} />

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
            filtered.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.fullName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{a.fullName}</p>
                      <p className="truncate text-xs text-slate-400">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{a.company?.name}</td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{a.department}</p>
                  {a.jobTitle && <p className="text-xs text-slate-400">{a.jobTitle}</p>}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600">{a.phone || <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconAction label={`Edit ${a.fullName}`} onClick={() => openModal(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconAction>
                    <IconAction label={`Remove ${a.fullName}`} tone="danger" onClick={() => handleDelete(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconAction>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      <FormDialog
        open={modalOpen}
        title={editingItem ? 'Edit Attendee' : 'Add Attendee'}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
        submitLabel={editingItem ? 'Save changes' : 'Add attendee'}
      >
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
