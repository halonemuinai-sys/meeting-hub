'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Armchair,
  Check,
  CheckCircle2,
  DoorOpen,
  Layers3,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Volume2,
  Wifi,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  FormDialog,
  IconAction,
  Notice,
  TableShell,
  TableState,
  inputCls,
  labelCls,
  thCls,
  theadCls,
  useNotice
} from '@/components/ui/admin';

const CATEGORIES = [
  { id: 'VISUAL_DISPLAY', label: 'Displays', icon: Monitor, tone: 'bg-blue-50 text-blue-600' },
  { id: 'AUDIO_CONFERENCE', label: 'Audio & Conference', icon: Volume2, tone: 'bg-violet-50 text-violet-600' },
  { id: 'CONNECTIVITY', label: 'Connectivity', icon: Wifi, tone: 'bg-cyan-50 text-cyan-700' },
  { id: 'ROOM_COMFORT', label: 'Comfort', icon: Armchair, tone: 'bg-amber-50 text-amber-700' }
];
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

const EMPTY_FORM = { name: '', category: 'VISUAL_DISPLAY', description: '', icon: 'Tv' };

export default function AmenitiesModule() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { notice, show } = useNotice();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete All state & verification
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [clearRoomsOption, setClearRoomsOption] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAmenities();
      setAmenities(res.data || []);
    } catch (err: any) {
      show(err.message || 'Failed to load amenities.', 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Escape key handler for Delete All modal
  useEffect(() => {
    if (!deleteAllOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deletingAll) {
        setDeleteAllOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteAllOpen, deletingAll]);

  const openModal = (item: any | null) => {
    setEditingItem(item);
    setForm(
      item
        ? { name: item.name, category: item.category, description: item.description || '', icon: item.icon || 'Tv' }
        : EMPTY_FORM
    );
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingItem) await api.updateAmenity(editingItem.id, form);
      else await api.createAmenity(form);
      setModalOpen(false);
      show(editingItem ? `${form.name} has been updated.` : `${form.name} has been added.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save amenity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete "${item.name}" from the amenities list?`)) return;
    try {
      await api.deleteAmenity(item.id);
      show(`${item.name} has been deleted.`);
      loadData();
    } catch (err: any) {
      show(err.message || 'Failed to delete amenity.', 'error');
    }
  };

  const openDeleteAllModal = () => {
    setConfirmText('');
    setClearRoomsOption(true);
    setDeleteAllError('');
    setDeleteAllOpen(true);
  };

  const closeDeleteAllModal = () => {
    if (deletingAll) return;
    setDeleteAllOpen(false);
    setConfirmText('');
    setDeleteAllError('');
  };

  const handleDeleteAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteAllError('Please type "DELETE" to confirm.');
      return;
    }

    setDeletingAll(true);
    setDeleteAllError('');
    try {
      const res = await api.deleteAllAmenities({ clearRooms: clearRoomsOption });
      setDeleteAllOpen(false);
      show(res.message || 'All amenities have been successfully deleted.');
      loadData();
    } catch (err: any) {
      setDeleteAllError(err.message || 'Failed to delete all amenities.');
    } finally {
      setDeletingAll(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return amenities.filter((a) => {
      if (category && a.category !== category) return false;
      if (q && !`${a.name} ${a.description || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [amenities, category, search]);

  const assignedCount = amenities.filter((a) => a.assignedRooms?.length).length;
  const initialLoading = loading && !amenities.length;
  const filterOptions = [
    { id: '', label: 'All amenities', icon: Layers3, tone: 'bg-slate-100 text-slate-600', count: amenities.length },
    ...CATEGORIES.map((c) => ({ ...c, count: amenities.filter((a) => a.category === c.id).length }))
  ];

  const isVerified = confirmText.trim().toUpperCase() === 'DELETE';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-5 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[40px] border-blue-100/40" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
              <Layers3 className="h-3.5 w-3.5" /> Facility management
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Room Amenities</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
              The details that make every meeting better. Manage equipment and comforts across your meeting rooms.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            {amenities.length > 0 && (
              <button
                type="button"
                onClick={openDeleteAllModal}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700 shadow-xs transition hover:bg-rose-100 hover:border-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>Delete All Amenities</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openModal(null)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Amenity</span>
            </button>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-1 gap-3 border-t border-slate-200/70 pt-5 sm:grid-cols-3">
          {[
            { label: 'Total amenities', value: amenities.length, icon: Layers3, tone: 'bg-blue-100/70 text-blue-600' },
            { label: 'Assigned to rooms', value: assignedCount, icon: CheckCircle2, tone: 'bg-emerald-100/70 text-emerald-600' },
            { label: 'Not yet assigned', value: amenities.length - assignedCount, icon: DoorOpen, tone: 'bg-amber-100/70 text-amber-600' }
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}><stat.icon className="h-5 w-5" /></span>
              <div><p className="text-xl font-bold tabular-nums text-slate-900">{initialLoading ? '...' : stat.value}</p><p className="text-xs text-slate-500">{stat.label}</p></div>
            </div>
          ))}
        </div>
      </section>

      <Notice notice={notice} />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5" aria-label="Filter amenities by category">
        {filterOptions.map((option) => (
          <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)} className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${category === option.id ? 'border-blue-300 bg-blue-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${option.tone}`}><option.icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 text-xs font-semibold text-slate-700">{option.label}</span>
            <span className="text-xs font-semibold tabular-nums text-slate-500">{initialLoading ? '...' : option.count}</span>
          </button>
        ))}
      </div>

      <section aria-label="Amenities catalog" aria-busy={loading} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500"><SlidersHorizontal className="h-4 w-4" /><h2 className="font-semibold text-slate-800">{CATEGORY_LABEL[category] || 'All amenities'}</h2><span aria-live="polite" className="text-xs">{loading ? 'Loading...' : `${filtered.length} items`}</span></div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input aria-label="Search amenities" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search amenities..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        {!initialLoading && filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500"><Armchair className="h-7 w-7" /></span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{search || category ? 'No matching amenities' : 'Start with the essentials'}</h3>
            <p className="mt-2 text-sm text-slate-500">{search || category ? 'Try another keyword or clear your filters.' : 'Add your first amenity to build your room equipment catalog.'}</p>
            <button type="button" onClick={() => { if (search || category) { setSearch(''); setCategory(''); } else openModal(null); }} className="mt-5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">{search || category ? 'Clear filters' : 'Add Amenity'}</button>
          </div>
        ) : (
          <TableShell minWidth={760}>
            <thead className={theadCls}>
              <tr>
                <th className={thCls}>Amenity</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Installed In</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLoading ? (
                <TableState colSpan={4} loading empty="No amenities found" />
              ) : (
                filtered.map((a) => {
                  const style = CATEGORIES.find((c) => c.id === a.category);
                  const AmenityIcon = style?.icon || Armchair;
                  const rooms: string[] = a.assignedRooms || [];
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style?.tone || 'bg-slate-100 text-slate-600'}`}><AmenityIcon className="h-4 w-4" /></span>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-slate-900">{a.name}</p>
                            <p className="break-words text-xs text-slate-400">{a.description || 'No description added.'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{CATEGORY_LABEL[a.category] || a.category}</td>
                      <td className="px-4 py-3">
                        {rooms.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">{rooms.map((room, index) => <span key={`${room}-${index}`} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">{room}</span>)}</div>
                        ) : (
                          <span className="text-xs text-slate-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction label={`Edit ${a.name}`} onClick={() => openModal(a)}><Pencil className="h-4 w-4" /></IconAction>
                          <IconAction label={`Delete ${a.name}`} tone="danger" onClick={() => handleDelete(a)}><Trash2 className="h-4 w-4" /></IconAction>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </TableShell>
        )}
      </section>

      {/* Edit / Add Modal */}
      <FormDialog
        open={modalOpen}
        title={editingItem ? 'Edit Amenity' : 'Add Amenity'}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
        submitLabel={editingItem ? 'Save changes' : 'Add amenity'}
      >
        <div>
          <label htmlFor="amenity-name" className={labelCls}>Name</label>
          <input
            id="amenity-name"
            type="text"
            required
            autoFocus
            placeholder="e.g. Smart TV 75 Inch"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="amenity-category" className={labelCls}>Category</label>
          <select
            id="amenity-category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amenity-desc" className={labelCls}>
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="amenity-desc"
            rows={3}
            placeholder="Size, resolution, ports or usage notes"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
          />
        </div>
      </FormDialog>

      {/* Verification Modal: Delete All Amenities */}
      <AnimatePresence>
        {deleteAllOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDeleteAllModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-all-title"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative z-10 my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
            >
              {/* Header with Danger Warning Accent */}
              <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50/90 to-amber-50/50 px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ring-4 ring-rose-50">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 id="delete-all-title" className="text-base font-bold text-slate-900">
                        Delete All Amenities
                      </h2>
                      <p className="text-xs font-medium text-rose-700">Irreversible destructive action</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeDeleteAllModal}
                    disabled={deletingAll}
                    aria-label="Close"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-40"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleDeleteAll}>
                <div className="space-y-4 px-6 py-5 text-sm text-slate-600">
                  <p>
                    You are about to permanently delete all{' '}
                    <span className="font-bold text-rose-700">{amenities.length} amenities</span> from the master
                    catalog.
                  </p>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs text-rose-900 space-y-1.5">
                    <p className="flex items-center gap-1.5 font-semibold text-rose-700">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Warning:
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-700">
                      <li>This action cannot be undone.</li>
                      <li>Any meeting room configurations referencing these amenities will lose these catalog options.</li>
                    </ul>
                  </div>

                  {/* Option: Clear existing room assignments */}
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={clearRoomsOption}
                      onChange={(e) => setClearRoomsOption(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">Clear amenities from existing rooms</span>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Reset the amenities list on all rooms to empty so no orphaned badges remain.
                      </p>
                    </div>
                  </label>

                  {/* Verification input */}
                  <div className="space-y-1.5 pt-1">
                    <label htmlFor="verify-delete-input" className="block text-xs font-semibold text-slate-800">
                      To verify, type <span className="font-mono font-bold text-rose-600">DELETE</span> below:
                    </label>
                    <div className="relative">
                      <input
                        id="verify-delete-input"
                        type="text"
                        autoFocus
                        disabled={deletingAll}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono transition outline-none ${
                          isVerified
                            ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        }`}
                      />
                      {isVerified && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <Check className="h-4 w-4" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {deleteAllError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{deleteAllError}</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeDeleteAllModal}
                    disabled={deletingAll}
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isVerified || deletingAll}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-rose-600"
                  >
                    {deletingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Delete All ({amenities.length}) Amenities</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
