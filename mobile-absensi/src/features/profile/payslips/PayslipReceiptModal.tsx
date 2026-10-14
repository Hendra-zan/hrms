import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { MobileUser, Payslip } from '../../../types';
import { formatCurrency } from './types';

interface PayslipReceiptModalProps {
  visible: boolean;
  user: MobileUser;
  payslip: Payslip | null;
  onClose: () => void;
}

export function PayslipReceiptModal({
  visible,
  user,
  payslip,
  onClose,
}: PayslipReceiptModalProps) {
  if (!payslip) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Slip Gaji</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={15}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.receipt}>
              <Text style={styles.receiptOrg}>HRMS-PRO WORKPLACE</Text>
              <Text style={styles.receiptDoc}>SLIP GAJI KARYAWAN</Text>
              <Text style={styles.receiptPeriod}>Periode: {payslip.periode}</Text>

              <View style={styles.dottedDivider} />

              <View style={styles.receiptSection}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Nama</Text>
                  <Text style={styles.receiptValueBold}>{user.name}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Jabatan</Text>
                  <Text style={styles.receiptValue}>
                    {user.role === 'kepala_ruangan' ? 'Kepala Ruangan' : 'Karyawan'}
                  </Text>
                </View>
              </View>

              <View style={styles.dottedDivider} />

              <Text style={styles.sectionHeader}>➕ PENDAPATAN</Text>
              <View style={styles.receiptSection}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Gaji Pokok</Text>
                  <Text style={styles.receiptValue}>{formatCurrency(payslip.gajiPokok)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Tunjangan Profesi</Text>
                  <Text style={styles.receiptValue}>{formatCurrency(payslip.tunjanganProfesi)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Upah Lembur</Text>
                  <Text style={styles.receiptValue}>{formatCurrency(payslip.upahLembur)}</Text>
                </View>
                <View style={[styles.receiptRow, styles.totalRow]}>
                  <Text style={styles.receiptTotalLabel}>Total Pendapatan</Text>
                  <Text style={styles.receiptTotalValue}>{formatCurrency(payslip.totalPendapatan)}</Text>
                </View>
              </View>

              <View style={styles.dottedDivider} />

              <Text style={styles.sectionHeader}>➖ POTONGAN</Text>
              <View style={styles.receiptSection}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>PPh 21 (Pajak)</Text>
                  <Text style={styles.receiptValueMinus}>-{formatCurrency(payslip.potonganPPh21)}</Text>
                </View>
                {payslip.potonganBPJSKesehatan !== undefined && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>BPJS Kesehatan</Text>
                    <Text style={styles.receiptValueMinus}>
                      -{formatCurrency(payslip.potonganBPJSKesehatan)}
                    </Text>
                  </View>
                )}
                {payslip.potonganBPJSKetenagakerjaan !== undefined && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>BPJS Ketenagakerjaan</Text>
                    <Text style={styles.receiptValueMinus}>
                      -{formatCurrency(payslip.potonganBPJSKetenagakerjaan)}
                    </Text>
                  </View>
                )}
                {payslip.potonganJHT !== undefined && payslip.potonganJHT > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Jaminan Hari Tua (JHT)</Text>
                    <Text style={styles.receiptValueMinus}>-{formatCurrency(payslip.potonganJHT)}</Text>
                  </View>
                )}
                {payslip.potonganJP !== undefined && payslip.potonganJP > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Jaminan Pensiun (JP)</Text>
                    <Text style={styles.receiptValueMinus}>-{formatCurrency(payslip.potonganJP)}</Text>
                  </View>
                )}
                {!payslip.potonganBPJSKesehatan && !payslip.potonganBPJSKetenagakerjaan && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>BPJS (Legacy)</Text>
                    <Text style={styles.receiptValueMinus}>-{formatCurrency(payslip.potonganBPJS)}</Text>
                  </View>
                )}
                <View style={[styles.receiptRow, styles.totalRow]}>
                  <Text style={styles.receiptTotalLabel}>Total Potongan</Text>
                  <Text style={styles.receiptTotalValueMinus}>-{formatCurrency(payslip.totalPotongan)}</Text>
                </View>
              </View>

              <View style={styles.solidDivider} />

              <View style={styles.netPayContainer}>
                <Text style={styles.netPayLabel}>GAJI BERSIH (TAKE HOME PAY)</Text>
                <Text style={styles.netPayValue}>{formatCurrency(payslip.gajiBersih)}</Text>
              </View>

              <View style={styles.dottedDivider} />

              <Text style={styles.receiptFooter}>
                Slip gaji ini sah dan diterbitkan secara digital oleh sistem HRMS-Pro.
              </Text>
            </View>
          </ScrollView>

          <Pressable onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseBtnText}>Tutup Slip Gaji</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748b',
  },
  modalScroll: {
    padding: 20,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  receipt: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  receiptOrg: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1,
  },
  receiptDoc: {
    fontSize: 18,
    color: '#0f172a',
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 4,
  },
  receiptPeriod: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  solidDivider: {
    height: 2,
    backgroundColor: '#475569',
    marginVertical: 14,
  },
  receiptSection: {
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#475569',
  },
  receiptValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  receiptValueBold: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  receiptTotalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  receiptValueMinus: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  receiptTotalValueMinus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  netPayContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  netPayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 1,
  },
  netPayValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  receiptFooter: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
