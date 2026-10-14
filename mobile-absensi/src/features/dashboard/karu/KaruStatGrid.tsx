import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface KaruStatGridProps {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  absentToday: number;
}

export function KaruStatGrid({
  totalEmployees,
  presentToday,
  onLeaveToday,
  absentToday,
}: KaruStatGridProps) {
  return (
    <View style={styles.grid}>
      <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
        <Feather name="users" size={18} color="#ffffff" style={styles.statIcon} />
        <Text style={styles.statVal}>{totalEmployees}</Text>
        <Text style={styles.statLbl}>Total Staf</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
        <Feather name="check-circle" size={18} color="#ffffff" style={styles.statIcon} />
        <Text style={styles.statVal}>{presentToday}</Text>
        <Text style={styles.statLbl}>Hadir</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
        <Feather name="coffee" size={18} color="#ffffff" style={styles.statIcon} />
        <Text style={styles.statVal}>{onLeaveToday}</Text>
        <Text style={styles.statLbl}>Cuti/Izin</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#f43f5e' }]}>
        <Feather name="alert-triangle" size={18} color="#ffffff" style={styles.statIcon} />
        <Text style={styles.statVal}>{absentToday}</Text>
        <Text style={styles.statLbl}>Belum Absen</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    flexBasis: '45%',
    minWidth: 140,
    padding: 12,
    borderRadius: 14,
    position: 'relative',
    gap: 4,
  },
  statIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    opacity: 0.3,
  },
  statVal: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  statLbl: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.9,
    fontWeight: '600',
  },
});
