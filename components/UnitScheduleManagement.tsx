/**
 * UnitScheduleManagement.tsx - REDESIGNED
 *
 * Manages unit schedules with a premium UI.
 */
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Employee } from '../types.ts';
import { CalendarDaysIcon, UserGroupIcon } from './icons.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import RotationPatternPanel from './RotationPatternPanel.tsx';
import ScheduleCalendarPanel from './ScheduleCalendarPanel.tsx';
import ScheduleSummaryPanel from './unit-schedule/ScheduleSummaryPanel.tsx';
import ShiftDefinitionPanel from './unit-schedule/ShiftDefinitionPanel.tsx';
import ShiftAssignmentPanel from './unit-schedule/ShiftAssignmentPanel.tsx';
import { useUnitScheduleManagement } from '../hooks/useUnitScheduleManagement';

interface UnitScheduleManagementProps {
    kepalaRuangan: Employee;
}

type Tab = 'calendar' | 'summary' | 'patterns' | 'config';

const TABS: { key: Tab; label: string; icon: string; desc: string }[] = [
    { key: 'summary',   label: 'Analisis Shift',              icon: '📊', desc: 'Detail Pagi/Siang/Malam & filter per minggu/bulan' },
    { key: 'calendar',  label: 'Jadwal Bulanan',              icon: '📅', desc: 'Lihat & edit jadwal per tanggal' },
    { key: 'patterns',  label: 'Pola Rotasi',                 icon: '🔄', desc: 'Buat template siklus shift' },
    { key: 'config',    label: 'Konfigurasi Shift',           icon: '⚙️', desc: 'Definisi dan penugasan shift' },
];


const UnitScheduleManagement: React.FC<UnitScheduleManagementProps> = ({ kepalaRuangan }) => {
    const sanitizeId = (v: unknown): string | undefined => {
        if (!v) return undefined;
        const s = String(v).trim();
        if (s === 'undefined' || s === 'null' || s === '') return undefined;
        return s;
    };
    const managedUnitId = sanitizeId(kepalaRuangan.unitKerjaId)
        ?? sanitizeId((kepalaRuangan as any).unit_kerja_id)
        ?? sanitizeId(kepalaRuangan.managedUnitId)
        ?? sanitizeId((kepalaRuangan as any).managed_unit_id)
        ?? '';
    const {
        unitEmployees, workUnit, loading, saving, savingConfig,
        editedShifts, originalUnitShifts, unitShifts, setUnitShifts,
        notification, showNotification, loadUnitData, handleShiftChange,
        changedEmployeeIds, saveShiftChanges, saveShiftConfig, resetShiftChanges, unitShiftsDirty
    } = useUnitScheduleManagement(managedUnitId);


    const [activeTab, setActiveTab] = useState<Tab>('summary');


    const handleExportAssignments = () => {
        if (unitEmployees.length === 0) {
            showNotification('error', 'Tidak ada karyawan untuk di-export.');
            return;
        }
        const rows = unitEmployees.map(emp => {
            const shiftName = editedShifts[emp.id] || emp.shift || '';
            const shiftDef = unitShifts.find(s => s.name === shiftName);
            return {
                NIK: (emp as any).nik || (emp as any).ktpNumber || '',
                Nama: emp.nama, Jabatan: emp.jabatan || '-', Status: emp.status || '-',
                Shift: shiftName || '-', Tipe: shiftDef?.type === 'fixed' ? 'Tetap' : (shiftDef?.type === 'rotating' ? 'Bergilir' : '-'),
                Jam_Masuk: shiftDef?.startTime || '-', Jam_Keluar: shiftDef?.endTime || '-',
                Khusus_Jabatan: shiftDef?.positionGroup || '-', Toleransi_Menit: shiftDef?.lateToleranceMinutes ?? '-',
                Email: emp.email || '-',
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 14 },{ wch: 25 },{ wch: 22 },{ wch: 12 },{ wch: 16 },{ wch: 10 },{ wch: 12 },{ wch: 12 },{ wch: 22 },{ wch: 14 },{ wch: 25 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Penugasan Shift');
        const today = new Date().toISOString().split('T')[0];
        const safeName = (workUnit?.nama || 'unit').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        XLSX.writeFile(wb, `penugasan_shift_${safeName}_${today}.xlsx`);
        showNotification('success', `✅ Export ${rows.length} penugasan shift berhasil.`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <LoadingSpinner size="large" />
                <p className="text-gray-500 text-sm animate-pulse">Memuat data unit...</p>
            </div>
        );
    }

    if (!managedUnitId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-64 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-10 text-center">
                <span className="text-5xl mb-4">🏥</span>
                <h3 className="text-lg font-bold text-amber-800">Unit Belum Dikonfigurasi</h3>
                <p className="mt-2 text-sm text-amber-700">Anda belum ditugaskan sebagai kepala ruangan untuk unit tertentu.</p>
                <p className="mt-1 text-xs text-amber-600">Silakan hubungi HRD untuk pengaturan lebih lanjut.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            {/* ── Hero Header ────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06736a] via-[#055f57] to-teal-800 p-6 text-white shadow-xl">
                {/* Decorative */}
                <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-white/5" />

                <div className="relative z-10 flex flex-wrap items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-xl border border-white/30">
                        <CalendarDaysIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold">Manajemen Jadwal Shift</h1>
                        <p className="mt-1 text-sm text-blue-100 flex items-center gap-2">
                            <span>🏥 {workUnit?.nama || 'Unit Kerja'}</span>
                            <span>•</span>
                            <span>👥 {unitEmployees.length} Karyawan</span>
                            <span>•</span>
                            <span>⚙️ {unitShifts.length} Shift Terkonfigurasi</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-sm animate-fade-in ${
                    notification.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-2">
                        <span>{notification.type === 'success' ? '✅' : '⚠️'}</span>
                        <span className="font-medium">{notification.text}</span>
                    </div>
                </div>
            )}

            {/* Main Tabs Container */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                {/* ── Tab Bar ── */}
                <div className="flex border-b border-gray-200 bg-gray-50/50 p-2 gap-2 overflow-x-auto">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-semibold transition-all flex-shrink-0 ${
                                    isActive
                                        ? 'bg-white text-primary shadow-md border border-gray-200/80 scale-[1.02]'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                                }`}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                <div className="text-left">
                                    <p className="leading-none">{tab.label}</p>
                                    <p className={`text-[10px] font-normal mt-0.5 ${isActive ? 'text-primary/80' : 'text-gray-400'}`}>
                                        {tab.desc}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ── Tab Content ── */}
                <div className="p-5">
                    {activeTab === 'calendar' && managedUnitId && (
                        <ScheduleCalendarPanel
                            unitId={managedUnitId}
                            unitShifts={unitShifts}
                            employees={unitEmployees.filter(e => e.status === 'Aktif')}
                            userId={kepalaRuangan.user_id}
                            onNotify={showNotification}
                        />
                    )}

                    {activeTab === 'summary' && managedUnitId && (
                        <ScheduleSummaryPanel
                            unitId={managedUnitId}
                            unitShifts={unitShifts}
                            employees={unitEmployees.filter(e => e.status === 'Aktif')}
                            onNotify={showNotification}
                        />
                    )}

                    {activeTab === 'patterns' && managedUnitId && (
                        <RotationPatternPanel
                            unitId={managedUnitId}
                            unitShifts={unitShifts}
                            userId={kepalaRuangan.user_id}
                            onNotify={showNotification}
                        />
                    )}

                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            <ShiftDefinitionPanel
                                unitShifts={unitShifts}
                                onShiftsChange={setUnitShifts}
                                unitShiftsDirty={unitShiftsDirty}
                                savingConfig={savingConfig}
                                workUnitName={workUnit?.nama || ''}
                                unitEmployees={unitEmployees}
                                onSave={saveShiftConfig}
                                onReset={() => setUnitShifts([...originalUnitShifts])}
                                showNotification={showNotification}
                            />
                            <ShiftAssignmentPanel
                                unitEmployees={unitEmployees}
                                editedShifts={editedShifts}
                                onShiftChange={handleShiftChange}
                                changedEmployeeIds={changedEmployeeIds}
                                unitShifts={unitShifts}
                                workUnitName={workUnit?.nama || ''}
                                saving={saving}
                                onSave={saveShiftChanges}
                                onReset={resetShiftChanges}
                                onExport={handleExportAssignments}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnitScheduleManagement;
