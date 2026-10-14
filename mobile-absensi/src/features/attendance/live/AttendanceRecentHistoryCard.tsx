import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../components/AppCard';
import { colors } from '../../../theme/colors';
import { formatDateID } from '../../../utils/date';
import type { AttendanceRecord } from '../../../types';

interface AttendanceRecentHistoryCardProps {
  records: AttendanceRecord[];
}

export function AttendanceRecentHistoryCard({ records }: AttendanceRecentHistoryCardProps) {
  return (
    <AppCard title="Riwayat 5 Terakhir">
      {records.slice(0, 5).map((item) => (
        <View key={item.id} style={styles.historyRow}>
          <View>
            <Text style={styles.historyDate}>{formatDateID(item.tanggal)}</Text>
            <Text style={styles.historyText}>
              {item.clockIn} - {item.clockOut || '-'}
            </Text>
          </View>
          <Text style={[styles.badge, { color: item.isLate ? colors.warning : colors.success }]}>
            {item.isLate ? 'Terlambat' : 'Tepat Waktu'}
          </Text>
        </View>
      ))}
      {records.length === 0 ? <Text style={styles.noHistory}>Belum ada riwayat absensi.</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  historyText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    fontWeight: '800',
  },
  noHistory: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 14,
  },
});
