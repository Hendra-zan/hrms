import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MobileUser } from '../../../types';
import { LeaveRequest } from '../../../services/requestService';

interface QuotaSummaryCardProps {
    user: MobileUser;
    list: LeaveRequest[];
}

export const QuotaSummaryCard: React.FC<QuotaSummaryCardProps> = ({ user, list }) => {
    const sisaCuti = user.sisaCuti ?? 0;
    const pendingCount = list.filter((r) => r.status === 'Pending').length;
    const approvedCount = list.filter((r) => r.status === 'Approved').length;

    return (
        <View style={styles.quotaCard}>
            <View style={styles.quotaHeader}>
                <View>
                    <Text style={styles.quotaTitle}>Sisa Kuota Cuti Tahunan</Text>
                    <Text style={styles.quotaValue}>
                        {sisaCuti} <Text style={styles.quotaUnit}>Hari</Text>
                    </Text>
                </View>
                <View style={styles.quotaIconWrap}>
                    <Text style={{ fontSize: 24 }}>🌴</Text>
                </View>
            </View>

            <View style={styles.quotaFooter}>
                <View style={styles.quotaStat}>
                    <Text style={styles.quotaStatLabel}>Menunggu Approval</Text>
                    <Text style={styles.quotaStatVal}>{pendingCount} Pengajuan</Text>
                </View>
                <View style={styles.quotaStatDivider} />
                <View style={styles.quotaStat}>
                    <Text style={styles.quotaStatLabel}>Telah Disetujui</Text>
                    <Text style={styles.quotaStatVal}>{approvedCount} Pengajuan</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    quotaCard: {
        backgroundColor: '#06736a',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#06736a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    quotaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quotaTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quotaValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ffffff',
        marginTop: 4,
    },
    quotaUnit: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.85)',
    },
    quotaIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quotaFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    quotaStat: {
        flex: 1,
    },
    quotaStatLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.75)',
    },
    quotaStatVal: {
        fontSize: 13,
        fontWeight: '800',
        color: '#ffffff',
        marginTop: 2,
    },
    quotaStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 12,
    },
});
