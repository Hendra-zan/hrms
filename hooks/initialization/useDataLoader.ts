import { useCallback } from 'react';
import { dataService } from '../../services/DataService.ts';
import { useAppDataActions } from '../../stores/appStore.ts';
import { mapAttendanceRecordToUI, sortAttendanceByDateDesc, mapEmployeeFromDatabase } from '../../utils/dataMapping.ts';
import { timed, normalizeRole } from './types.ts';

export const useDataLoader = () => {
    const {
        setEmployees,
        setAttendanceRecords,
        setAllRequests,
        setDocuments,
        setPayslips,
    } = useAppDataActions();

    const loadAdminData = useCallback(async () => {
        const employeesResult = await timed('admin:employees', () => dataService.getEmployees());
        if (!employeesResult.success) {
            throw new Error(`Gagal mengambil data karyawan: ${employeesResult.error}`);
        }

        const employeesWithCompensation = (employeesResult.data || []).map((emp) =>
            mapEmployeeFromDatabase(emp)
        );
        setEmployees(employeesWithCompensation);

        // Limit initial attendance load to the last 30 days to prevent high memory usage and latency
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
        const endDateStr = new Date().toISOString().split('T')[0];

        const [attendanceResult, requestsResult, documentsResult, payslipsResult] = await Promise.all([
            timed('admin:attendance', () => dataService.getAttendance({ startDate: startDateStr, endDate: endDateStr })),
            timed('admin:requests', () => dataService.getRequests()),
            timed('admin:documents', () => dataService.getDocuments()),
            timed('admin:payslips', () => dataService.getPayslips()),
        ]);

        if (!attendanceResult.success) {
            throw new Error(`Gagal mengambil data kehadiran: ${attendanceResult.error}`);
        }
        if (!payslipsResult.success) {
            throw new Error(`Gagal mengambil data slip gaji: ${payslipsResult.error}`);
        }

        setAttendanceRecords(sortAttendanceByDateDesc((attendanceResult.data || []).map(mapAttendanceRecordToUI)));
        setAllRequests(requestsResult.data || []);
        setDocuments(documentsResult.data || []);
        setPayslips(payslipsResult.data || []);
    }, [setEmployees, setAttendanceRecords, setAllRequests, setDocuments, setPayslips]);

    const loadEmployeeData = useCallback(
        async (employeeId: string, profile: any) => {
            const mappedProfile = mapEmployeeFromDatabase({
                ...profile,
                compensation: {
                    gajiPokok: profile.gajiPokok || 0,
                    tunjanganProfesi: profile.tunjanganProfesi || 0,
                },
            });

            const isKR = normalizeRole(profile.role) === 'kepala_ruangan';
            const unitId = mappedProfile.unitKerjaId || (profile as any).unit_kerja_id;

            if (isKR && unitId) {
                const unitEmployeesResult = await timed('kr:unitEmployees', () =>
                    dataService.getEmployeesByUnit(unitId)
                );

                const unitEmployees = (unitEmployeesResult.data || []).map((emp: any) =>
                    mapEmployeeFromDatabase({
                        ...emp,
                        compensation: { gajiPokok: emp.gajiPokok || 0, tunjanganProfesi: emp.tunjanganProfesi || 0 },
                    })
                );
                setEmployees(unitEmployees.length > 0 ? unitEmployees : [mappedProfile]);

                const unitEmployeeIds = unitEmployees.map((e: any) => e.id as string);
                const [attendanceResult, requestsResult, documentsResult, payslipsResult] = await Promise.all([
                    timed('kr:attendance', () => dataService.getAttendance()),
                    timed('kr:requests', () => dataService.getRequests({ employeeId })),
                    timed('kr:documents', () => dataService.getDocuments({ employeeId })),
                    timed('kr:payslips', () => dataService.getPayslipsByEmployee(employeeId)),
                ]);

                const allAttendance = (attendanceResult.data || []).map(mapAttendanceRecordToUI);
                const unitAttendance = unitEmployeeIds.length > 0
                    ? allAttendance.filter((r: any) => unitEmployeeIds.includes(r.employeeId || r.employee_id))
                    : allAttendance;

                setAttendanceRecords(sortAttendanceByDateDesc(unitAttendance));
                setAllRequests(requestsResult.data || []);
                setDocuments(documentsResult.data || []);
                setPayslips(payslipsResult.data || []);
            } else {
                setEmployees([mappedProfile]);

                const [attendanceResult, requestsResult, documentsResult, payslipsResult] = await Promise.all([
                    timed('employee:attendance', () => dataService.getAttendance({ employeeId })),
                    timed('employee:requests', () => dataService.getRequests({ employeeId })),
                    timed('employee:documents', () => dataService.getDocuments({ employeeId })),
                    timed('employee:payslips', () => dataService.getPayslipsByEmployee(employeeId)),
                ]);

                if (!attendanceResult.success) {
                    throw new Error(`Gagal mengambil data kehadiran karyawan: ${attendanceResult.error}`);
                }
                if (!requestsResult.success) {
                    throw new Error(`Gagal mengambil data permohonan karyawan: ${requestsResult.error}`);
                }
                if (!documentsResult.success) {
                    throw new Error(`Gagal mengambil data dokumen karyawan: ${documentsResult.error}`);
                }
                if (!payslipsResult.success) {
                    throw new Error(`Gagal mengambil data slip gaji karyawan: ${payslipsResult.error}`);
                }

                setAttendanceRecords(sortAttendanceByDateDesc((attendanceResult.data || []).map(mapAttendanceRecordToUI)));
                setAllRequests(requestsResult.data || []);
                setDocuments(documentsResult.data || []);
                setPayslips(payslipsResult.data || []);
            }
        },
        [setEmployees, setAttendanceRecords, setAllRequests, setDocuments, setPayslips]
    );

    return {
        loadAdminData,
        loadEmployeeData,
    };
};
