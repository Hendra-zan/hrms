import { Employee } from '../../types';
import type { NewEmployeeData } from '../../components/EmployeeForm';

export type SaveEmployeePayload = Employee | NewEmployeeData;

export interface EmployeeCRUDResult {
  handleSaveEmployee: (employeeData: SaveEmployeePayload, newPassword?: string) => Promise<void>;
  handleDeleteEmployee: (id: string) => Promise<void>;
  handleResetPasswordByHR: (employeeId: string, newPassword?: string) => Promise<boolean | void>;
}
