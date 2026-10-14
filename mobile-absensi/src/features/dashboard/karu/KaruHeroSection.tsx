import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { MobileUser } from '../../../types';

interface KaruHeroSectionProps {
  user: MobileUser;
  attendancePercent: number;
  presentToday: number;
  totalEmployees: number;
  offToday: number;
}

export function KaruHeroSection({
  user,
  attendancePercent,
  presentToday,
  totalEmployees,
  offToday,
}: KaruHeroSectionProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroLabelRow}>
        <Text style={styles.kicker}>Dashboard Kepala Ruangan</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🏥 {user.unitName || 'Unit Kerja'}</Text>
        </View>
      </View>
      <Text style={styles.title}>Selamat datang, {user.name}</Text>
      <Text style={styles.subtitle}>{user.jabatan || 'Kepala Unit'}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Persentase Kehadiran Staf Aktif</Text>
          <Text style={styles.progressValue}>{attendancePercent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, attendancePercent))}%`,
                backgroundColor:
                  attendancePercent >= 90 ? '#10b981' : attendancePercent >= 70 ? '#f59e0b' : '#f43f5e',
              },
            ]}
          />
        </View>
        <Text style={styles.progressSub}>
          {presentToday} staf hadir dari {totalEmployees - offToday} staf terjadwal masuk hari ini
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 16,
    gap: 6,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  badge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressSub: {
    fontSize: 11,
    color: colors.muted,
  },
});
