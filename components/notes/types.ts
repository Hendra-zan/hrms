import { AuthenticatedUser, Employee, EmployeeNote } from '../../types.ts';

export interface PersonalNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'kerja' | 'pribadi' | 'tugas' | 'pengingat';
  colorTag: 'teal' | 'blue' | 'purple' | 'amber' | 'rose';
  isPinned: boolean;
  isCompleted: boolean;
  dueDate?: string; // ISO date string YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface NotesPanelProps {
  authUser: AuthenticatedUser;
  employees?: Employee[];
  onNavigate?: (view: any) => void;
  defaultTab?: 'two-way' | 'personal' | 'work-log';
}
