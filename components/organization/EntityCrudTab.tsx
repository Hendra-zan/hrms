import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '../icons.tsx';

interface CrudItem {
    id: string;
    nama: string;
    kode?: string;
}

interface EntityCrudTabProps<T extends CrudItem> {
    entityLabel: string;
    entityLabelPlural: string;
    items: T[];
    onSave: (item: T) => void;
    onDelete: (id: string) => void;
    placeholder?: string;
    showCode?: boolean;
}

function EntityCrudTab<T extends CrudItem>({
    entityLabel,
    entityLabelPlural,
    items,
    onSave,
    onDelete,
    placeholder,
    showCode = false,
}: EntityCrudTabProps<T>) {
    const [editing, setEditing] = useState<T | null>(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    useEffect(() => {
        setName(editing ? editing.nama : '');
        setCode(editing ? (editing.kode || '') : '');
    }, [editing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert(`Nama ${entityLabel.toLowerCase()} tidak boleh kosong.`);
            return;
        }
        if (showCode && !/^\d{2}$/.test(code.trim())) {
            alert(`Kode ${entityLabel.toLowerCase()} harus berupa 2 digit angka.`);
            return;
        }
        onSave({
            id: editing ? editing.id : '',
            nama: name,
            ...(showCode ? { kode: code.trim() } : {})
        } as T);
        setEditing(null);
        setName('');
        setCode('');
    };

    const handleCancel = () => {
        setEditing(null);
        setName('');
        setCode('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-[#06736a] mb-4">
                        {editing ? `Edit ${entityLabel}` : `Tambah ${entityLabel} Baru`}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor={`${entityLabel}-name`} className="block text-sm font-medium text-gray-700">
                                Nama {entityLabel}
                            </label>
                            <input
                                type="text"
                                id={`${entityLabel}-name`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a]"
                                placeholder={placeholder || `Contoh: ${entityLabel} Baru`}
                                required
                            />
                        </div>
                        {showCode && (
                            <div>
                                <label htmlFor={`${entityLabel}-code`} className="block text-sm font-medium text-gray-700">
                                    Kode {entityLabel} (2 Digit Angka)
                                </label>
                                <input
                                    type="text"
                                    id={`${entityLabel}-code`}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                    className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a]"
                                    placeholder="Contoh: 01"
                                    required
                                />
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            {editing && (
                                <button type="button" onClick={handleCancel}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                                    Batal
                                </button>
                            )}
                            <button type="submit"
                                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#06736a] hover:bg-[#054f46]">
                                {editing ? 'Simpan Perubahan' : `Tambah ${entityLabel}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2">
                <EntityList
                    entityLabel={entityLabel}
                    entityLabelPlural={entityLabelPlural}
                    items={items}
                    showCode={showCode}
                    onEdit={(item) => setEditing(item)}
                    onDelete={onDelete}
                />
            </div>
        </div>
    );
}

/* ── Extracted list panel with search & sort ─────────────────────── */
function EntityList<T extends CrudItem>({
    entityLabel,
    entityLabelPlural,
    items,
    showCode,
    onEdit,
    onDelete,
}: {
    entityLabel: string;
    entityLabelPlural: string;
    items: T[];
    showCode: boolean;
    onEdit: (item: T) => void;
    onDelete: (id: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<'nama' | 'kode'>('nama');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const q = search.trim().toLowerCase();

    const filtered = items
        .filter(item =>
            item.nama.toLowerCase().includes(q) ||
            (item.kode || '').toLowerCase().includes(q)
        )
        .sort((a, b) => {
            const va = (sortKey === 'kode' ? (a.kode || '') : a.nama).toLowerCase();
            const vb = (sortKey === 'kode' ? (b.kode || '') : b.nama).toLowerCase();
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });

    const toggleSort = (key: 'nama' | 'kode') => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ col }: { col: 'nama' | 'kode' }) => {
        if (sortKey !== col) return <span className="ml-1 text-gray-300">↕</span>;
        return <span className="ml-1 text-[#06736a]">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-lg font-bold text-[#06736a] whitespace-nowrap">
                    Daftar {entityLabelPlural}
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                    {filtered.length}/{items.length} data
                </span>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-2 mb-4 px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#06736a] focus-within:border-transparent transition">
                <svg
                    className="h-4 w-4 text-gray-400 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`Cari ${entityLabelPlural.toLowerCase()} berdasarkan nama${showCode ? ' atau kode' : ''}…`}
                    className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-400"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 leading-none"
                        aria-label="Hapus pencarian"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {showCode && (
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer select-none hover:text-[#06736a] transition-colors"
                                    onClick={() => toggleSort('kode')}
                                >
                                    Kode <SortIcon col="kode" />
                                </th>
                            )}
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-[#06736a] transition-colors"
                                onClick={() => toggleSort('nama')}
                            >
                                Nama {entityLabel} <SortIcon col="nama" />
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.length > 0 ? (
                            filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    {showCode && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                            {item.kode || '-'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {q ? (
                                            <HighlightedText text={item.nama} query={q} />
                                        ) : item.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => onEdit(item)}
                                            className="p-2 text-gray-400 hover:text-[#06736a] rounded-full hover:bg-[#e6f3f2] transition-colors"
                                            aria-label={`Edit ${entityLabel.toLowerCase()}`}>
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onDelete(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 ml-2 transition-colors"
                                            aria-label={`Hapus ${entityLabel.toLowerCase()}`}>
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={showCode ? 3 : 2} className="px-6 py-10 text-center">
                                    {q ? (
                                        <div className="text-gray-500">
                                            <p className="text-2xl mb-2">🔍</p>
                                            <p className="font-medium">Tidak ada hasil untuk "<span className="text-[#06736a]">{search}</span>"</p>
                                            <p className="text-xs mt-1 text-gray-400">Coba kata kunci lain atau hapus filter</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Belum ada {entityLabelPlural.toLowerCase()} yang ditambahkan.</p>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── Text highlight helper ───────────────────────────────────────── */
function HighlightedText({ text, query }: { text: string; query: string }) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export default EntityCrudTab;
