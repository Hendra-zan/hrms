import { useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAppData, useAuth } from '../../stores/appStore';
import { useMessageHandlers } from '../useMessageHandlers';
import { canManageEmployees } from '../../services/portalAccessService';
import { createAuditLog } from '../../services/auditLogService';
import { useConfirm } from '../../components/ConfirmDialog';

export const useEmployeePasswordReset = () => {
  const confirm = useConfirm();
  const { employees } = useAppData();
  const { authUser } = useAuth();
  const { showSuccess, showError } = useMessageHandlers();

  const ensureCanManage = (): boolean => {
    if (!canManageEmployees(authUser?.profile?.role)) {
      showError('Akses ditolak', 'Role Anda tidak memiliki izin mengelola data karyawan.');
      return false;
    }
    return true;
  };

  const handleResetPasswordByHR = useCallback(
    async (employeeId: string, newPassword?: string) => {
      if (!ensureCanManage()) return false;

      const employee = employees.find((e) => e.id === employeeId);
      if (!employee?.user_id) {
        showError('Karyawan ini belum memiliki akun login/user_id.', '');
        return false;
      }

      const passToUse = String(newPassword || '').trim();
      if (!passToUse) {
        showError('Password baru harus diisi melalui modal input.', '');
        return false;
      }

      if (passToUse.length < 6) {
        showError('Password baru harus diisi minimal 6 karakter.', '');
        return false;
      }

      if (!newPassword) {
        const ok = await confirm({
          title: 'Reset Password',
          message: `Yakin ingin mereset password akun ${employee.nama} menjadi "${passToUse}"?`,
          confirmLabel: 'Reset',
          variant: 'warning',
        });
        if (!ok) return false;
      }

      try {
        const { error } = await (supabase as any).rpc('admin_reset_employee_password', {
          target_user_id: employee.user_id,
          new_password: passToUse,
        });

        if (error) throw new Error(error.message);

        await createAuditLog({
          action: 'UPDATE',
          entityType: 'employee',
          entityId: employee.id,
          entityName: employee.nama,
          newData: { password_reset: true },
          description: `Melakukan reset password untuk ${employee.nama}`,
          portalType: 'operational',
          metadata: { source: 'useEmployeePasswordReset.handleResetPasswordByHR' },
        });

        showSuccess(`✅ Password untuk ${employee.nama} berhasil direset dan email konfirmasi telah dikirim.`);
        return true;
      } catch (error: any) {
        showError('Gagal mereset password akun', error);
        return false;
      }
    },
    [authUser, employees, showSuccess, showError]
  );

  return {
    handleResetPasswordByHR,
  };
};
