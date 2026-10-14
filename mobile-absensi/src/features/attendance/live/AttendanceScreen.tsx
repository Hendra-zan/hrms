import React from 'react';
import { Screen } from '../../../components/Screen';
import { LiveLivenessModal } from '../../../components/LiveLivenessModal';
import { useConnectivity } from '../../../hooks/useConnectivity';
import { AttendanceScreenProps } from './types';
import { useAttendanceActions } from './useAttendanceActions';
import { AttendanceStatusCard } from './AttendanceStatusCard';
import { AttendanceActionCard } from './AttendanceActionCard';
import { AttendanceRecentHistoryCard } from './AttendanceRecentHistoryCard';

export function AttendanceScreen({ user, records, onRefresh }: AttendanceScreenProps) {
  const { isLanReachable, isChecking } = useConnectivity();
  const {
    draft,
    busy,
    sessionCheckedOut,
    deviceInfo,
    biometricStatus,
    liveVisible,
    finishLive,
    checkIn,
    checkOut,
    today,
  } = useAttendanceActions(user, records, onRefresh);

  const todayRecord = records.find((r) => r.tanggal === today);
  const hasCheckedOut = !!(todayRecord && todayRecord.clockOut) || sessionCheckedOut;

  return (
    <Screen>
      <AttendanceStatusCard
        user={user}
        deviceInfo={deviceInfo}
        biometricStatus={biometricStatus}
        isLanReachable={isLanReachable}
        isChecking={isChecking}
      />

      <AttendanceActionCard
        hasCheckedOut={hasCheckedOut}
        draft={draft}
        todayRecord={todayRecord}
        busy={busy}
        onCheckIn={checkIn}
        onCheckOut={checkOut}
      />

      <AttendanceRecentHistoryCard records={records} />

      <LiveLivenessModal
        visible={liveVisible}
        onComplete={(uri) => finishLive(uri)}
        onCancel={() => finishLive(null)}
      />
    </Screen>
  );
}
