import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { AppCard } from '../../../components/AppCard';
import { colors } from '../../../theme/colors';
import type { AttendanceRecord, CheckInDraft } from '../../../types';

interface AttendanceActionCardProps {
  hasCheckedOut: boolean;
  draft: CheckInDraft | null;
  todayRecord?: AttendanceRecord;
  busy: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function AttendanceActionCard({
  hasCheckedOut,
  draft,
  todayRecord,
  busy,
  onCheckIn,
  onCheckOut,
}: AttendanceActionCardProps) {
  return (
    <AppCard title="Aksi Absensi">
      {hasCheckedOut ? (
        <View style={styles.actionGroup}>
          <Text style={[styles.detailsText, { color: colors.success, fontWeight: '700', fontSize: 16 }]}>
            ✓ Absensi Hari Ini Selesai
          </Text>
          <Text style={styles.detailsText}>
            Check-in: {todayRecord?.clockIn || draft?.clockIn || '-'} • Check-out:{' '}
            {todayRecord?.clockOut || 'Selesai'}
          </Text>
        </View>
      ) : !draft ? (
        <AppButton title={busy ? 'Memproses...' : 'Check In'} onPress={onCheckIn} loading={busy} />
      ) : (
        <View style={styles.actionGroup}>
          <Text style={styles.detailsText}>
            Check-in {draft.clockIn} • {draft.location}
          </Text>
          <AppButton title={busy ? 'Menyimpan...' : 'Check Out'} onPress={onCheckOut} loading={busy} />
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionGroup: {
    gap: 12,
  },
  detailsText: {
    color: colors.muted,
    fontSize: 14,
  },
});
