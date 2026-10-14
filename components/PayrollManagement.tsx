import React from 'react';
import { Employee, AttendanceRecord } from '../types.ts';
import PayslipDetail from './PayslipDetail.tsx';
import { useAppData } from '../stores/appStore.ts';
import {
    usePayrollManagementState,
    PayrollSummaryCards,
    PayrollFilterToolbar,
    PayrollTable,
    MONTHS,
} from './payroll/index.ts';

interface PayrollManagementProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
}

const PayrollManagement: React.FC<PayrollManagementProps> = ({ employees, attendanceRecords }) => {
    const { payslips } = useAppData();
    const {
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        searchQuery,
        setSearchQuery,
        selectedDepartment,
        setSelectedDepartment,
        selectedStatusFilter,
        setSelectedStatusFilter,
        sortBy,
        setSortBy,
        selectedPayslip,
        selectedEmployeeForPayslip,
        isPayslipOpen,
        setIsPayslipOpen,
        years,
        departmentsList,
        stats,
        filteredEmployeePayrollData,
        hasActiveFilters,
        clearFilters,
        handleGeneratePayslip,
        handleSavePayslip,
    } = usePayrollManagementState(employees, attendanceRecords);

    return (
        <>
            <div className="space-y-6">
                <PayrollSummaryCards
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    setSelectedMonth={setSelectedMonth}
                    setSelectedYear={setSelectedYear}
                    years={years}
                    stats={stats}
                    selectedStatusFilter={selectedStatusFilter}
                    setSelectedStatusFilter={setSelectedStatusFilter}
                />

                <PayrollFilterToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={setSelectedDepartment}
                    selectedStatusFilter={selectedStatusFilter}
                    setSelectedStatusFilter={setSelectedStatusFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    departmentsList={departmentsList}
                    totalEmployeesCount={employees.length}
                    filteredEmployeesCount={filteredEmployeePayrollData.length}
                    totalPayrollCount={stats.total}
                    publishedCount={stats.published}
                    draftCount={stats.draft}
                    incompleteCount={stats.incomplete}
                    hasActiveFilters={hasActiveFilters}
                    clearFilters={clearFilters}
                />

                <PayrollTable
                    filteredEmployeePayrollData={filteredEmployeePayrollData}
                    handleGeneratePayslip={handleGeneratePayslip}
                    hasActiveFilters={hasActiveFilters}
                    clearFilters={clearFilters}
                />
            </div>

            <PayslipDetail
                isOpen={isPayslipOpen}
                onClose={() => setIsPayslipOpen(false)}
                payslip={selectedPayslip}
                employee={selectedEmployeeForPayslip}
                onSave={handleSavePayslip}
                isSaved={selectedEmployeeForPayslip ? payslips.some(p => p.employeeId === selectedEmployeeForPayslip.id && p.periode === `${MONTHS[selectedMonth]} ${selectedYear}`) : false}
            />
        </>
    );
};

export default PayrollManagement;
