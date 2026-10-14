import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../config/supabase';
import { requestService, type RequestType } from '../../../services/requestService';
import {
  getShiftSwapRequests,
  approveShiftSwapByUnitHead,
  rejectShiftSwapByUnitHead,
} from '../../../services/shiftSwapService';
import type { MobileUser, ShiftSwapRequest } from '../../../types';
import {
  UnitEmployee,
  TodayAttendanceInfo,
  TodayScheduleInfo,
  PendingRequestWithProfile,
} from './types';

export function useKaruDashboardState(user: MobileUser) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState<UnitEmployee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendanceInfo[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<TodayScheduleInfo[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestWithProfile[]>([]);
  const [pendingSwaps, setPendingSwaps] = useState<ShiftSwapRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user.managedUnitId) {
      setLoading(false);
      return;
    }

    try {
      const loadEmps = async (snake: boolean) => {
        const col = snake ? 'unit_kerja_id' : 'unitKerjaId';
        return await supabase
          .from('employees')
          .select('id, nama, jabatan, foto, status')
          .eq(col, user.managedUnitId)
          .neq('status', 'Non-Aktif');
      };

      let empRes = await loadEmps(false);
      if (empRes.error) {
        empRes = await loadEmps(true);
      }
      if (empRes.error) throw new Error(empRes.error.message);
      const emps = (empRes.data || []) as UnitEmployee[];
      setEmployees(emps);

      if (emps.length === 0) {
        setTodayAttendance([]);
        setTodaySchedules([]);
        setPendingRequests([]);
        setPendingSwaps([]);
        return;
      }

      const empIds = emps.map((e) => e.id);
      const today = new Date().toISOString().split('T')[0];

      const loadAtt = async (snake: boolean) => {
        const empCol = snake ? 'employee_id' : 'employeeId';
        const dateCol = snake ? 'date' : 'tanggal';
        return await supabase
          .from('attendance')
          .select('*')
          .in(empCol, empIds)
          .eq(dateCol, today);
      };

      let attRes = await loadAtt(false);
      if (attRes.error) {
        attRes = await loadAtt(true);
      }
      const attList = (attRes.data || []).map((row: any) => ({
        employeeId: row.employeeId || row.employee_id,
        status: row.status,
        clockIn: row.clockIn || row.check_in || undefined,
        clockOut: row.clockOut || row.check_out || undefined,
      }));
      setTodayAttendance(attList);

      const loadScheds = async () => {
        return await supabase
          .from('employee_schedules')
          .select('*')
          .in('employee_id', empIds)
          .eq('schedule_date', today)
          .neq('status', 'cancelled');
      };
      const schedRes = await loadScheds();
      const schedList = (schedRes.data || []).map((row: any) => ({
        employeeId: row.employee_id || row.employeeId,
        shiftName: row.shift_name,
        isOffDay: Boolean(row.is_off_day),
      }));
      setTodaySchedules(schedList);

      const reqList = await requestService.listUnitRequests(user.managedUnitId, 50);
      setPendingRequests(reqList);

      const swapList = await getShiftSwapRequests({ statusFilter: 'pending_unit' });
      const filteredSwaps = swapList.filter(
        (s) => s.requester_employee_id && empIds.includes(s.requester_employee_id)
      );
      setPendingSwaps(filteredSwaps);
    } catch (err: any) {
      console.warn('Error loading Karu dashboard data:', err?.message || err);
      Alert.alert('Gagal Memuat Data', err?.message || 'Koneksi database bermasalah.');
    }
  }, [user.managedUnitId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const handleRequestAction = async (requestId: string, type: RequestType, approve: boolean) => {
    setProcessingId(requestId);
    try {
      const status = approve ? 'Approved' : 'Rejected';
      await requestService.approveOrRejectRequest(requestId, type, status, user);
      Alert.alert('Sukses', `Permohonan berhasil ${approve ? 'disetujui' : 'ditolak'}.`);
      await load();
    } catch (err: any) {
      Alert.alert('Gagal', err?.message || 'Gagal memproses permohonan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSwapAction = async (swapId: string, approve: boolean) => {
    setProcessingId(swapId);
    try {
      if (approve) {
        await approveShiftSwapByUnitHead(swapId, user.employeeId || user.id, 'Disetujui via Mobile');
        Alert.alert('Sukses', 'Pertukaran shift berhasil disetujui.');
      } else {
        await rejectShiftSwapByUnitHead(swapId, user.employeeId || user.id, 'Ditolak via Mobile');
        Alert.alert('Sukses', 'Pertukaran shift berhasil ditolak.');
      }
      await load();
    } catch (err: any) {
      Alert.alert('Gagal', err?.message || 'Gagal memproses pertukaran shift.');
    } finally {
      setProcessingId(null);
    }
  };

  const totalEmployees = employees.length;
  const presentToday = employees.filter((emp) => {
    const att = todayAttendance.find((a) => a.employeeId === emp.id);
    if (!att) return false;
    const st = (att.status || '').toLowerCase();
    return st === 'hadir' || st === 'terlambat' || st === 'recorded' || !!att.clockIn;
  }).length;

  const onLeaveToday = employees.filter((emp) => {
    const att = todayAttendance.find((a) => a.employeeId === emp.id);
    if (!att) return false;
    const st = (att.status || '').toLowerCase();
    return st === 'cuti' || st === 'sakit' || st === 'izin';
  }).length;

  const offToday = employees.filter((emp) => {
    const sched = todaySchedules.find((s) => s.employeeId === emp.id);
    return sched?.isOffDay === true || sched?.shiftName?.toLowerCase() === 'libur';
  }).length;

  const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday - offToday);

  const attendancePercent =
    totalEmployees > 0 ? Math.round((presentToday / (totalEmployees - offToday)) * 100) : 0;

  const pendingCount = pendingRequests.length + pendingSwaps.length;

  return {
    loading,
    refreshing,
    handleRefresh,
    employees,
    todayAttendance,
    todaySchedules,
    pendingRequests,
    pendingSwaps,
    processingId,
    handleRequestAction,
    handleSwapAction,
    totalEmployees,
    presentToday,
    onLeaveToday,
    offToday,
    absentToday,
    attendancePercent,
    pendingCount,
  };
}
