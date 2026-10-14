import {
  useEmployeeCreation,
  useEmployeeDeletion,
  useEmployeePasswordReset,
  EmployeeCRUDResult,
  SaveEmployeePayload,
} from './employee-crud';

export type { EmployeeCRUDResult, SaveEmployeePayload };

export const useEmployeeCRUD = (): EmployeeCRUDResult => {
  const { handleSaveEmployee } = useEmployeeCreation();
  const { handleDeleteEmployee } = useEmployeeDeletion();
  const { handleResetPasswordByHR } = useEmployeePasswordReset();

  return {
    handleSaveEmployee,
    handleDeleteEmployee,
    handleResetPasswordByHR,
  };
};

export default useEmployeeCRUD;
