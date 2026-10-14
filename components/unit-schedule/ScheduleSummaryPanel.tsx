import React from 'react';
import LoadingSpinner from '../LoadingSpinner.tsx';
import {
    ScheduleSummaryPanelProps,
    useScheduleSummaryState,
    ScheduleSummaryToolbar,
    ShiftDistributionKpiCards,
    EmployeeWorkHoursTable,
} from './summary';

export const ScheduleSummaryPanel: React.FC<ScheduleSummaryPanelProps> = ({
    unitId,
    unitShifts,
    employees,
    onNotify,
}) => {
    const summary = useScheduleSummaryState(unitId, unitShifts, employees, onNotify);

    if (summary.loading && summary.statsList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <LoadingSpinner size="large" />
                <p className="text-gray-500 text-sm animate-pulse">Menghitung analisis keadilan & K3 shift...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-6">
            {/* 1. Filter Toolbar */}
            <ScheduleSummaryToolbar
                viewMonth={summary.viewMonth}
                setViewMonth={summary.setViewMonth}
                monthLabel={summary.monthLabel}
                periodMode={summary.periodMode}
                setPeriodMode={summary.setPeriodMode}
                availableJabatanList={summary.availableJabatanList}
                selectedJabatan={summary.selectedJabatan}
                setSelectedJabatan={summary.setSelectedJabatan}
                totalEmployees={employees.length}
                searchQuery={summary.searchQuery}
                setSearchQuery={summary.setSearchQuery}
                onExportExcel={summary.handleExportExcel}
            />

            {/* 2. Executive Summary KPI Metric Cards */}
            <ShiftDistributionKpiCards
                unitFairnessScore={summary.unitFairnessScore}
                overallUnitAvg={summary.overallUnitAvg}
                periodLabel={summary.periodLabel}
                statsList={summary.statsList}
            />

            {/* 3. Detail Employee Work Hours & Fairness Table */}
            <EmployeeWorkHoursTable
                periodLabel={summary.periodLabel}
                searchQuery={summary.searchQuery}
                setSearchQuery={summary.setSearchQuery}
                sortField={summary.sortField}
                sortOrder={summary.sortOrder}
                onSort={summary.handleSort}
                processedList={summary.processedList}
            />
        </div>
    );
};

export default ScheduleSummaryPanel;
