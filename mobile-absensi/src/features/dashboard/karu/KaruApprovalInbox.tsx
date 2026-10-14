import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { AppCard } from '../../../components/AppCard';
import { colors } from '../../../theme/colors';
import { formatDateID } from '../../../utils/date';
import type { ShiftSwapRequest } from '../../../types';
import type { RequestType } from '../../../services/requestService';
import { PendingRequestWithProfile } from './types';

interface KaruApprovalInboxProps {
  pendingCount: number;
  pendingRequests: PendingRequestWithProfile[];
  pendingSwaps: ShiftSwapRequest[];
  processingId: string | null;
  onRequestAction: (requestId: string, type: RequestType, approve: boolean) => void;
  onSwapAction: (swapId: string, approve: boolean) => void;
}

export function KaruApprovalInbox({
  pendingCount,
  pendingRequests,
  pendingSwaps,
  processingId,
  onRequestAction,
  onSwapAction,
}: KaruApprovalInboxProps) {
  return (
    <AppCard title={`📥 Persetujuan Tertunda Unit (${pendingCount})`}>
      {pendingCount === 0 ? (
        <View style={styles.emptyApproval}>
          <Text style={styles.emptyText}>🎉 Semua beres! Tidak ada permohonan pending.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {pendingRequests.map((req) => (
            <View key={req.id} style={styles.approvalItem}>
              <View style={styles.approvalHeader}>
                <View style={styles.avatarContainer}>
                  {req.employeeFoto ? (
                    <Image source={{ uri: req.employeeFoto }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{req.employeeName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.approvalInfo}>
                  <Text style={styles.empName}>{req.employeeName}</Text>
                  <Text style={styles.empRole}>{req.employeeJabatan || 'Staf'}</Text>
                  <Text style={styles.reqDetail}>
                    {req.type === 'Cuti'
                      ? '🌴 Permohonan Cuti'
                      : req.type === 'Reimburse'
                      ? `💵 Reimburse (Rp ${req.amount?.toLocaleString('id-ID')})`
                      : `📋 ${req.type}`}
                  </Text>
                  <Text style={styles.reqDate}>
                    {formatDateID(req.startDate)} s.d. {formatDateID(req.endDate)}
                  </Text>
                  <Text style={styles.reqReason} numberOfLines={2}>
                    "{req.reason}"
                  </Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, styles.rejectBtn]}
                  disabled={processingId !== null}
                  onPress={() => onRequestAction(req.id, req.type, false)}
                >
                  <Text style={styles.rejectBtnText}>Tolak</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.approveBtn]}
                  disabled={processingId !== null}
                  onPress={() => onRequestAction(req.id, req.type, true)}
                >
                  {processingId === req.id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.approveBtnText}>Setujui</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))}

          {pendingSwaps.map((swap) => (
            <View key={swap.id} style={styles.approvalItem}>
              <View style={styles.approvalHeader}>
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.infoBg }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>🔄</Text>
                  </View>
                </View>
                <View style={styles.approvalInfo}>
                  <Text style={styles.empName}>{swap.requester_employee?.nama || 'Staf'}</Text>
                  <Text style={styles.empRole}>Mengajukan Tukar Shift dengan {swap.target_employee?.nama}</Text>
                  <Text style={styles.reqDetail}>
                    Jadwal: {swap.requester_schedule?.schedule_date} ({swap.requester_schedule?.shift_name}) ⇌{' '}
                    {swap.target_schedule?.schedule_date} ({swap.target_schedule?.shift_name})
                  </Text>
                  <Text style={styles.reqReason} numberOfLines={2}>
                    Alasan: "{swap.reason}"
                  </Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, styles.rejectBtn]}
                  disabled={processingId !== null}
                  onPress={() => onSwapAction(swap.id, false)}
                >
                  <Text style={styles.rejectBtnText}>Tolak</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.approveBtn]}
                  disabled={processingId !== null}
                  onPress={() => onSwapAction(swap.id, true)}
                >
                  {processingId === swap.id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.approveBtnText}>Setujui</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  emptyApproval: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  listContainer: {
    gap: 16,
  },
  approvalItem: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  approvalHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  approvalInfo: {
    flex: 1,
    gap: 2,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  empRole: {
    fontSize: 11,
    color: colors.muted,
  },
  reqDetail: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  reqDate: {
    fontSize: 11,
    color: colors.muted,
  },
  reqReason: {
    fontSize: 11,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
  },
  rejectBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 12,
  },
  approveBtn: {
    backgroundColor: colors.primary,
  },
  approveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
});
