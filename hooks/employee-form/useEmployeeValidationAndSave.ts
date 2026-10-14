import React, { useState } from 'react';
import logger from '../../services/logger.ts';
import { supabase } from '../../services/supabaseClient.ts';
import { generateJobDescription } from '../../services/geminiService.ts';
import { generateNIK, validateNIK, isNIKUnique, isPinMesinUnique } from '../../services/nikService.ts';
import { Employee, Document } from '../../types.ts';
import { NewEmployeeData } from './types.ts';

interface UseEmployeeValidationAndSaveProps {
  employee: Employee;
  setEmployee: React.Dispatch<React.SetStateAction<Employee>>;
  employeeToEdit: Employee | null;
  onSave: (employee: Employee | NewEmployeeData, newPassword?: string) => void;
  sertifikasiInput: string;
  kompetensiInput: string;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  password: string;
  newPassword: string;
}

export const useEmployeeValidationAndSave = ({
  employee,
  setEmployee,
  employeeToEdit,
  onSave,
  sertifikasiInput,
  kompetensiInput,
  documents,
  setDocuments,
  password,
  newPassword,
}: UseEmployeeValidationAndSaveProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingNIK, setIsGeneratingNIK] = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState('');
  const [newDoc, setNewDoc] = useState({ name: '', type: 'Lainnya' as Document['type'], fileUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateDesc = async () => {
    if (!employee.jabatan || !employee.departemen) {
      setErrors((prev) => ({ ...prev, generateDesc: 'Silakan isi Jabatan dan Departemen terlebih dahulu.' }));
      return;
    }
    setErrors((prev) => {
      const e = { ...prev };
      delete e.generateDesc;
      return e;
    });
    setIsGenerating(true);
    const sertifikasiArray = sertifikasiInput.split(',').map((s) => s.trim()).filter(Boolean);
    const kompetensiArray = kompetensiInput.split(',').map((k) => k.trim()).filter(Boolean);

    const desc = await generateJobDescription(
      employee.jabatan,
      employee.departemen,
      employee.spesialisasi,
      kompetensiArray,
      sertifikasiArray
    );
    setGeneratedDesc(desc);
    setIsGenerating(false);
  };

  const handleAddDocument = async () => {
    if (!newDoc.name) {
      setErrors((prev) => ({ ...prev, docName: 'Nama dokumen harus diisi.' }));
      return;
    }

    if (!selectedFile && !newDoc.fileUrl) {
      setErrors((prev) => ({ ...prev, docFile: 'Pilih file dokumen atau masukkan URL.' }));
      return;
    }

    setErrors((prev) => {
      const e = { ...prev };
      delete e.docName;
      delete e.docFile;
      return e;
    });

    let finalUrl = newDoc.fileUrl;

    if (selectedFile) {
      setIsUploadingDoc(true);
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('employee-documents')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('employee-documents')
          .getPublicUrl(filePath);

        finalUrl = publicUrlData.publicUrl;
      } catch (error: any) {
        logger.error('Upload error', error);
        setErrors((prev) => ({ ...prev, docUpload: `Gagal mengunggah file: ${error.message}` }));
        setIsUploadingDoc(false);
        return;
      }
      setIsUploadingDoc(false);
    }

    const docToAdd: Document = {
      ...newDoc,
      fileUrl: finalUrl,
      id: crypto.randomUUID(),
      employeeId: employee.id,
      uploadedAt: new Date().toISOString(),
    };
    setDocuments([...documents, docToAdd]);
    setNewDoc({ name: '', type: 'Lainnya', fileUrl: '' });
    setSelectedFile(null);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleGenerateNIK = async () => {
    const targetUnitId = employee.unitKerjaId || employee.managedUnitId;
    if (!targetUnitId || !employee.jabatan || !employee.hireDate) {
      setErrors((prev) => ({
        ...prev,
        nik: 'Silakan isi Unit Kerja, Jabatan, dan Tanggal Masuk terlebih dahulu.',
      }));
      return;
    }

    if (employee.nik && validateNIK(employee.nik)) {
      const confirmChange = window.confirm(
        'Karyawan sudah memiliki NIK yang valid (11 digit).\n\n' +
          'Apakah Anda yakin ingin menimpa dan membuat NIK baru?\n' +
          'Mengubah NIK yang sudah ada dapat mengacaukan riwayat absensi, data penggajian, dan manajemen data karyawan.'
      );
      if (!confirmChange) {
        return;
      }
    }

    setIsGeneratingNIK(true);
    try {
      const nik = await generateNIK(targetUnitId, employee.jabatan, employee.hireDate);
      setEmployee({ ...employee, nik });
      setErrors((prev) => {
        const e = { ...prev };
        delete e.nik;
        return e;
      });
    } catch (error) {
      logger.error('Error generating NIK', error);
      setErrors((prev) => ({ ...prev, nik: 'Gagal generate NIK. Silakan coba lagi.' }));
    } finally {
      setIsGeneratingNIK(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    if (!employee.nama.trim()) {
      newErrors.nama = 'Nama tidak boleh kosong';
    }
    if (!employee.email.trim()) {
      newErrors.email = 'Email tidak boleh kosong';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (employee.nik) {
      if (!validateNIK(employee.nik)) {
        newErrors.nik = 'Format NIK tidak valid (harus 11 digit angka)';
      } else {
        const excludeId = employeeToEdit ? employee.id : undefined;
        const isUnique = await isNIKUnique(employee.nik, excludeId);
        if (!isUnique) {
          newErrors.nik = 'NIK sudah digunakan oleh karyawan lain';
        }
      }
    }
    if (employee.telepon && !/^[0-9+\-\s]{10,15}$/.test(employee.telepon)) {
      newErrors.telepon = 'Format nomor telepon tidak valid';
    }
    if (employee.pin_mesin && employee.pin_mesin.trim()) {
      const trimmedPin = employee.pin_mesin.trim();
      if (!/^\d{1,20}$/.test(trimmedPin)) {
        newErrors.pin_mesin = 'Format ID/PIN Mesin tidak valid (harus berupa angka 1-20 digit)';
      } else {
        const excludeId = employeeToEdit ? employee.id : undefined;
        const isUnique = await isPinMesinUnique(trimmedPin, excludeId);
        if (!isUnique) {
          newErrors.pin_mesin = 'ID/PIN Mesin sudah digunakan oleh karyawan lain';
        }
      }
    }
    if (!employeeToEdit && (!password || password.length < 6)) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    if ((employee.jabatan === 'Dokter' || employee.jabatan === 'Perawat') && !employee.nomorSTR) {
      newErrors.nomorSTR = 'Nomor STR wajib diisi untuk Dokter dan Perawat';
    }
    if (employee.role === 'kepala_ruangan' && !employee.managedUnitId) {
      newErrors.managedUnitId = 'Unit yang dikelola wajib dipilih untuk Kepala Ruangan';
    }
    if (employee.role !== 'admin' && employee.role !== 'hrd' && !employee.unitKerjaId) {
      newErrors.unitKerjaId = 'Unit Kerja wajib dipilih agar karyawan terdeteksi di dashboard';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    setIsSaving(true);

    const profileCompleted = !!(
      employee.nama &&
      employee.email &&
      employee.birthDate &&
      employee.ktpNumber &&
      employee.address?.ktp &&
      employee.bankAccount?.accountNumber
    );

    const sharedData = {
      ...employee,
      sertifikasi: sertifikasiInput.split(',').map((s) => s.trim()).filter(Boolean),
      kompetensi: kompetensiInput.split(',').map((k) => k.trim()).filter(Boolean),
      documents: documents,
      isProfileCompleted: profileCompleted,
    };

    try {
      if (employeeToEdit) {
        await (onSave as (e: any, p?: string) => Promise<void>)(sharedData, newPassword || undefined);
      } else {
        const newEmployeeData: NewEmployeeData = { ...sharedData, password: password };
        await (onSave as (e: any) => Promise<void>)(newEmployeeData);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    const updatedEmployee = {
      ...employee,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };
    onSave(updatedEmployee);
  };

  const handleToggleLock = async () => {
    const updatedEmployee = {
      ...employee,
      isLocked: !employee.isLocked,
    };
    onSave(updatedEmployee);
  };

  return {
    errors,
    setErrors,
    isGenerating,
    isGeneratingNIK,
    generatedDesc,
    setGeneratedDesc,
    newDoc,
    setNewDoc,
    selectedFile,
    setSelectedFile,
    isUploadingDoc,
    isSaving,
    handleGenerateDesc,
    handleAddDocument,
    handleDeleteDocument,
    handleGenerateNIK,
    validateForm,
    handleSubmit,
    handleVerify,
    handleToggleLock,
  };
};
