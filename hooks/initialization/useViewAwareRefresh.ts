import { useCallback, useEffect, useRef, MutableRefObject } from 'react';
import { dataService } from '../../services/DataService.ts';
import { useAppDataActions, useAppStore } from '../../stores/appStore.ts';
import { mapAttendanceRecordToUI, sortAttendanceByDateDesc, mapEmployeeFromDatabase } from '../../utils/dataMapping.ts';
import { View, AuthenticatedUser } from '../../types.ts';
import { timed, isOperationalRole } from './types.ts';

const VIEW_NEEDS: Partial<Record<View, Array<'employees' | 'attendance' | 'requests' | 'payslips'>>> = {
    dashboard:                   ['employees', 'attendance', 'requests'],
    'personal-dashboard':        [],
    employees:                   ['employees'],
    attendance:                  ['attendance'],
    'attendance-report':         ['attendance'],
    'employee-attendance-detail':['attendance'],
    payroll:                     [],
    requests:                    ['requests'],
    'unit-schedule':             ['employees'],
};

export const useViewAwareRefresh = (
    authUser: AuthenticatedUser | null,
    mounted: MutableRefObject<boolean>
) => {
    const {
        setEmployees,
        setAttendanceRecords,
        setAllRequests,
        setPayslips,
    } = useAppDataActions();

    const currentView = useAppStore((s) => s.view);
    const viewRef = useRef<View>(currentView);
    useEffect(() => { viewRef.current = currentView; }, [currentView]);

    const refreshEmployees = useCallback(async () => {
        const result = await timed('refresh:employees', () => dataService.getEmployees());
        if (result.success && mounted.current) {
            setEmployees((result.data || []).map(mapEmployeeFromDatabase));
        }
    }, [setEmployees, mounted]);

    const refreshAttendance = useCallback(async () => {
        const result = await timed('refresh:attendance', () => dataService.getAttendance());
        if (result.success && mounted.current) {
            setAttendanceRecords(sortAttendanceByDateDesc((result.data || []).map(mapAttendanceRecordToUI)));
        }
    }, [setAttendanceRecords, mounted]);

    const refreshRequests = useCallback(async () => {
        const result = await timed('refresh:requests', () => dataService.getRequests());
        if (result.success && mounted.current) setAllRequests(result.data || []);
    }, [setAllRequests, mounted]);

    const refreshPayslips = useCallback(async () => {
        const result = await timed('refresh:payslips', () => dataService.getPayslips());
        if (result.success && mounted.current) setPayslips(result.data || []);
    }, [setPayslips, mounted]);

    useEffect(() => {
        if (!authUser || !isOperationalRole(authUser.profile.role)) return;

        let isRefreshing = false;

        const doViewAwareRefresh = async () => {
            if (isRefreshing || !mounted.current) return;

            const view = viewRef.current;
            const needed = VIEW_NEEDS[view];

            if (!needed || needed.length === 0) return;

            isRefreshing = true;
            try {
                const tasks: Promise<void>[] = [];
                if (needed.includes('employees'))  tasks.push(refreshEmployees());
                if (needed.includes('attendance')) tasks.push(refreshAttendance());
                if (needed.includes('requests'))   tasks.push(refreshRequests());
                if (needed.includes('payslips'))   tasks.push(refreshPayslips());
                await Promise.all(tasks);
            } catch { /* silent fail */ } finally {
                isRefreshing = false;
            }
        };

        const intervalId = window.setInterval(doViewAwareRefresh, 15_000);

        const onManualRefresh = () => { void doViewAwareRefresh(); };
        window.addEventListener('hrms:refresh-data', onManualRefresh);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('hrms:refresh-data', onManualRefresh);
        };
    }, [authUser, refreshEmployees, refreshAttendance, refreshRequests, refreshPayslips, mounted]);

    return {
        refreshEmployees,
        refreshAttendance,
        refreshRequests,
        refreshPayslips,
    };
};
