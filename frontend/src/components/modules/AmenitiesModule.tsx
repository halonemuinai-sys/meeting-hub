'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
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

const CATEGORIES = [
  { id: 'VISUAL_DISPLAY', label: 'Displays' },
  { id: 'AUDIO_CONFERENCE', label: 'Audio & Conference' },
  { id: 'CONNECTIVITY', label: 'Connectivity' },
  { id: 'ROOM_COMFORT', label: 'Comfort' }
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return amenities.filter((a) => {
      if (category && a.category !== category) return false;
      if (q && !`${a.name} ${a.description || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [amenities, category, search]);

  const filterOptions = [
    { id: '', label: 'All', count: amenities.length },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, count: amenities.filter((a) => a.category === c.id).length }))
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Room Amenities"
        description="Equipment and facilities that can be assigned to meeting rooms."
        actionLabel="Add Amenity"
        onAction={() => openModal(null)}
      />

      <Notice notice={notice} />

      <Toolbar>
        <SegmentedFilter options={filterOptions} value={category} onChange={setCategory} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search amenities" />
      </Toolbar>

      <TableShell>
        <thead className={theadCls}>
          <tr>
            <th className={thCls}>Amenity</th>
            <th className={thCls}>Category</th>
            <th className={thCls}>Installed in</th>
            <th className={`${thCls} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(loading && !amenities.length) || filtered.length === 0 ? (
            <TableState colSpan={4} loading={loading && !amenities.length} empty="No amenities found" />
          ) : (
            filtered.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                  {a.description && <p className="mt-0.5 max-w-md truncate text-xs text-slate-400">{a.description}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[a.category] || a.category}</td>
                <td className="px-4 py-3">
                  {a.assignedRooms?.length ? (
                    <span className="text-slate-600" title={a.assignedRooms.join(', ')}>
                      {a.assignedRooms.slice(0, 2).join(', ')}
                      {a.assignedRooms.length > 2 && <span className="text-slate-400"> +{a.assignedRooms.length - 2}</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400">Not assigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconAction label={`Edit ${a.name}`} onClick={() => openModal(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconAction>
                    <IconAction label={`Delete ${a.name}`} tone="danger" onClick={() => handleDelete(a)}>
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
    </div>
  );
}
