import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../components/AppCard';
import { colors } from '../../../theme/colors';
import { UnitEmployee, TodayScheduleInfo, TodayAttendanceInfo } from './types';

interface KaruTodayScheduleTableProps {
  employees: UnitEmployee[];
  todaySchedules: TodayScheduleInfo[];
  todayAttendance: TodayAttendanceInfo[];
}

export function KaruTodayScheduleTable({
  employees,
  todaySchedules,
  todayAttendance,
}: KaruTodayScheduleTableProps) {
  return (
    <AppCard title="📅 Jadwal Staf Unit Hari Ini">
      {employees.length === 0 ? (
        <Text style={styles.mutedText}>Tidak ada staf terdaftar di unit ini.</Text>
      ) : (
        <View style={styles.table}>
          {employees.map((emp) => {
            const sched = todaySchedules.find((s) => s.employeeId === emp.id);
            const att = todayAttendance.find((a) => a.employeeId === emp.id);
            const isOff = sched?.isOffDay === true || sched?.shiftName?.toLowerCase() === 'libur';

            let statusText = 'Belum Absen';
            let statusColor = colors.danger;
            if (isOff) {
              statusText = 'Libur';
              statusColor = colors.muted;
            } else if (att) {
              statusText = att.status === 'Terlambat' ? 'Terlambat' : 'Hadir';
              statusColor = att.status === 'Terlambat' ? colors.warning : colors.success;
            }

            return (
              <View key={emp.id} style={styles.tableRow}>
                <View style={styles.tableEmpInfo}>
                  <Text style={styles.tableEmpName}>{emp.nama}</Text>
                  <Text style={styles.tableEmpSub}>{emp.jabatan || 'Staf'}</Text>
                </View>
                <View style={styles.tableStatusCol}>
                  <Text style={styles.tableShift}>{sched ? sched.shiftName : 'Tidak Terjadwal'}</Text>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusIndicatorText, { color: statusColor }]}>
                      {statusText} {att?.clockIn ? `(${att.clockIn.slice(0, 5)})` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  table: {
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableEmpInfo: {
    flex: 1,
    gap: 2,
  },
  tableEmpName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tableEmpSub: {
    fontSize: 11,
    color: colors.muted,
  },
  tableStatusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tableShift: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mutedText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
