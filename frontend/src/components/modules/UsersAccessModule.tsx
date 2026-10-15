'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Mail,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';

export default function UsersAccessModule() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'USER',
    companyId: '',
    department: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, compRes] = await Promise.all([
        api.getUsers(),
        api.getCompanies()
      ]);
      setUsers(uRes.data || []);
      setCompanies(compRes.data || []);
      if (compRes.data?.length > 0 && !form.companyId) {
        setForm((prev) => ({ ...prev, companyId: compRes.data[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
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
      name: '',
      email: '',
      role: 'USER',
      companyId: companies[0]?.id || '',
      department: ''
    });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      email: item.email,
      role: item.role,
      companyId: item.companyId || (companies[0]?.id || ''),
      department: item.department || ''
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
        await api.updateUser(editingItem.id, form);
      } else {
        await api.createUser(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await api.updateUser(user.id, { isActive: !user.isActive });
      loadData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user account "${name}" from system?`)) return;
    try {
      await api.deleteUser(id);
      loadData();
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmin: users.filter((u) => u.role === 'SUPER_ADMIN').length,
      gaAdmin: users.filter((u) => u.role === 'GA_ADMIN').length,
      employee: users.filter((u) => u.role === 'USER').length
    };
  }, [users]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200'
        };
      case 'GA_ADMIN':
        return {
          label: 'GA Admin',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200'
        };
      case 'USER':
      default:
        return {
          label: 'Employee / User',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/70 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600">
                ROLE-BASED ACCESS CONTROL (RBAC)
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                Users & Access Management
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Manage system permissions, GA administrator roles, assigned entities, and active status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4 stroke-[3]" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Users</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Registered across system</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Super Administrators</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-purple-600">{stats.superAdmin}</p>
          <span className="text-[11px] text-slate-400">Full System & RBAC Access</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">GA Administrators</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.gaAdmin}</p>
          <span className="text-[11px] text-slate-400">Rooms & Amenities Control</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Employee Staff</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-blue-600">{stats.employee}</p>
          <span className="text-[11px] text-slate-400">Booking & Calendar Access</span>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="">All User Roles</option>
            <option value="SUPER_ADMIN">Super Administrator</option>
            <option value="GA_ADMIN">GA Administrator</option>
            <option value="USER">Employee / User</option>
          </select>
        </div>

        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Role & Permissions</th>
                <th className="px-4 py-3.5">Assigned Entity</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const roleBadge = getRoleBadge(u.role);
                const initials = u.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={u.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {u.companyName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {u.department}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{u.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
                          title="Edit User"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit User Permissions' : 'Add New User'}
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
                  placeholder="e.g. Bambang Sudibyo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corporate Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="bambang@mra.co.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role & Permissions <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="USER">Employee / User</option>
                    <option value="GA_ADMIN">GA Administrator</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Entity
                  </label>
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">All Entities (Holding)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Division
                </label>
                <input
                  type="text"
                  placeholder="General Affairs / IT SS"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
