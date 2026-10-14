import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LeaveRequest } from '../../../services/requestService';
import { formatDateID } from '../../../utils/date';
import { STATUS_STYLE } from '../types';

const daysBetween = (start: string, end: string): number => {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
    const diffMs = e.getTime() - s.getTime();
    return Math.max(0, Math.floor(diffMs / 86400000) + 1);
};

interface RequestItemCardProps {
    item: LeaveRequest;
    busy: boolean;
    onCancel: (item: LeaveRequest) => void;
    onOvertimeCheckIn: (item: LeaveRequest) => void;
    onOvertimeCheckOut: (item: LeaveRequest) => void;
}

export const RequestItemCard: React.FC<RequestItemCardProps> = ({
    item,
    busy,
    onCancel,
    onOvertimeCheckIn,
    onOvertimeCheckOut,
}) => {
    const st = STATUS_STYLE[item.status] || STATUS_STYLE.Pending;
    const isOvertime = item.type === 'Overtime';
    const isApproved = item.status === 'Approved';
    const meta = item.overtimeMetadata || {};
    const hasCheckedIn = Boolean(meta.clockIn);
    const hasCheckedOut = Boolean(meta.clockOut);

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTypeRow}>
                    <View style={styles.cardIconWrap}>
                        <Text style={{ fontSize: 18 }}>
                            {item.type === 'Cuti'
                                ? '🌴'
                                : item.type === 'Izin'
                                ? '📋'
                                : item.type === 'Overtime'
                                ? '⏳'
                                : '💵'}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardType}>{item.type}</Text>
                        <Text style={styles.cardDate}>
                            {item.startDate === item.endDate
                                ? formatDateID(item.startDate)
                                : `${formatDateID(item.startDate)} - ${formatDateID(item.endDate)}`}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: st.fg }]}>{st.label}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                {item.type === 'Cuti' || item.type === 'Izin' ? (
                    <View style={styles.dayPill}>
                        <Text style={styles.dayPillText}>
                            ⏱ {daysBetween(item.startDate, item.endDate)} Hari
                        </Text>
                    </View>
                ) : null}

                {item.amount != null ? (
                    <Text style={styles.cardAmount}>
                        Rp {item.amount.toLocaleString('id-ID')}
                    </Text>
                ) : null}
            </View>

            {item.reason ? (
                <Text style={styles.cardReason} numberOfLines={3}>
                    "{item.reason}"
                </Text>
            ) : null}

            {/* OVERTIME ACTION BUTTONS */}
            {isOvertime && isApproved ? (
                <View style={styles.overtimeSection}>
                    <Text style={styles.overtimeTitle}>Presensi Lembur (Biometrik Wajah)</Text>
                    {hasCheckedIn ? (
                        <Text style={styles.overtimeTimeText}>
                            ✓ Masuk: {meta.clockIn}{' '}
                            {meta.locationIn ? `(${meta.locationIn})` : ''}
                        </Text>
                    ) : null}
                    {hasCheckedOut ? (
                        <Text style={styles.overtimeTimeText}>
                            ✓ Selesai: {meta.clockOut}{' '}
                            {meta.locationOut ? `(${meta.locationOut})` : ''}
                        </Text>
                    ) : null}

                    <View style={{ marginTop: 6 }}>
                        {!hasCheckedIn ? (
                            <Pressable
                                style={[
                                    styles.actionBtn,
                                    { backgroundColor: '#06736a', alignItems: 'center' },
                                    busy && { opacity: 0.6 },
                                ]}
                                disabled={busy}
                                onPress={() => onOvertimeCheckIn(item)}
                            >
                                {busy ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                                        📷 Mulai Lembur (Clock-In)
                                    </Text>
                                )}
                            </Pressable>
                        ) : !hasCheckedOut ? (
                            <Pressable
                                style={[
                                    styles.actionBtn,
                                    { backgroundColor: '#D97706', alignItems: 'center' },
                                    busy && { opacity: 0.6 },
                                ]}
                                disabled={busy}
                                onPress={() => onOvertimeCheckOut(item)}
                            >
                                {busy ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                                        🏁 Selesai Lembur (Clock-Out)
                                    </Text>
                                )}
                            </Pressable>
                        ) : (
                            <View style={styles.overtimeCompletedBadge}>
                                <Text style={styles.overtimeCompletedText}>
                                    ✓ Lembur Selesai Terverifikasi
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            ) : null}

            {item.status === 'Pending' ? (
                <View style={styles.cardFooter}>
                    <Pressable style={styles.cancelBtn} onPress={() => onCancel(item)}>
                        <Text style={styles.cancelBtnText}>Batalkan</Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    cardIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E6F3F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardType: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    cardDate: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    dayPill: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    dayPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    cardAmount: {
        fontSize: 13,
        fontWeight: '800',
        color: '#06736a',
        backgroundColor: '#E6F3F2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    cardReason: {
        fontSize: 13,
        color: '#334155',
        marginTop: 10,
        lineHeight: 18,
        fontStyle: 'italic',
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 10,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#FEE2E2',
    },
    cancelBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#991B1B',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    overtimeSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 6,
    },
    overtimeTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
    },
    overtimeTimeText: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
    },
    overtimeCompletedBadge: {
        backgroundColor: '#DCFCE7',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    overtimeCompletedText: {
        color: '#166534',
        fontSize: 13,
        fontWeight: '800',
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
});
