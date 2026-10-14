import { useCallback, useRef } from 'react';
import logger from '../../services/logger.ts';
import { supabase } from '../../services/supabaseClient';
import { Employee } from '../../types';
import type { NewEmployeeData } from '../../components/EmployeeForm';
import { useAppDataActions, useUIActions, useAuth, useUI } from '../../stores/appStore';
import { useMessageHandlers } from '../useMessageHandlers';
import { mapEmployeeToDatabase, mapEmployeeFromDatabase } from '../../utils/dataMapping';
import { sanitizeDateFields } from '../../utils/dateUtils';
import { getAuthHeaders } from '../../utils/apiUtils.ts';
import { canManageEmployees } from '../../services/portalAccessService';
import { createAuditLog } from '../../services/auditLogService';

export const useEmployeeCreation = () => {
  const { authUser } = useAuth();
  const { activePortal, employeeToView } = useUI();
  const { setEmployees, setDocuments } = useAppDataActions();
  const { setIsFormOpen, setEmployeeToEdit, setEmployeeToView } = useUIActions();
  const { showSuccess, showError } = useMessageHandlers();
  const formCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFormClose = (delay = 2000) => {
    if (formCloseTimerRef.current) clearTimeout(formCloseTimerRef.current);
    formCloseTimerRef.current = setTimeout(() => {
      formCloseTimerRef.current = null;
      setIsFormOpen(false);
      setEmployeeToEdit(null);
    }, delay);
  };

  const ensureCanManage = (): boolean => {
    if (!canManageEmployees(authUser?.profile?.role)) {
      showError('Akses ditolak', 'Role Anda tidak memiliki izin mengelola data karyawan.');
      return false;
    }
    return true;
  };

  const reloadDocuments = async (employeeId?: string) => {
    let query = supabase.from('documents').select('*');
    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    } else {
      query = query.limit(5000);
    }
    const { data: finalDocs, error: finalDocsError } = await query;
    if (finalDocsError) {
      throw new Error(`Gagal memuat ulang dokumen: ${finalDocsError.message}`);
    }
    if (employeeId) {
      setDocuments((prev) => {
        const remaining = prev.filter((doc) => doc.employeeId !== employeeId);
        return [...remaining, ...((finalDocs || []) as any[])];
      });
      return;
    }
    setDocuments((finalDocs || []) as any);
  };

  const updateEmployee = async (
    employeeData: Employee,
    newPassword?: string,
    documents: any[] = []
  ) => {
    const { id } = employeeData;
    const sanitized = sanitizeDateFields(employeeData);
    const updateData = mapEmployeeToDatabase(sanitized);

    logger.debug('[updateEmployee] Sending update', { id });
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ updateData, documents, ...(newPassword && { newPassword }) }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || 'Database error');
    }

    const updatedEmployee = result?.data;
    if (!updatedEmployee) {
      throw new Error('Pembaruan data gagal: tidak ada baris yang diperbarui.');
    }

    const employeeWithCompensation = mapEmployeeFromDatabase(updatedEmployee);
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? employeeWithCompensation : e))
    );

    if (employeeToView && employeeToView.id === id) {
      setEmployeeToView(employeeWithCompensation);
    }

    if (Array.isArray(documents)) {
      await reloadDocuments(id);
    }

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'employee',
      entityId: updatedEmployee.id,
      entityName: updatedEmployee.nama,
      oldData: { id: employeeData.id },
      newData: {
        nama: updatedEmployee.nama,
        email: updatedEmployee.email,
        jabatan: updatedEmployee.jabatan,
        departemen: updatedEmployee.departemen,
      },
      description: `Memperbarui data karyawan ${updatedEmployee.nama}`,
      portalType: 'operational',
      metadata: { source: 'useEmployeeCreation.updateEmployee' },
    });

    showSuccess(`✅ Data karyawan ${updatedEmployee.nama} berhasil diperbarui dan tersimpan.`);
  };

  const createEmployeeWithLogin = async (employeeData: any, documents: any[] = []) => {
    if (!employeeData.password?.trim()) {
      throw new Error('Password akun login karyawan wajib diisi.');
    }

    const sanitized = sanitizeDateFields({ ...employeeData });
    const profileData = mapEmployeeToDatabase(sanitized);
    const authHeaders = await getAuthHeaders();

    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        employeeData: profileData,
        password: employeeData.password,
        documents,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const detailMsg = Array.isArray(result?.details) && result.details.length > 0
        ? result.details.map((d: any) => `${d.field}: ${d.message}`).join('; ')
        : '';
      const mainErr = result?.error || 'Gagal menyimpan profil karyawan';
      throw new Error(detailMsg ? `${mainErr} (${detailMsg})` : mainErr);
    }

    const newEmployee = result?.data;
    if (!newEmployee) {
      throw new Error('Pengguna tidak berhasil dibuat di server.');
    }

    const employeeWithCompensation = mapEmployeeFromDatabase(newEmployee);
    setEmployees((prev) => [...prev, employeeWithCompensation]);

    if (documents.length > 0) {
      await reloadDocuments(newEmployee.id);
    }

    showSuccess(`✅ Karyawan baru ${newEmployee.nama} berhasil ditambahkan dengan akun login siap digunakan.`);

    await createAuditLog({
      action: 'CREATE',
      entityType: 'employee',
      entityId: newEmployee.id,
      entityName: newEmployee.nama,
      newData: {
        nama: newEmployee.nama,
        email: newEmployee.email,
        role: newEmployee.role,
      },
      description: `Menambahkan karyawan baru ${newEmployee.nama} dengan akun login`,
      portalType: 'operational',
      metadata: { source: 'useEmployeeCreation.createEmployeeWithLogin' },
    });

    return newEmployee;
  };

  const createEmployee = async (employeeData: any, documents: any[] = []) => {
    const sanitized = sanitizeDateFields(employeeData);
    const profileData = mapEmployeeToDatabase(sanitized);
    const authHeaders = await getAuthHeaders();

    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        employeeData: profileData,
        documents,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || `Gagal menyimpan profil karyawan`);
    }

    const newEmployee = result?.data;
    if (!newEmployee) {
      throw new Error('Profil karyawan tidak berhasil dibuat di server.');
    }

    const employeeWithCompensation = mapEmployeeFromDatabase(newEmployee);
    setEmployees((prev) => [...prev, employeeWithCompensation]);

    if (documents.length > 0) {
      await reloadDocuments(newEmployee.id);
    }

    showSuccess(`✅ Profil karyawan ${newEmployee.nama} berhasil ditambahkan ke sistem.`);

    await createAuditLog({
      action: 'CREATE',
      entityType: 'employee',
      entityId: newEmployee.id,
      entityName: newEmployee.nama,
      newData: {
        nama: newEmployee.nama,
        email: newEmployee.email,
        role: newEmployee.role,
      },
      description: `Menambahkan profil karyawan baru ${newEmployee.nama}`,
      portalType: 'operational',
      metadata: { source: 'useEmployeeCreation.createEmployee' },
    });

    return newEmployee;
  };

  const handleSaveEmployee = useCallback(
    async (
      employeeData: Employee | NewEmployeeData,
      newPassword?: string
    ): Promise<void> => {
      if (!ensureCanManage()) return;

      try {
        const docs = Array.isArray((employeeData as any).documents) ? (employeeData as any).documents : [];
        if ('id' in employeeData && employeeData.id) {
          await updateEmployee(employeeData as Employee, newPassword, docs);
          scheduleFormClose();
        } else if ('password' in employeeData) {
          await createEmployeeWithLogin(employeeData, docs);
          scheduleFormClose();
        } else {
          await createEmployee(employeeData, docs);
          scheduleFormClose();
        }
      } catch (error: any) {
        showError('Gagal menyimpan data karyawan', error);
      }
    },
    [authUser, employeeToView, showSuccess, showError]
  );

  return {
    handleSaveEmployee,
    reloadDocuments,
  };
};
