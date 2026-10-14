import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { Payslip } from '../../../types';
import { formatCurrency } from './types';

interface PayslipCardItemProps {
  payslip: Payslip;
  onPress: () => void;
}

export function PayslipCardItem({ payslip, onPress }: PayslipCardItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.payslipCard, pressed && styles.payslipCardPressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardPeriod}>{payslip.periode}</Text>
        <Text style={styles.cardStatus}>Terkunci & Diterbitkan</Text>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Gaji Bersih</Text>
          <Text style={styles.cardValue}>{formatCurrency(payslip.gajiBersih)}</Text>
        </View>
        <Text style={styles.cardDetailLink}>Ketuk untuk detail ➔</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  payslipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  payslipCardPressed: {
    opacity: 0.8,
    backgroundColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardPeriod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardStatus: {
    fontSize: 11,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  cardBody: {
    marginTop: 8,
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardDetailLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
});
