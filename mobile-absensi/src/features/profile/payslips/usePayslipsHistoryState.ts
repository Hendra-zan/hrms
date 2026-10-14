import { useCallback, useEffect, useState } from 'react';
import { payslipService } from '../../../services/payslipService';
import type { Payslip } from '../../../types';
import { haptics } from '../../../utils/haptics';

export function usePayslipsHistoryState(userId: string) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const fetchPayslips = useCallback(
    async (isRef = false) => {
      if (isRef) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await payslipService.getEmployeePayslips(userId);
        setPayslips(result.data);
        setIsOffline(result.isOffline);
      } catch (err) {
        console.warn('Gagal memuat slip gaji:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    void fetchPayslips();
  }, [fetchPayslips]);

  const handleOpenDetail = (payslip: Payslip) => {
    haptics.success();
    setSelectedPayslip(payslip);
  };

  const handleCloseDetail = () => {
    setSelectedPayslip(null);
  };

  return {
    loading,
    refreshing,
    isOffline,
    payslips,
    selectedPayslip,
    fetchPayslips,
    handleOpenDetail,
    handleCloseDetail,
  };
}
