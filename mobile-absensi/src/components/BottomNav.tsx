import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import type { AttendanceTab } from '../types';

const navItems: Array<{ key: AttendanceTab; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { key: 'dashboard', label: 'Beranda', icon: 'home' },
  { key: 'attendance', label: 'Absensi', icon: 'clock' },
  // { key: 'chat', label: 'Chat', icon: 'message-square' },
  { key: 'schedule', label: 'Jadwal & Izin', icon: 'calendar' },
  { key: 'profile', label: 'Profil', icon: 'user' },
];

interface BottomNavProps {
  value: AttendanceTab;
  onChange: (tab: AttendanceTab) => void;
  /** Badge counter per-tab (mis. { requests: 2 }). Nilai 0/undefined = tidak tampil. */
  badges?: Partial<Record<AttendanceTab, number>>;
}

export function BottomNav({ value, onChange, badges }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets?.bottom ? Math.max(insets.bottom, 10) : 10 }]}>
      {navItems.map((item) => {
        const active = item.key === value;
        const count = badges?.[item.key] ?? 0;
        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={[styles.item, active && styles.itemActive]}>
            <View style={styles.iconWrap}>
              <Feather 
                name={item.icon} 
                size={20} 
                color={active ? colors.primary : colors.muted} 
              />
              {count > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 16,
  },
  itemActive: {
    backgroundColor: '#ecf6f4',
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.primary,
  },
  iconWrap: {
    position: 'relative',
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e23c3c',
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
