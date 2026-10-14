import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Screen } from '../../../components/Screen';
import { colors } from '../../../theme/colors';
import { KaruDashboardScreenProps } from './types';
import { useKaruDashboardState } from './useKaruDashboardState';
import { KaruHeroSection } from './KaruHeroSection';
import { KaruStatGrid } from './KaruStatGrid';
import { KaruApprovalInbox } from './KaruApprovalInbox';
import { KaruTodayScheduleTable } from './KaruTodayScheduleTable';

export function KaruDashboardScreen({ user }: KaruDashboardScreenProps) {
  const {
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
  } = useKaruDashboardState(user);

  if (loading) {
    return (
      <Screen scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat dashboard unit...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
      }
    >
      <KaruHeroSection
        user={user}
        attendancePercent={attendancePercent}
        presentToday={presentToday}
        totalEmployees={totalEmployees}
        offToday={offToday}
      />

      <KaruStatGrid
        totalEmployees={totalEmployees}
        presentToday={presentToday}
        onLeaveToday={onLeaveToday}
        absentToday={absentToday}
      />

      <KaruApprovalInbox
        pendingCount={pendingCount}
        pendingRequests={pendingRequests}
        pendingSwaps={pendingSwaps}
        processingId={processingId}
        onRequestAction={handleRequestAction}
        onSwapAction={handleSwapAction}
      />

      <KaruTodayScheduleTable
        employees={employees}
        todaySchedules={todaySchedules}
        todayAttendance={todayAttendance}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
  },
});
