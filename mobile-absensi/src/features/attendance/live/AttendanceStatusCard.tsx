import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../components/AppCard';
import { colors } from '../../../theme/colors';
import type { DeviceInfo, MobileUser } from '../../../types';

interface AttendanceStatusCardProps {
  user: MobileUser;
  deviceInfo: DeviceInfo | null;
  biometricStatus: string;
  isLanReachable: boolean;
  isChecking: boolean;
}

export function AttendanceStatusCard({
  user,
  deviceInfo,
  biometricStatus,
  isLanReachable,
  isChecking,
}: AttendanceStatusCardProps) {
  return (
    <AppCard title="Status Absensi">
      <View style={styles.infoRow}>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Karyawan</Text>
          <Text style={styles.infoValue}>{user.name}</Text>
        </View>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Unit</Text>
          <Text style={styles.infoValue}>{user.unitName || '-'}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Device</Text>
          <Text style={styles.infoValue}>{deviceInfo?.deviceName || 'Memuat...'}</Text>
        </View>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Biometrik</Text>
          <Text style={styles.infoValue}>{biometricStatus}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Jaringan</Text>
          <Text style={[styles.infoValue, { color: isLanReachable ? colors.success : colors.danger }]}>
            {isChecking ? 'Memeriksa...' : isLanReachable ? 'LAN RS aktif' : 'LAN RS tidak tersedia'}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  infoGroup: {
    flex: 1,
    minWidth: 140,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
