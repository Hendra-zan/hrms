import React from 'react';
import LoadingSpinner from './LoadingSpinner.tsx';
import {
    ScheduleCalendarPanelProps,
    useScheduleCalendarState,
    exportScheduleToXLSX,
    downloadScheduleExcelTemplate,
    ScheduleCalendarToolbar,
    ScheduleFilterSearchBar,
    ScheduleSummaryStats,
    ScheduleCoverageAlert,
    CalendarGridTable,
    GenerateScheduleModal,
    ShiftOverrideModal,
    ImportScheduleModal,
} from './unit-schedule/calendar/index.ts';

const ScheduleCalendarPanel: React.FC<ScheduleCalendarPanelProps> = ({
    unitId,
    unitShifts,
    employees,
    userId,
    onNotify,
}) => {
    const calendar = useScheduleCalendarState({
        unitId,
        unitShifts,
        employees,
        userId,
        onNotify,
    });

    if (calendar.loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    const handleExportXLSX = () => {
        exportScheduleToXLSX(
            employees,
            calendar.schedules,
            calendar.scheduleGrid,
            calendar.dayHeaders,
            unitShifts,
            calendar.monthLabel
        );
        onNotify('success', `Berhasil mengekspor jadwal bulan ${calendar.monthLabel} ke Excel.`);
    };

    const handleDownloadTemplate = () => {
        downloadScheduleExcelTemplate(
            employees,
            calendar.scheduleGrid,
            calendar.dayHeaders,
            calendar.viewMonth
        );
        onNotify('success', 'Template Excel Jadwal berhasil didownload.');
    };

    const handlePrintSchedule = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* 1. Controls Bar / Toolbar */}
            <ScheduleCalendarToolbar
                monthLabel={calendar.monthLabel}
                navigateMonth={calendar.navigateMonth}
                loading={calendar.loading}
                generating={calendar.generating}
                publishing={calendar.publishing}
                patterns={calendar.patterns}
                schedules={calendar.schedules}
                summary={calendar.summary}
                employees={employees}
                hasUnsavedDndChanges={calendar.hasUnsavedDndChanges}
                onCopyPreviousMonth={calendar.handleCopyPreviousMonth}
                onApplyHolidays={calendar.handleApplyHolidays}
                onShowImportModal={() => calendar.setShowImportModal(true)}
                onExportXLSX={handleExportXLSX}
                onPrintSchedule={handlePrintSchedule}
                onResetMonth={calendar.handleResetMonth}
                onOpenGenerateModal={() => {
                    calendar.setSelectedEmployeeIds(employees.map(e => e.id));
                    calendar.setShowGenerateModal(true);
                }}
                onSaveDndChanges={calendar.handleSaveDndChanges}
                onPublish={calendar.handlePublish}
                onUnpublish={calendar.handleUnpublish}
            />

            {/* 2. Filter & Search Bar */}
            <ScheduleFilterSearchBar
                searchQuery={calendar.searchQuery}
                setSearchQuery={calendar.setSearchQuery}
                selectedJabatanFilter={calendar.selectedJabatanFilter}
                setSelectedJabatanFilter={calendar.setSelectedJabatanFilter}
                availableJabatans={calendar.availableJabatans}
                warningOnlyFilter={calendar.warningOnlyFilter}
                setWarningOnlyFilter={calendar.setWarningOnlyFilter}
                totalEmployees={employees.length}
                filteredCount={calendar.filteredEmployees.length}
            />

            {/* 3. Summary Stats & Shift Legend */}
            <ScheduleSummaryStats
                summary={calendar.summary}
                unitShifts={unitShifts}
            />

            {/* 4. Coverage Alert */}
            <ScheduleCoverageAlert
                schedules={calendar.schedules}
                dayHeaders={calendar.dayHeaders}
                unitShifts={unitShifts}
            />

            {/* 5. Calendar Grid Table */}
            <CalendarGridTable
                employees={employees}
                filteredEmployees={calendar.filteredEmployees}
                dayHeaders={calendar.dayHeaders}
                daysInMonth={calendar.daysInMonth}
                scheduleGrid={calendar.scheduleGrid}
                weeklyViolations={calendar.weeklyViolations}
                fatigueViolations={calendar.fatigueViolations}
                unitShifts={unitShifts}
                draggedCell={calendar.draggedCell}
                dragOverTarget={calendar.dragOverTarget}
                onResetEmployeeMonth={calendar.handleResetEmployeeMonth}
                onCellClick={calendar.handleCellClick}
                onDragStart={calendar.handleDragStart}
                onDragOver={calendar.handleDragOver}
                onDrop={calendar.handleDrop}
                onDragEnd={calendar.handleDragEnd}
            />

            {/* 6. Generate Schedule Modal */}
            <GenerateScheduleModal
                isOpen={calendar.showGenerateModal}
                onClose={() => calendar.setShowGenerateModal(false)}
                generating={calendar.generating}
                onGenerate={calendar.handleGenerate}
                monthLabel={calendar.monthLabel}
                viewMonth={calendar.viewMonth}
                startDate={calendar.viewMonth + '-01'}
                endDate={calendar.viewMonth + '-' + calendar.daysInMonth}
                employees={employees}
                schedules={calendar.schedules}
                patterns={calendar.patterns}
                unitShifts={unitShifts}
                dayHeaders={calendar.dayHeaders}
                selectedPatternId={calendar.selectedPatternId}
                setSelectedPatternId={calendar.setSelectedPatternId}
                selectedEmployeeIds={calendar.selectedEmployeeIds}
                setSelectedEmployeeIds={calendar.setSelectedEmployeeIds}
                staggerOffset={calendar.staggerOffset}
                setStaggerOffset={calendar.setStaggerOffset}
                sundayLockEmpIds={calendar.sundayLockEmpIds}
                setSundayLockEmpIds={calendar.setSundayLockEmpIds}
                autoAlignDayOfWeek={calendar.autoAlignDayOfWeek}
                setAutoAlignDayOfWeek={calendar.setAutoAlignDayOfWeek}
                genPeriodMode={calendar.genPeriodMode}
                setGenPeriodMode={calendar.setGenPeriodMode}
                genCustomStartDate={calendar.genCustomStartDate}
                setGenCustomStartDate={calendar.setGenCustomStartDate}
                genCustomEndDate={calendar.genCustomEndDate}
                setGenCustomEndDate={calendar.setGenCustomEndDate}
                genTargetMonth={calendar.genTargetMonth}
                setGenTargetMonth={calendar.setGenTargetMonth}
                genSearchQuery={calendar.genSearchQuery}
                setGenSearchQuery={calendar.setGenSearchQuery}
                genJabatanFilter={calendar.genJabatanFilter}
                setGenJabatanFilter={calendar.setGenJabatanFilter}
                targetGenStartDate={calendar.targetGenStartDate}
                targetGenEndDate={calendar.targetGenEndDate}
                genMonthLabel={calendar.genMonthLabel}
            />

            {/* 7. Shift Override Modal */}
            <ShiftOverrideModal
                isOpen={calendar.showOverrideModal}
                onClose={() => calendar.setShowOverrideModal(false)}
                overrideCell={calendar.overrideCell}
                unitShifts={unitShifts}
                overrideShiftName={calendar.overrideShiftName}
                setOverrideShiftName={calendar.setOverrideShiftName}
                overrideIsOffDay={calendar.overrideIsOffDay}
                setOverrideIsOffDay={calendar.setOverrideIsOffDay}
                overrideReason={calendar.overrideReason}
                setOverrideReason={calendar.setOverrideReason}
                submittingOverride={calendar.submittingOverride}
                onSaveOverride={calendar.handleSaveOverride}
                onDeleteSchedule={calendar.handleDeleteSchedule}
                getOverrideFatigueWarning={calendar.getOverrideFatigueWarning}
            />

            {/* 8. Import Excel Modal */}
            <ImportScheduleModal
                isOpen={calendar.showImportModal}
                onClose={() => {
                    calendar.setShowImportModal(false);
                    calendar.setImportData(null);
                }}
                daysInMonth={calendar.daysInMonth}
                monthLabel={calendar.monthLabel}
                importing={calendar.importing}
                importData={calendar.importData}
                onDownloadTemplate={handleDownloadTemplate}
                onFileUpload={calendar.handleFileUpload}
                onSaveImportedSchedules={calendar.handleSaveImportedSchedules}
            />
        </div>
    );
};

export default ScheduleCalendarPanel;
