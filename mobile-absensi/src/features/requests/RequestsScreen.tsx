import React from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonHistoryItem } from '../../components/Skeleton';
import { LiveLivenessModal } from '../../components/LiveLivenessModal';
import { ShiftSwapModal } from '../schedule/ShiftSwapModal';
import { LeaveRequest, RequestType } from '../../services/requestService';
import { colors } from '../../theme/colors';
import { MobileUser } from '../../types';
import { TYPES } from './types';
import { useRequestsScreenState } from './hooks/useRequestsScreenState';
import { QuotaSummaryCard } from './components/QuotaSummaryCard';
import { ShiftSwapBanner } from './components/ShiftSwapBanner';
import { RequestItemCard } from './components/RequestItemCard';
import { NewRequestModal } from './components/NewRequestModal';

interface RequestsScreenProps {
    user: MobileUser;
    onListChange?: (list: LeaveRequest[]) => void;
}

export function RequestsScreen({ user, onListChange }: RequestsScreenProps) {
    const {
        list,
        filtered,
        activeFilter,
        setActiveFilter,
        loading,
        refreshing,
        error,
        liveVisible,
        busy,
        biometricStatus,
        showForm,
        setShowForm,
        submitting,
        type,
        setType,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        reason,
        setReason,
        amount,
        setAmount,
        formError,
        pickerOpen,
        setPickerOpen,
        showSwapModal,
        setShowSwapModal,
        shiftSwaps,
        load,
        handleRefresh,
        handleCancel,
        handlePeerRespond,
        handleOvertimeCheckIn,
        handleOvertimeCheckOut,
        finishLive,
        submit,
    } = useRequestsScreenState(user, onListChange);

    return (
        <View style={styles.container}>
            {/* Header Action Buttons */}
            <View style={styles.headerRow}>
                <Pressable
                    style={styles.headerBtnPrimary}
                    onPress={() => setShowForm(true)}
                >
                    <Text style={styles.headerBtnPrimaryText}>+ Buat Pengajuan</Text>
                </Pressable>

                <Pressable
                    style={styles.headerBtnSecondary}
                    onPress={() => setShowSwapModal(true)}
                >
                    <Text style={styles.headerBtnSecondaryText}>🔄 Ajukan Tukar Shift</Text>
                </Pressable>
            </View>

            {/* Quota Summary Card */}
            <QuotaSummaryCard user={user} list={list} />

            {/* Shift Swap Notification Banner */}
            <ShiftSwapBanner
                shiftSwaps={shiftSwaps}
                currentEmployeeId={user.employeeId || user.id}
                onPeerRespond={handlePeerRespond}
            />

            {/* Filter Scroll Chips */}
            <View style={styles.filterScroll}>
                {(['Semua', ...TYPES] as const).map((t) => {
                    const active = t === activeFilter;
                    return (
                        <Pressable
                            key={t}
                            style={[styles.filterChip, active && styles.filterChipActive]}
                            onPress={() => setActiveFilter(t as any)}
                        >
                            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                {t}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Request FlatList */}
            {loading ? (
                <View>
                    <SkeletonHistoryItem />
                    <SkeletonHistoryItem />
                    <SkeletonHistoryItem />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(r) => r.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="📋"
                            title="Belum Ada Pengajuan"
                            description={
                                activeFilter === 'Semua'
                                    ? 'Tekan tombol di atas untuk mengajukan cuti, izin, lembur, atau reimbursement.'
                                    : `Tidak ada riwayat pengajuan dengan tipe ${activeFilter}.`
                            }
                        />
                    }
                    renderItem={({ item }) => (
                        <RequestItemCard
                            item={item}
                            busy={busy}
                            onCancel={handleCancel}
                            onOvertimeCheckIn={handleOvertimeCheckIn}
                            onOvertimeCheckOut={handleOvertimeCheckOut}
                        />
                    )}
                />
            )}

            {/* New Request Modal */}
            <NewRequestModal
                visible={showForm}
                onClose={() => setShowForm(false)}
                onSubmit={submit}
                submitting={submitting}
                type={type}
                setType={setType}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                reason={reason}
                setReason={setReason}
                amount={amount}
                setAmount={setAmount}
                formError={formError}
                pickerOpen={pickerOpen}
                setPickerOpen={setPickerOpen}
            />

            {/* Shift Swap Form Modal */}
            <ShiftSwapModal
                visible={showSwapModal}
                user={user}
                onClose={() => setShowSwapModal(false)}
                onSuccess={() => {
                    setShowSwapModal(false);
                    void load();
                }}
            />

            {/* Live Liveness Modal for Overtime Verification */}
            <LiveLivenessModal
                visible={liveVisible}
                onComplete={finishLive}
                onCancel={() => finishLive(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    headerBtnPrimary: {
        flex: 1.2,
        backgroundColor: '#06736a',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#06736a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    headerBtnPrimaryText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },
    headerBtnSecondary: {
        flex: 1,
        backgroundColor: '#E6F3F2',
        borderColor: '#06736a',
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBtnSecondaryText: {
        color: '#06736a',
        fontSize: 12,
        fontWeight: '800',
    },
    filterScroll: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterChipActive: {
        backgroundColor: '#06736a',
        borderColor: '#06736a',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    error: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: 12,
    },
});
