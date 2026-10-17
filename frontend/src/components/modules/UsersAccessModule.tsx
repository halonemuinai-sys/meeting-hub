'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pencil, Power, RotateCcw, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/permissions';
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

type Role = 'SUPER_ADMIN' | 'GA_ADMIN' | 'USER';

const ROLE_HINT: Record<Role, string> = {
  SUPER_ADMIN: 'Full access, including user management',
  GA_ADMIN: 'Manages rooms, amenities and the directory',
  USER: 'Books rooms and manages own bookings'
};

const ROLE_BADGE: Record<Role, string> = {
  SUPER_ADMIN: 'bg-slate-900 text-white',
  GA_ADMIN: 'bg-slate-100 text-slate-700',
  USER: 'text-slate-500'
};

const emptyForm = () => ({ name: '', email: '', role: 'USER' as Role, companyId: '', department: '', password: '' });

export default function UsersAccessModule() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'' | Role>('');
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
      const [uRes, compRes] = await Promise.all([api.getUsers(), api.getCompanies()]);
      setUsers(uRes.data || []);
      setCompanies(compRes.data || []);
    } catch (err: any) {
      show(err.message || 'Failed to load users.', 'error');
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
            name: item.name,
            email: item.email,
            role: item.role,
            companyId: item.companyId || '',
            department: item.department === 'General' ? '' : item.department || '',
            password: ''
          }
        : emptyForm()
    );
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { password, ...rest } = form;
      if (editingItem) await api.updateUser(editingItem.id, rest);
      else await api.createUser(form);
      setModalOpen(false);
      show(editingItem ? `${form.name} has been updated.` : `${form.name} has been added.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: any) => {
    if (u.isActive && !confirm(`Deactivate ${u.name}? They will no longer be able to sign in.`)) return;
    try {
      await api.updateUser(u.id, { isActive: !u.isActive });
      show(u.isActive ? `${u.name} has been deactivated.` : `${u.name} has been reactivated.`);
      loadData();
    } catch (err: any) {
      show(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async (u: any) => {
    if (!confirm(`Delete the account for ${u.name}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      show(`${u.name} has been deleted.`);
      loadData();
    } catch (err: any) {
      show(err.message || 'Failed to delete user.', 'error');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (q && !`${u.name} ${u.email} ${u.department || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, roleFilter, search]);

  const filterOptions: { id: '' | Role; label: string; count: number }[] = [
    { id: '', label: 'All', count: users.length },
    ...(['SUPER_ADMIN', 'GA_ADMIN', 'USER'] as Role[]).map((r) => ({
      id: r,
      label: ROLE_LABELS[r],
      count: users.filter((u) => u.role === r).length
    }))
  ];

  const isSelf = (u: any) => u.id === currentUser?.id;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users & Access"
        description="Who can sign in, and what each role is allowed to do."
        actionLabel="Add User"
        onAction={() => openModal(null)}
      />

      <Notice notice={notice} />

      <Toolbar>
        <SegmentedFilter<'' | Role> options={filterOptions} value={roleFilter} onChange={setRoleFilter} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email" />
      </Toolbar>

      <TableShell minWidth={800}>
        <thead className={theadCls}>
          <tr>
            <th className={thCls}>User</th>
            <th className={thCls}>Role</th>
            <th className={thCls}>Entity</th>
            <th className={thCls}>Department</th>
            <th className={thCls}>Status</th>
            <th className={`${thCls} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(loading && !users.length) || filtered.length === 0 ? (
            <TableState colSpan={6} loading={loading && !users.length} empty="No users found" />
          ) : (
            filtered.map((u) => (
              <tr key={u.id} className={`transition-colors hover:bg-slate-50/60 ${!u.isActive ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                        {u.name}
                        {isSelf(u) && <span className="text-[11px] font-medium text-slate-400">(You)</span>}
                      </p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[u.role as Role] || ''}`}>
                    {ROLE_LABELS[u.role as Role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.companyName}</td>
                <td className="px-4 py-3 text-slate-600">{u.department}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconAction label={`Edit ${u.name}`} onClick={() => openModal(u)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconAction>
                    {!isSelf(u) && (
                      <>
                        <IconAction
                          label={u.isActive ? `Deactivate ${u.name}` : `Reactivate ${u.name}`}
                          tone={u.isActive ? 'warning' : 'success'}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.isActive ? <Power className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        </IconAction>
                        <IconAction label={`Delete ${u.name}`} tone="danger" onClick={() => handleDelete(u)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconAction>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      <FormDialog
        open={modalOpen}
        title={editingItem ? `Edit ${editingItem.name}` : 'Add User'}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
        submitLabel={editingItem ? 'Save changes' : 'Add user'}
      >
        <div>
          <label htmlFor="user-name" className={labelCls}>Full name</label>
          <input
            id="user-name"
            type="text"
            required
            autoFocus
            placeholder="e.g. Bambang Sudibyo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="user-email" className={labelCls}>Email</label>
          <input
            id="user-email"
            type="email"
            required
            placeholder="name@mra.co.id"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
          />
        </div>

        <fieldset disabled={!!editingItem && isSelf(editingItem)}>
          <legend className={labelCls}>Role</legend>
          <div className="space-y-1.5">
            {(['USER', 'GA_ADMIN', 'SUPER_ADMIN'] as Role[]).map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  form.role === r ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={form.role === r}
                  onChange={() => setForm({ ...form, role: r })}
                  className="mt-0.5 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">{ROLE_LABELS[r]}</span>
                  <span className="block text-xs text-slate-500">{ROLE_HINT[r]}</span>
                </span>
              </label>
            ))}
          </div>
          {!!editingItem && isSelf(editingItem) && (
            <p className="mt-1.5 text-xs text-slate-400">You cannot change your own role.</p>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="user-company" className={labelCls}>Entity</label>
            <select
              id="user-company"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className={inputCls}
            >
              <option value="">All entities (Holding)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="user-dept" className={labelCls}>
              Department <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="user-dept"
              type="text"
              placeholder="e.g. General Affairs"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        {!editingItem && (
          <div>
            <label htmlFor="user-password" className={labelCls}>
              Initial password
            </label>
            <input
              id="user-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputCls}
            />
              <p className="mt-1.5 text-xs text-slate-400">Share it with the user securely and ask them to change it after signing in.</p>
          </div>
        )}
      </FormDialog>
    </div>
  );
}
