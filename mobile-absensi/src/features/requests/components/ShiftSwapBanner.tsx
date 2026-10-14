import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ShiftSwapRequest } from '../../../types';
import { formatDateID } from '../../../utils/date';

interface ShiftSwapBannerProps {
    shiftSwaps: ShiftSwapRequest[];
    currentEmployeeId: string;
    onPeerRespond: (swapId: string, approve: boolean) => void;
}

export const ShiftSwapBanner: React.FC<ShiftSwapBannerProps> = ({
    shiftSwaps,
    currentEmployeeId,
    onPeerRespond,
}) => {
    const pendingMyPeerSwaps = shiftSwaps.filter(
        (s) => s.target_employee_id === currentEmployeeId && (s.peer_status === 'pending' || s.overall_status === 'pending_peer')
    );

    if (pendingMyPeerSwaps.length === 0) return null;

    return (
        <View style={styles.swapRequestBanner}>
            <Text style={styles.swapBannerTitle}>🔄 Permintaan Tukar Shift Menunggu Respon Anda</Text>
            {pendingMyPeerSwaps.map((s) => (
                <View key={s.id} style={styles.swapCard}>
                    <Text style={styles.swapCardText}>
                        <Text style={{ fontWeight: '800' }}>{s.requester_employee?.nama || 'Rekan Kerja'}</Text> ingin
                        menukar jadwal shift:
                    </Text>
                    <Text style={styles.swapCardDetail}>
                        📅 Jadwal Dia: {formatDateID(s.requester_schedule?.schedule_date || '')} ({s.requester_schedule?.shift_name}) {'\n'}
                        📅 Jadwal Anda: {formatDateID(s.target_schedule?.schedule_date || '')} ({s.target_schedule?.shift_name})
                    </Text>
                    {s.reason ? <Text style={styles.swapCardDetail}>Alasan: "{s.reason}"</Text> : null}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <Pressable
                            style={[styles.actionBtn, { backgroundColor: '#06736a', flex: 1, alignItems: 'center' }]}
                            onPress={() => onPeerRespond(s.id, true)}
                        >
                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>✓ Setujui</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.actionBtn, { backgroundColor: '#FEE2E2', flex: 1, alignItems: 'center' }]}
                            onPress={() => onPeerRespond(s.id, false)}
                        >
                            <Text style={{ color: '#991B1B', fontWeight: '800', fontSize: 12 }}>✕ Tolak</Text>
                        </Pressable>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    swapRequestBanner: {
        backgroundColor: '#F3E8FF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#C084FC',
    },
    swapBannerTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#6B21A8',
        marginBottom: 8,
    },
    swapCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 12,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    swapCardText: {
        fontSize: 13,
        color: '#0F172A',
    },
    swapCardDetail: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
        marginTop: 4,
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
});
