import { Employee, WorkUnit, SortKey, SortDirection } from '../../types.ts';
import { ImportResult, ImportOptions } from '../../hooks/useEmployeeImport.ts';

export interface EmployeeTableProps {
  employees: Employee[];
  workUnits?: WorkUnit[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onView: (employee: Employee) => void;
  onImport?: (employeesData: any[], options?: ImportOptions) => Promise<ImportResult>;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  isViewOnly?: boolean;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
