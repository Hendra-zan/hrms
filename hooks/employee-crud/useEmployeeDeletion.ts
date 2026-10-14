import { useCallback } from 'react';
import { useAppData, useAppDataActions, useAuth } from '../../stores/appStore';
import { useMessageHandlers } from '../useMessageHandlers';
import { getAuthHeaders } from '../../utils/apiUtils.ts';
import { canManageEmployees } from '../../services/portalAccessService';
import { createAuditLog } from '../../services/auditLogService';
import { useConfirm } from '../../components/ConfirmDialog';

export const useEmployeeDeletion = () => {
  const confirm = useConfirm();
  const { employees } = useAppData();
  const { authUser } = useAuth();
  const { setEmployees, setDocuments } = useAppDataActions();
  const { showSuccess, showError } = useMessageHandlers();

  const ensureCanManage = (): boolean => {
    if (!canManageEmployees(authUser?.profile?.role)) {
      showError('Akses ditolak', 'Role Anda tidak memiliki izin mengelola data karyawan.');
      return false;
    }
    return true;
  };

  const handleDeleteEmployee = useCallback(
    async (id: string) => {
      if (!ensureCanManage()) return;

      const employee = employees.find((e) => e.id === id);
      const confirmed = await confirm({
        title: 'Hapus Data Karyawan',
        message: `Apakah Anda yakin ingin menghapus data karyawan ${employee?.nama || 'ini'}? Ini tidak akan menghapus akun login mereka.`,
        confirmLabel: 'Hapus',
        variant: 'danger',
      });

      if (!confirmed) return;

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`/api/employees/${id}`, {
          method: 'DELETE',
          headers: {
            ...authHeaders,
          },
        });

        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || 'Gagal menghapus karyawan');

        setEmployees((prev) => prev.filter((e) => e.id !== id));
        setDocuments((prev) => prev.filter((d) => d.employeeId !== id));

        await createAuditLog({
          action: 'DELETE',
          entityType: 'employee',
          entityId: id,
          entityName: employee?.nama || 'unknown',
          oldData: {
            id,
            nama: employee?.nama,
            email: employee?.email,
          },
          description: `Menghapus data karyawan ${employee?.nama || id}`,
          portalType: 'operational',
          metadata: { source: 'useEmployeeDeletion.handleDeleteEmployee' },
        });

        showSuccess(`✅ Data karyawan ${employee?.nama || 'berhasil'} telah dihapus dari sistem.`);
      } catch (error: any) {
        showError('Gagal menghapus karyawan', error);
      }
    },
    [authUser, employees, setEmployees, setDocuments, showSuccess, showError]
  );

  return {
    handleDeleteEmployee,
  };
};
