import { supabase } from '../supabaseClient.ts';
import { EmployeeNote } from '../../types.ts';

export interface NoteReply {
  id: string;
  noteId: string;
  senderId: string;
  senderNama: string;
  senderRole?: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export const LOCAL_STORAGE_KEY = 'hrms_local_employee_notes';

export function getLocalNotes(): EmployeeNote[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalNotes(notes: EmployeeNote[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Failed to save notes to localStorage:', err);
  }
}

export const getNotesTable = () => (supabase as any).from('employee_notes');
export const getRepliesTable = () => (supabase as any).from('employee_note_replies');
