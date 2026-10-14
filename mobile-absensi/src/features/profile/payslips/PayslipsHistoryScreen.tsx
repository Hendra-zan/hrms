import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { PayslipsHistoryScreenProps } from './types';
import { usePayslipsHistoryState } from './usePayslipsHistoryState';
import { PayslipCardItem } from './PayslipCardItem';
import { PayslipReceiptModal } from './PayslipReceiptModal';

export function PayslipsHistoryScreen({ user, onBack }: PayslipsHistoryScreenProps) {
  const {
    loading,
    refreshing,
    isOffline,
    payslips,
    selectedPayslip,
    fetchPayslips,
    handleOpenDetail,
    handleCloseDetail,
  } = usePayslipsHistoryState(user.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={15}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Riwayat Slip Gaji</Text>
        <View style={styles.placeholder} />
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>⚠️ Mode Offline (Menampilkan data cache lokal)</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data slip gaji...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPayslips(true)}
              colors={[colors.primary]}
            />
          }
        >
          {payslips.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>Belum Ada Slip Gaji</Text>
              <Text style={styles.emptyDesc}>
                Slip gaji Anda akan muncul di sini setelah diterbitkan oleh HRD/Admin.
              </Text>
            </View>
          ) : (
            payslips.map((payslip) => (
              <PayslipCardItem
                key={payslip.id}
                payslip={payslip}
                onPress={() => handleOpenDetail(payslip)}
              />
            ))
          )}
        </ScrollView>
      )}

      <PayslipReceiptModal
        visible={selectedPayslip !== null}
        user={user}
        payslip={selectedPayslip}
        onClose={handleCloseDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  placeholder: {
    width: 40,
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  offlineBannerText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
