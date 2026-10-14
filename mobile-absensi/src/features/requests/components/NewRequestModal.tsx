import React from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { RequestType } from '../../../services/requestService';
import { formatDateID } from '../../../utils/date';
import { colors } from '../../../theme/colors';
import { TYPES } from '../types';

const daysBetween = (start: string, end: string): number => {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
    const diffMs = e.getTime() - s.getTime();
    return Math.max(0, Math.floor(diffMs / 86400000) + 1);
};

interface NewRequestModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: () => void;
    submitting: boolean;
    type: RequestType;
    setType: (t: RequestType) => void;
    startDate: string;
    setStartDate: (d: string) => void;
    endDate: string;
    setEndDate: (d: string) => void;
    reason: string;
    setReason: (r: string) => void;
    amount: string;
    setAmount: (a: string) => void;
    formError: string | null;
    pickerOpen: null | 'start' | 'end';
    setPickerOpen: (p: null | 'start' | 'end') => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
    visible,
    onClose,
    onSubmit,
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
}) => {
    return (
        <Modal
            animationType="slide"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Buat Pengajuan Baru</Text>
                        <Pressable onPress={onClose}>
                            <Text style={styles.closeX}>✕</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.label}>Tipe Pengajuan</Text>
                    <View style={styles.typeGrid}>
                        {TYPES.map((t) => {
                            const active = t === type;
                            return (
                                <Pressable
                                    key={t}
                                    style={[styles.typeChip, active && styles.typeChipActive]}
                                    onPress={() => setType(t)}
                                >
                                    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                                        {t}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Mulai</Text>
                            <Pressable style={styles.dateBtn} onPress={() => setPickerOpen('start')}>
                                <Text style={styles.dateBtnText}>{formatDateID(startDate)}</Text>
                                <Text style={styles.dateBtnIcon}>📅</Text>
                            </Pressable>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Selesai</Text>
                            <Pressable style={styles.dateBtn} onPress={() => setPickerOpen('end')}>
                                <Text style={styles.dateBtnText}>{formatDateID(endDate)}</Text>
                                <Text style={styles.dateBtnIcon}>📅</Text>
                            </Pressable>
                        </View>
                    </View>

                    {type === 'Cuti' || type === 'Izin' ? (
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationBadgeText}>
                                Durasi yang diajukan: <Text style={{ fontWeight: '800' }}>{daysBetween(startDate, endDate)} hari kerja</Text>
                            </Text>
                        </View>
                    ) : null}

                    {type === 'Reimburse' ? (
                        <>
                            <Text style={styles.label}>Nominal (Rp)</Text>
                            <TextInput
                                keyboardType="numeric"
                                placeholder="Contoh: 150000"
                                placeholderTextColor="#94A3B8"
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </>
                    ) : null}

                    <Text style={styles.label}>Alasan / Keterangan</Text>
                    <TextInput
                        multiline
                        placeholder="Jelaskan kebutuhan pengajuan secara rinci..."
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, styles.multiline]}
                        value={reason}
                        onChangeText={setReason}
                    />

                    {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                    <View style={styles.modalActions}>
                        <AppButton
                            title="Batal"
                            variant="secondary"
                            style={{ flex: 1 }}
                            onPress={onClose}
                        />
                        <AppButton
                            title={submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                            variant="primary"
                            loading={submitting}
                            style={{ flex: 1 }}
                            onPress={onSubmit}
                        />
                    </View>
                </View>
            </View>

            <DatePickerModal
                visible={pickerOpen !== null}
                value={pickerOpen === 'end' ? endDate : startDate}
                minDate={pickerOpen === 'end' ? startDate : undefined}
                onConfirm={(d) => {
                    if (pickerOpen === 'start') {
                        setStartDate(d);
                        if (d > endDate) setEndDate(d);
                    } else if (pickerOpen === 'end') {
                        setEndDate(d);
                    }
                    setPickerOpen(null);
                }}
                onClose={() => setPickerOpen(null)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        paddingBottom: 32,
        gap: 6,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    closeX: {
        fontSize: 20,
        color: '#94A3B8',
        paddingHorizontal: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
        marginTop: 10,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
    },
    dateBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    dateBtnIcon: {
        fontSize: 15,
    },
    durationBadge: {
        backgroundColor: '#E6F3F2',
        borderRadius: 12,
        padding: 10,
        marginTop: 10,
        alignItems: 'center',
    },
    durationBadgeText: {
        fontSize: 12,
        color: '#06736a',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
    },
    typeChipActive: {
        backgroundColor: '#06736a',
        borderColor: '#06736a',
    },
    typeChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    typeChipTextActive: {
        color: '#ffffff',
    },
    formError: {
        color: colors.danger,
        fontSize: 13,
        marginTop: 8,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
});
