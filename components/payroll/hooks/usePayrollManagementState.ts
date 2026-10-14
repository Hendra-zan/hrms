import { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, Payslip } from '../../../types.ts';
import { calculatePayslip, buildPayrollConfig } from '../../../services/payrollService.ts';
import { useAuth, useUI, useAppData, useAppDataActions } from '../../../stores/appStore.ts';
import { canManagePayroll, ensurePortalAccess } from '../../../services/portalAccessService.ts';
import { createAuditLog } from '../../../services/auditLogService.ts';
import { dataService } from '../../../services/DataService.ts';
import { EmployeePayrollItem, PayrollStats } from '../types.ts';

export const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const usePayrollManagementState = (
    employees: Employee[],
    attendanceRecords: AttendanceRecord[]
) => {
    const { authUser } = useAuth();
    const { activePortal } = useUI();
    const { systemSettings, payslips } = useAppData();
    const { setPayslips } = useAppDataActions();

    const payrollConfig = useMemo(() => buildPayrollConfig(systemSettings), [systemSettings]);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'published' | 'draft' | 'incomplete'>('all');
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'late_desc' | 'overtime_desc'>('name_asc');

    // Payslip modal states
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);
    const [isPayslipOpen, setIsPayslipOpen] = useState(false);

    const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);

    // Unique departments
    const departmentsList = useMemo(() => {
        const set = new Set<string>();
        employees.forEach(emp => {
            if (emp.departemen) set.add(emp.departemen);
        });
        return Array.from(set).sort();
    }, [employees]);

    // Calculate payroll data for all employees
    const allEmployeePayrollData = useMemo<EmployeePayrollItem[]>(() => {
        return employees.map(employee => {
            const period = `${MONTHS[selectedMonth]} ${selectedYear}`;
            const attendanceForPeriod = attendanceRecords.filter(record => {
                const recordDate = new Date(record.tanggal);
                return record.employeeId === employee.id &&
                       recordDate.getMonth() === selectedMonth &&
                       recordDate.getFullYear() === selectedYear;
            });

            const totalHours = attendanceForPeriod.reduce((acc, rec) => {
                if (!rec.clockIn || !rec.clockOut) return acc;
                const [inH, inM] = rec.clockIn.split(':').map(Number);
                const [outH, outM] = rec.clockOut.split(':').map(Number);
                let outTime = outH + outM / 60;
                const inTime = inH + inM / 60;
                if (outTime < inTime) outTime += 24;
                return acc + (outTime - inTime);
            }, 0);

            const totalOvertime = attendanceForPeriod.reduce((acc, rec) => acc + (rec.overtimeHours || 0), 0);
            const totalLate = attendanceForPeriod.filter(rec => rec.isLate).length;
            const savedPayslip = payslips.find(p => p.employeeId === employee.id && p.periode === period);
            const isSaved = !!savedPayslip;

            return {
                ...employee,
                totalHours: totalHours.toFixed(2),
                totalHoursNum: totalHours,
                totalOvertime: totalOvertime.toFixed(2),
                totalOvertimeNum: totalOvertime,
                totalLate,
                attendanceForPeriod,
                savedPayslip,
                isSaved,
            };
        });
    }, [employees, attendanceRecords, selectedMonth, selectedYear, payslips]);

    // Summary Statistics
    const stats = useMemo<PayrollStats>(() => {
        const total = allEmployeePayrollData.length;
        const published = allEmployeePayrollData.filter(e => e.isSaved).length;
        const draft = allEmployeePayrollData.filter(e => !e.isSaved && !!e.compensation).length;
        const incomplete = allEmployeePayrollData.filter(e => !e.compensation).length;
        return { total, published, draft, incomplete };
    }, [allEmployeePayrollData]);

    // Filtered & Sorted Rows
    const filteredEmployeePayrollData = useMemo(() => {
        return allEmployeePayrollData.filter(emp => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = emp.nama?.toLowerCase().includes(q);
                const matchNik = (emp as any).nik?.toLowerCase().includes(q);
                const matchEmail = emp.email?.toLowerCase().includes(q);
                const matchJabatan = emp.jabatan?.toLowerCase().includes(q);
                const matchDept = emp.departemen?.toLowerCase().includes(q);
                if (!matchName && !matchNik && !matchEmail && !matchJabatan && !matchDept) return false;
            }

            if (selectedDepartment !== 'all' && emp.departemen !== selectedDepartment) {
                return false;
            }

            if (selectedStatusFilter === 'published' && !emp.isSaved) return false;
            if (selectedStatusFilter === 'draft' && (emp.isSaved || !emp.compensation)) return false;
            if (selectedStatusFilter === 'incomplete' && !!emp.compensation) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'name_asc') return a.nama.localeCompare(b.nama);
            if (sortBy === 'name_desc') return b.nama.localeCompare(a.nama);
            if (sortBy === 'late_desc') return b.totalLate - a.totalLate;
            if (sortBy === 'overtime_desc') return b.totalOvertimeNum - a.totalOvertimeNum;
            return 0;
        });
    }, [allEmployeePayrollData, searchQuery, selectedDepartment, selectedStatusFilter, sortBy]);

    const handleGeneratePayslip = async (employeeData: EmployeePayrollItem) => {
        const portalError = ensurePortalAccess(activePortal, 'operational', 'Generate slip gaji');
        if (portalError) {
            alert(portalError);
            return;
        }

        if (!canManagePayroll(authUser?.profile.role)) {
            alert('Role Anda tidak memiliki izin membuat slip gaji.');
            return;
        }

        if (!employeeData.compensation) {
            alert(`Data kompensasi untuk ${employeeData.nama} tidak lengkap.`);
            return;
        }
        const period = `${MONTHS[selectedMonth]} ${selectedYear}`;
        const payslip = employeeData.savedPayslip || calculatePayslip(employeeData, employeeData.attendanceForPeriod, period, payrollConfig);
        setSelectedPayslip(payslip);
        setSelectedEmployeeForPayslip(employeeData);
        setIsPayslipOpen(true);

        if (!employeeData.isSaved) {
            void createAuditLog({
                action: 'CREATE',
                entityType: 'payroll',
                entityId: payslip.id,
                entityName: employeeData.nama,
                newData: {
                    employeeId: employeeData.id,
                    period,
                    totalPendapatan: payslip.totalPendapatan,
                    gajiBersih: payslip.gajiBersih,
                },
                description: `Generate draft slip gaji ${employeeData.nama} periode ${period}`,
                portalType: 'operational',
                metadata: { source: 'PayrollManagement.handleGeneratePayslip' },
            });
        }
    };

    const handleSavePayslip = async (payslip: Payslip) => {
        if (!confirm('Apakah Anda yakin ingin mengunci dan menerbitkan slip gaji ini? Setelah diterbitkan, data slip gaji bersifat permanen dan tidak akan terpengaruh jika ada penyesuaian gaji di masa depan.')) {
            return;
        }

        try {
            const response = await dataService.savePayslip(payslip);
            if (response.success && response.data) {
                setPayslips(prev => [...prev.filter(p => p.id !== response.data!.id), response.data!]);
                setSelectedPayslip(response.data!);

                await createAuditLog({
                    action: 'CREATE',
                    entityType: 'payroll',
                    entityId: response.data!.id,
                    entityName: selectedEmployeeForPayslip?.nama || 'Karyawan',
                    newData: {
                        employeeId: response.data!.employeeId,
                        period: response.data!.periode,
                        totalPendapatan: response.data!.totalPendapatan,
                        gajiBersih: response.data!.gajiBersih,
                    },
                    description: `Kunci & Terbitkan slip gaji ${selectedEmployeeForPayslip?.nama || ''} periode ${response.data!.periode}`,
                    portalType: 'operational',
                    metadata: { source: 'PayrollManagement.handleSavePayslip' },
                });

                alert('✅ Slip gaji berhasil dikunci dan diterbitkan secara permanen.');
            } else {
                alert(`Gagal menyimpan slip gaji: ${response.error}`);
            }
        } catch (error: any) {
            alert(`Terjadi kesalahan: ${error.message}`);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedDepartment('all');
        setSelectedStatusFilter('all');
        setSortBy('name_asc');
    };

    const hasActiveFilters = searchQuery !== '' || selectedDepartment !== 'all' || selectedStatusFilter !== 'all' || sortBy !== 'name_asc';

    return {
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
        setSelectedPayslip,
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
    };
};
