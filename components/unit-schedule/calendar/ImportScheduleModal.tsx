import React from 'react';
import { createPortal } from 'react-dom';
import { ImportDataState } from './types.ts';

interface ImportScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    daysInMonth: number;
    monthLabel: string;
    importing: boolean;
    importData: ImportDataState | null;
    onDownloadTemplate: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveImportedSchedules: () => void;
}

export const ImportScheduleModal: React.FC<ImportScheduleModalProps> = ({
    isOpen,
    onClose,
    daysInMonth,
    monthLabel,
    importing,
    importData,
    onDownloadTemplate,
    onFileUpload,
    onSaveImportedSchedules,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl flex flex-col z-50 transform transition-all border-l border-gray-200">
                {/* Modal Header */}
                <div className="p-6 border-b flex justify-between items-center bg-white z-10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-[#06736a]">
                            📤 Import Jadwal Bulanan dari Excel
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Tutup">
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                    {/* Step 1: Download Template */}
                    <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-2 text-xs text-gray-700">
                        <p className="font-bold text-teal-800 text-sm">Langkah 1: Unduh Format Template</p>
                        <p>Gunakan file template Excel berformat NIK, Nama Karyawan, Jabatan, dan kolom tanggal 1 s/d {daysInMonth}:</p>
                        <button
                            type="button"
                            onClick={onDownloadTemplate}
                            className="px-3.5 py-2 text-xs bg-white text-[#06736a] border border-[#06736a]/40 rounded-lg hover:bg-teal-100 font-bold transition-colors shadow-sm flex items-center gap-2"
                        >
                            📥 Unduh Template Excel ({monthLabel})
                        </button>
                    </div>

                    {/* Step 2: Upload File */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700">
                            Langkah 2: Pilih / Upload File Excel (.xlsx / .xls)
                        </label>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={onFileUpload}
                            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg bg-gray-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#06736a] file:text-white hover:file:bg-[#054f46]"
                        />
                    </div>

                    {/* Step 3: Result Preview */}
                    {importData && (
                        <div className="space-y-3 pt-3 border-t border-gray-200">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                                <p className="font-bold">✓ Hasil Pembacaan Excel:</p>
                                <p>• Karyawan Cocok: <b>{importData.matchedEmpCount} Karyawan</b></p>
                                <p>• Total Sel Jadwal Parsed: <b>{importData.parsedSchedules.length} Sel Shift</b></p>
                            </div>

                            {importData.errors.length > 0 && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1 max-h-32 overflow-y-auto">
                                    <p className="font-bold">⚠️ Warning / Catatan ({importData.errors.length}):</p>
                                    {importData.errors.map((err, i) => (
                                        <p key={i}>• {err}</p>
                                    ))}
                                </div>
                            )}

                            {/* Preview Table */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-100 border-b text-gray-600 font-semibold">
                                        <tr>
                                            <th className="px-3 py-2">Karyawan</th>
                                            <th className="px-3 py-2">Tanggal</th>
                                            <th className="px-3 py-2">Shift Parsed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {importData.parsedSchedules.slice(0, 15).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-3 py-1.5 font-medium">{item.employeeNama}</td>
                                                <td className="px-3 py-1.5 text-gray-500">{item.date}</td>
                                                <td className="px-3 py-1.5 font-bold text-[#06736a]">
                                                    {item.isOff ? 'Libur (OFF)' : item.shiftName}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {importData.parsedSchedules.length > 15 && (
                                    <p className="text-[10px] text-gray-400 text-center py-1">
                                        ...dan {importData.parsedSchedules.length - 15} entri sel lainnya
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Drawer Footer */}
                <div className="flex-shrink-0 border-t bg-white px-6 py-4 flex justify-between items-center shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onSaveImportedSchedules}
                        disabled={!importData || importData.parsedSchedules.length === 0 || importing}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                            !importData || importData.parsedSchedules.length === 0 || importing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#06736a] hover:bg-[#054f46]'
                        }`}
                    >
                        {importing ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Meng-import...
                            </>
                        ) : (
                            <>💾 Simpan Jadwal Import ({importData?.parsedSchedules.length || 0})</>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
