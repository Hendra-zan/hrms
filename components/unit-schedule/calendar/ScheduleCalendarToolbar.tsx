import React from 'react';
import { CalendarDaysIcon, ClockIcon } from '../../icons.tsx';
import LoadingSpinner from '../../LoadingSpinner.tsx';
import { ScheduleSummary } from '../../../services/scheduleService.ts';
import { Employee, RotationPattern, EmployeeSchedule } from '../../../types.ts';

interface ScheduleCalendarToolbarProps {
    monthLabel: string;
    navigateMonth: (delta: number) => void;
    loading: boolean;
    generating: boolean;
    publishing: boolean;
    patterns: RotationPattern[];
    schedules: EmployeeSchedule[];
    summary: ScheduleSummary | null;
    employees: Employee[];
    hasUnsavedDndChanges: boolean;
    onCopyPreviousMonth: () => void;
    onApplyHolidays: () => void;
    onShowImportModal: () => void;
    onExportXLSX: () => void;
    onPrintSchedule: () => void;
    onResetMonth: () => void;
    onOpenGenerateModal: () => void;
    onSaveDndChanges: () => void;
    onPublish: () => void;
    onUnpublish: () => void;
}

export const ScheduleCalendarToolbar: React.FC<ScheduleCalendarToolbarProps> = ({
    monthLabel,
    navigateMonth,
    loading,
    generating,
    publishing,
    patterns,
    schedules,
    summary,
    employees,
    hasUnsavedDndChanges,
    onCopyPreviousMonth,
    onApplyHolidays,
    onShowImportModal,
    onExportXLSX,
    onPrintSchedule,
    onResetMonth,
    onOpenGenerateModal,
    onSaveDndChanges,
    onPublish,
    onUnpublish,
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                    &lt;
                </button>
                <h3 className="text-lg font-bold text-gray-800 min-w-[160px] text-center">
                    {monthLabel}
                </h3>
                <button
                    onClick={() => navigateMonth(1)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                    &gt;
                </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={onCopyPreviousMonth}
                    disabled={loading || generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors font-medium"
                    title="Salin penugasan shift dari bulan sebelumnya"
                >
                    📋 Copy Bulan Lalu
                </button>
                <button
                    onClick={onApplyHolidays}
                    disabled={loading || generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-colors font-medium"
                    title="Tandai tanggal merah dan hari Minggu sebagai libur"
                >
                    🇲🇨 Terapkan Libur
                </button>
                <button
                    onClick={onShowImportModal}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 disabled:opacity-50 transition-colors font-medium"
                    title="Import jadwal dari file Excel"
                >
                    📤 Import Excel
                </button>
                <button
                    onClick={onExportXLSX}
                    disabled={loading || schedules.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors font-medium"
                    title="Ekspor jadwal bulan ini ke file Excel"
                >
                    📥 Export XLSX
                </button>
                <button
                    onClick={onPrintSchedule}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    title="Cetak format fisik jadwal ruangan (Print / PDF)"
                >
                    🖨️ Cetak PDF
                </button>
                <button
                    onClick={onResetMonth}
                    disabled={loading || !summary || (summary.draftDays === 0 && summary.filledDays === 0)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-colors font-medium"
                    title="Hapus semua jadwal draft dan override bulan ini"
                >
                    Reset Bulan Ini
                </button>
                <button
                    onClick={onOpenGenerateModal}
                    disabled={patterns.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-[#06736a] text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors font-bold shadow-sm"
                    title={patterns.length === 0 ? 'Buat pola rotasi terlebih dahulu' : ''}
                >
                    <CalendarDaysIcon className="w-4 h-4" />
                    Generate Jadwal
                </button>
                {hasUnsavedDndChanges && (
                    <button
                        type="button"
                        onClick={onSaveDndChanges}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold shadow-md animate-pulse"
                        title="Simpan draf pergeseran shift ke database server"
                    >
                        💾 Simpan Draf Geser
                    </button>
                )}
                <button
                    onClick={onPublish}
                    disabled={publishing || !summary || summary.draftDays === 0}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-bold shadow-sm"
                >
                    {publishing ? <LoadingSpinner size="small" color="white" /> : <ClockIcon className="w-4 h-4" />}
                    Publish {summary && summary.draftDays > 0 ? `(${summary.draftDays})` : ''}
                </button>
                {summary && summary.publishedDays > 0 && (
                    <button
                        type="button"
                        onClick={onUnpublish}
                        disabled={publishing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors font-semibold shadow-xs"
                        title="Tarik kembali jadwal yang sudah dipublish menjadi Draft"
                    >
                        <span>↩️</span>
                        <span>Batal Publish</span>
                    </button>
                )}
            </div>
        </div>
    );
};
