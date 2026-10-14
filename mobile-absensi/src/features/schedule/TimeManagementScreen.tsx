import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ScheduleScreen } from './ScheduleScreen';
import { RequestsScreen } from '../requests/RequestsScreen';
import { colors } from '../../theme/colors';
import type { MobileUser } from '../../types';
import type { LeaveRequest } from '../../services/requestService';

interface TimeManagementScreenProps {
  user: MobileUser;
  onRequestsChange?: (list: LeaveRequest[]) => void;
  initialTab?: 'schedule' | 'requests';
}

export function TimeManagementScreen({ user, onRequestsChange, initialTab = 'schedule' }: TimeManagementScreenProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'requests'>(initialTab);

  return (
    <View style={styles.container}>
      {/* Segmented Control Bar */}
      <View style={styles.segmentContainer}>
        <Pressable
          onPress={() => setActiveTab('schedule')}
          style={[styles.segmentButton, activeTab === 'schedule' && styles.segmentButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'schedule' }}
        >
          <Text style={[styles.segmentText, activeTab === 'schedule' && styles.segmentTextActive]}>
            Jadwal Shift
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('requests')}
          style={[styles.segmentButton, activeTab === 'requests' && styles.segmentButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'requests' }}
        >
          <Text style={[styles.segmentText, activeTab === 'requests' && styles.segmentTextActive]}>
            Izin & Cuti
          </Text>
        </Pressable>
      </View>

      {/* Dynamic Screen Area */}
      <View style={styles.contentArea}>
        {activeTab === 'schedule' ? (
          <ScheduleScreen user={user} />
        ) : (
          <RequestsScreen user={user} onListChange={onRequestsChange} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  contentArea: {
    flex: 1,
  },
});
