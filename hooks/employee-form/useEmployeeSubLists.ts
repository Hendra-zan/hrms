import React from 'react';
import {
  Employee,
  Address,
  BankAccount,
  EmergencyContact,
  Education,
  WorkHistory,
} from '../../types.ts';

interface UseEmployeeSubListsProps {
  employee: Employee;
  setEmployee: React.Dispatch<React.SetStateAction<Employee>>;
}

export const useEmployeeSubLists = ({ employee, setEmployee }: UseEmployeeSubListsProps) => {
  const handleAddressChange = (fieldOrObj: keyof Address | Partial<Address>, value?: string) => {
    setEmployee((prev) => {
      const currentAddress = prev.address || { ktp: '', domisili: '', province: '', city: '', postalCode: '' };
      let newAddress: Address;
      if (typeof fieldOrObj === 'string') {
        newAddress = {
          ...currentAddress,
          [fieldOrObj]: value !== undefined ? value : '',
        };
      } else {
        newAddress = {
          ...currentAddress,
          ...fieldOrObj,
        };
      }
      return {
        ...prev,
        address: newAddress,
      };
    });
  };

  const handleBankAccountChange = (field: keyof BankAccount, value: string) => {
    setEmployee({
      ...employee,
      bankAccount: {
        ...employee.bankAccount!,
        [field]: value,
      },
    });
  };

  const handleAddEmergencyContact = () => {
    const newContact: EmergencyContact = {
      name: '',
      relationship: '',
      phone: '',
      address: '',
    };
    setEmployee({
      ...employee,
      emergencyContacts: [...(employee.emergencyContacts || []), newContact],
    });
  };

  const handleUpdateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...(employee.emergencyContacts || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEmployee({ ...employee, emergencyContacts: updated });
  };

  const handleDeleteEmergencyContact = (index: number) => {
    const updated = [...(employee.emergencyContacts || [])];
    updated.splice(index, 1);
    setEmployee({ ...employee, emergencyContacts: updated });
  };

  const handleAddEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      level: 'S1',
      institution: '',
      major: '',
      graduationYear: new Date().getFullYear(),
      gpa: undefined,
    };
    setEmployee({
      ...employee,
      education: [...(employee.education || []), newEdu],
    });
  };

  const handleUpdateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...(employee.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEmployee({ ...employee, education: updated });
  };

  const handleDeleteEducation = (index: number) => {
    const updated = [...(employee.education || [])];
    updated.splice(index, 1);
    setEmployee({ ...employee, education: updated });
  };

  const handleAddWorkHistory = () => {
    const newWork: WorkHistory = {
      id: `work-${Date.now()}`,
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      reasonLeaving: '',
    };
    setEmployee({
      ...employee,
      workHistory: [...(employee.workHistory || []), newWork],
    });
  };

  const handleUpdateWorkHistory = (index: number, field: keyof WorkHistory, value: string) => {
    const updated = [...(employee.workHistory || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEmployee({ ...employee, workHistory: updated });
  };

  const handleDeleteWorkHistory = (index: number) => {
    const updated = [...(employee.workHistory || [])];
    updated.splice(index, 1);
    setEmployee({ ...employee, workHistory: updated });
  };

  return {
    handleAddressChange,
    handleBankAccountChange,
    handleAddEmergencyContact,
    handleUpdateEmergencyContact,
    handleDeleteEmergencyContact,
    handleAddEducation,
    handleUpdateEducation,
    handleDeleteEducation,
    handleAddWorkHistory,
    handleUpdateWorkHistory,
    handleDeleteWorkHistory,
  };
};
