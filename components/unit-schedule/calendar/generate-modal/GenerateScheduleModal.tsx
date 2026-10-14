import React from 'react';
import { createPortal } from 'react-dom';
import { GenerateScheduleModalProps } from './types.ts';
import { PatternPeriodSection } from './PatternPeriodSection.tsx';
import { SchedulePreviewGrid } from './SchedulePreviewGrid.tsx';
import { EmployeeSelectionList } from './EmployeeSelectionList.tsx';

export const GenerateScheduleModal: React.FC<GenerateScheduleModalProps> = ({
    isOpen,
    onClose,
    generating,
    onGenerate,
    monthLabel,
    viewMonth,
    startDate,
    endDate,
    employees,
    schedules,
    patterns,
    unitShifts,
    dayHeaders,
    selectedPatternId,
    setSelectedPatternId,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    staggerOffset,
    setStaggerOffset,
    sundayLockEmpIds,
    setSundayLockEmpIds,
    autoAlignDayOfWeek,
    setAutoAlignDayOfWeek,
    genPeriodMode,
    setGenPeriodMode,
    genCustomStartDate,
    setGenCustomStartDate,
    genCustomEndDate,
    setGenCustomEndDate,
    genTargetMonth,
    setGenTargetMonth,
    genSearchQuery,
    setGenSearchQuery,
    genJabatanFilter,
    setGenJabatanFilter,
    targetGenStartDate,
    targetGenEndDate,
    genMonthLabel,
}) => {
    if (!isOpen) return null;

    const selectedPattern = patterns.find(p => p.id === selectedPatternId);

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Wide Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl flex flex-col z-50 border-l border-gray-200">
                {/* Header */}
                <div className="flex-shrink-0 px-6 py-5 border-b bg-gradient-to-r from-[#06736a] to-teal-600 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            ⚡ Generate Jadwal Bulanan
                        </h2>
                        <p className="text-teal-100 text-xs mt-0.5">
                            Buat jadwal otomatis berdasarkan pola rotasi shift untuk <strong className="text-white">{monthLabel}</strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body Scrollable — 2 Column Layout */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Configuration */}
                        <PatternPeriodSection
                            viewMonth={viewMonth}
                            startDate={startDate}
                            endDate={endDate}
                            patterns={patterns}
                            unitShifts={unitShifts}
                            selectedPatternId={selectedPatternId}
                            setSelectedPatternId={setSelectedPatternId}
                            staggerOffset={staggerOffset}
                            setStaggerOffset={setStaggerOffset}
                            autoAlignDayOfWeek={autoAlignDayOfWeek}
                            setAutoAlignDayOfWeek={setAutoAlignDayOfWeek}
                            genPeriodMode={genPeriodMode}
                            setGenPeriodMode={setGenPeriodMode}
                            genCustomStartDate={genCustomStartDate}
                            setGenCustomStartDate={setGenCustomStartDate}
                            genCustomEndDate={genCustomEndDate}
                            setGenCustomEndDate={setGenCustomEndDate}
                            genTargetMonth={genTargetMonth}
                            setGenTargetMonth={setGenTargetMonth}
                            targetGenStartDate={targetGenStartDate}
                            targetGenEndDate={targetGenEndDate}
                            genMonthLabel={genMonthLabel}
                        />

                        {/* RIGHT COLUMN: Karyawan & Preview */}
                        <div className="space-y-5">
                            <SchedulePreviewGrid
                                selectedEmployeeIds={selectedEmployeeIds}
                                selectedPattern={selectedPattern}
                                employees={employees}
                                dayHeaders={dayHeaders}
                                startDate={startDate}
                                sundayLockEmpIds={sundayLockEmpIds}
                                staggerOffset={staggerOffset}
                                autoAlignDayOfWeek={autoAlignDayOfWeek}
                                unitShifts={unitShifts}
                            />

                            <EmployeeSelectionList
                                employees={employees}
                                schedules={schedules}
                                selectedEmployeeIds={selectedEmployeeIds}
                                setSelectedEmployeeIds={setSelectedEmployeeIds}
                                sundayLockEmpIds={sundayLockEmpIds}
                                setSundayLockEmpIds={setSundayLockEmpIds}
                                genSearchQuery={genSearchQuery}
                                setGenSearchQuery={setGenSearchQuery}
                                genJabatanFilter={genJabatanFilter}
                                setGenJabatanFilter={setGenJabatanFilter}
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="flex-shrink-0 border-t bg-white px-6 py-4 flex justify-between items-center shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                    <div className="text-sm">
                        {!selectedPatternId ? (
                            <span className="text-amber-600 font-semibold">⚠️ Pilih pola rotasi terlebih dahulu</span>
                        ) : selectedEmployeeIds.length === 0 ? (
                            <span className="text-amber-600 font-semibold">⚠️ Pilih minimal 1 karyawan</span>
                        ) : (
                            <span className="text-[#06736a] font-semibold">
                                ✓ Siap generate <b>{selectedEmployeeIds.length} karyawan</b> dengan pola <b>{selectedPattern?.name}</b>
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onGenerate}
                            disabled={generating || !selectedPatternId || selectedEmployeeIds.length === 0}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm ${
                                generating || !selectedPatternId || selectedEmployeeIds.length === 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-[#06736a] hover:bg-[#054f46] hover:shadow-md'
                            }`}
                        >
                            {generating ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Meng-generate...
                                </>
                            ) : (
                                <>⚡ Generate {selectedEmployeeIds.length} Karyawan</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
