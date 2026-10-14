import { useState, useEffect } from 'react';
import { Employee, Role, Document } from '../../types.ts';
import { canManageEmployees } from '../../services/portalAccessService.ts';
import {
  UseEmployeeFormProps,
  initialCompensation,
  createInitialFormState,
} from './types.ts';
import { useEmployeeSubLists } from './useEmployeeSubLists.ts';
import { useEmployeeValidationAndSave } from './useEmployeeValidationAndSave.ts';

export const useEmployeeForm = ({ employeeToEdit, onSave, currentUserRole }: UseEmployeeFormProps) => {
  const isAdmin = canManageEmployees(currentUserRole);

  const [employee, setEmployee] = useState<Employee>(createInitialFormState);
  const [activeTab, setActiveTab] = useState<'basic' | 'personal' | 'professional' | 'employment' | 'documents'>('basic');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const [sertifikasiInput, setSertifikasiInput] = useState('');
  const [kompetensiInput, setKompetensiInput] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    if (employeeToEdit) {
      const newEmployeeState = {
        ...employeeToEdit,
        nik: employeeToEdit.nik || '',
        foto: employeeToEdit.foto || '',
        telepon: employeeToEdit.telepon || '',
        birthDate: employeeToEdit.birthDate || '',
        spesialisasi: employeeToEdit.spesialisasi || '',
        kredensial: employeeToEdit.kredensial || '',
        nomorSTR: employeeToEdit.nomorSTR || '',
        tanggalKadaluarsaSTR: employeeToEdit.tanggalKadaluarsaSTR || '',
        unitKerjaId: employeeToEdit.unitKerjaId || '',
        compensation: employeeToEdit.compensation || initialCompensation,
        id: employeeToEdit.id,
        user_id: employeeToEdit.user_id,
        pin_mesin: employeeToEdit.pin_mesin || '',
      };

      setEmployee(newEmployeeState);
      setSertifikasiInput((employeeToEdit.sertifikasi || []).join(', '));
      setKompetensiInput((employeeToEdit.kompetensi || []).join(', '));
      setDocuments(employeeToEdit.documents || []);
    } else {
      setEmployee(createInitialFormState());
      setSertifikasiInput('');
      setKompetensiInput('');
      setDocuments([]);
    }
    setPassword('');
    setNewPassword('');
    setShowPasswordReset(false);
  }, [employeeToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'role') {
      if (value === 'kepala_ruangan' && employee.unitKerjaId) {
        setEmployee({ ...employee, role: value as Role, managedUnitId: employee.unitKerjaId });
      } else {
        setEmployee({ ...employee, role: value as Role, managedUnitId: undefined });
      }
    } else if (name === 'unitKerjaId') {
      if (employee.role === 'kepala_ruangan') {
        setEmployee({ ...employee, unitKerjaId: value, managedUnitId: value });
      } else {
        setEmployee({ ...employee, unitKerjaId: value });
      }
    } else if (name === 'managedUnitId') {
      setEmployee({ ...employee, managedUnitId: value, unitKerjaId: value });
    } else {
      setEmployee({ ...employee, [name]: value });
    }
  };

  const handleCompensationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployee({
      ...employee,
      compensation: {
        ...employee.compensation!,
        [name]: parseFloat(value) || 0,
      },
    });
  };

  const subLists = useEmployeeSubLists({ employee, setEmployee });

  const validationAndSave = useEmployeeValidationAndSave({
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
  });

  const isFormLocked = employee.isLocked || false;
  const isVerified = employee.isVerified || false;
  const isProfileCompleted = employee.isProfileCompleted || false;
  const documentTypeOptions: Document['type'][] = ['Ijazah', 'STR/SIP', 'Sertifikat', 'Lainnya'];

  return {
    employee,
    setEmployee,
    activeTab,
    setActiveTab,
    password,
    setPassword,
    newPassword,
    setNewPassword,
    showPasswordReset,
    setShowPasswordReset,
    generatedDesc: validationAndSave.generatedDesc,
    setGeneratedDesc: validationAndSave.setGeneratedDesc,
    isGenerating: validationAndSave.isGenerating,
    setIsGenerating: () => {},
    isGeneratingNIK: validationAndSave.isGeneratingNIK,
    setIsGeneratingNIK: () => {},
    sertifikasiInput,
    setSertifikasiInput,
    kompetensiInput,
    setKompetensiInput,
    documents,
    setDocuments,
    newDoc: validationAndSave.newDoc,
    setNewDoc: validationAndSave.setNewDoc,
    selectedFile: validationAndSave.selectedFile,
    setSelectedFile: validationAndSave.setSelectedFile,
    isUploadingDoc: validationAndSave.isUploadingDoc,
    setIsUploadingDoc: () => {},
    isSaving: validationAndSave.isSaving,
    setIsSaving: () => {},
    errors: validationAndSave.errors,
    setErrors: validationAndSave.setErrors,
    isFormLocked,
    isVerified,
    isProfileCompleted,
    isAdmin,
    documentTypeOptions,

    handleChange,
    handleCompensationChange,
    handleGenerateDesc: validationAndSave.handleGenerateDesc,
    handleAddDocument: validationAndSave.handleAddDocument,
    handleDeleteDocument: validationAndSave.handleDeleteDocument,
    handleGenerateNIK: validationAndSave.handleGenerateNIK,
    validateForm: validationAndSave.validateForm,
    handleSubmit: validationAndSave.handleSubmit,
    handleVerify: validationAndSave.handleVerify,
    handleToggleLock: validationAndSave.handleToggleLock,
    ...subLists,
  };
};
