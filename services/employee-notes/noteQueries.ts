import { supabase } from '../supabaseClient.ts';
import { EmployeeNote, NoteCategory, NotePriority, NoteStatus } from '../../types.ts';
import {
  getLocalNotes,
  saveLocalNotes,
  getNotesTable,
} from './types.ts';

export async function fetchNotesForEmployee(employeeId: string): Promise<EmployeeNote[]> {
  if (!employeeId) return [];

  try {
    const { data, error } = await getNotesTable()
      .select(`
        id,
        employee_id,
        sender_id,
        category,
        priority,
        title,
        content,
        reply_content,
        status,
        confirmed_at,
        created_at,
        sender:sender_id(nama, role),
        employee:employee_id(nama)
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[employeeNotesService] Fallback to local storage:', error.message);
      return getLocalNotes().filter((n) => n.employeeId === employeeId);
    }

    const notes: EmployeeNote[] = (data || []).map((row: any) => ({
      id: String(row.id),
      employeeId: row.employee_id,
      senderId: row.sender_id,
      senderNama: row.sender?.nama || 'Atasan / HRD',
      senderRole: row.sender?.role || 'Atasan',
      category: (row.category as NoteCategory) || 'general',
      priority: (row.priority as NotePriority) || 'normal',
      title: row.title,
      content: row.content,
      replyContent: row.reply_content || '',
      status: (row.status as NoteStatus) || 'unread',
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
      employeeNama: row.employee?.nama || '',
    }));

    const local = getLocalNotes().filter((n) => n.employeeId !== employeeId);
    saveLocalNotes([...local, ...notes]);

    return notes;
  } catch (err) {
    console.warn('[employeeNotesService] Error fetching notes:', err);
    return getLocalNotes().filter((n) => n.employeeId === employeeId);
  }
}

export async function fetchNotesInvolvingUser(userId: string): Promise<EmployeeNote[]> {
  if (!userId) return [];

  try {
    const { data, error } = await getNotesTable()
      .select(`
        id,
        employee_id,
        sender_id,
        category,
        priority,
        title,
        content,
        reply_content,
        status,
        confirmed_at,
        created_at,
        sender:sender_id(nama, role),
        employee:employee_id(nama)
      `)
      .or(`employee_id.eq.${userId},sender_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[employeeNotesService] Fallback involving user:', error.message);
      return getLocalNotes().filter((n) => n.employeeId === userId || n.senderId === userId);
    }

    return (data || []).map((row: any) => {
      const isSender = row.sender_id === userId;
      const dir = isSender ? 'bottom_up' : 'top_down';
      return {
        id: String(row.id),
        employeeId: row.employee_id,
        senderId: row.sender_id,
        senderNama: row.sender?.nama || 'Atasan / HRD',
        senderRole: row.sender?.role || 'Atasan',
        category: (row.category as NoteCategory) || 'general',
        priority: (row.priority as NotePriority) || 'normal',
        title: row.title,
        content: row.content,
        replyContent: row.reply_content || '',
        status: (row.status as NoteStatus) || 'unread',
        direction: dir,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
        employeeNama: row.employee?.nama || 'Staf',
      };
    });
  } catch (err) {
    console.warn('[employeeNotesService] Error fetching involving notes:', err);
    return getLocalNotes().filter((n) => n.employeeId === userId || n.senderId === userId);
  }
}

export async function fetchNotesSentBy(senderId: string): Promise<EmployeeNote[]> {
  if (!senderId) return [];

  try {
    const { data, error } = await getNotesTable()
      .select(`
        id,
        employee_id,
        sender_id,
        category,
        priority,
        title,
        content,
        reply_content,
        status,
        confirmed_at,
        created_at,
        sender:sender_id(nama, role),
        employee:employee_id(nama)
      `)
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[employeeNotesService] Fallback sent notes:', error.message);
      return getLocalNotes().filter((n) => n.senderId === senderId);
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      employeeId: row.employee_id,
      senderId: row.sender_id,
      senderNama: row.sender?.nama || 'Saya',
      senderRole: row.sender?.role || 'Atasan',
      category: (row.category as NoteCategory) || 'general',
      priority: (row.priority as NotePriority) || 'normal',
      title: row.title,
      content: row.content,
      replyContent: row.reply_content || '',
      status: (row.status as NoteStatus) || 'unread',
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
      employeeNama: row.employee?.nama || '',
    }));
  } catch (err) {
    console.warn('[employeeNotesService] Error fetching sent notes:', err);
    return getLocalNotes().filter((n) => n.senderId === senderId);
  }
}

export async function fetchSupervisors(
  senderId: string,
  senderUnitId?: string
): Promise<
  {
    id: string;
    nama: string;
    nik?: string;
    role?: string;
    jabatan?: string;
    unitKerjaId?: string;
  }[]
> {
  try {
    const { data: allRows, error: allError } = await supabase
      .from('employees')
      .select('*')
      .order('nama', { ascending: true });

    const results: Map<string, any> = new Map();

    if (!allError && allRows) {
      const supervisorKeywords = ['karu', 'kepala', 'admin', 'hrd', 'hr', 'manajer', 'direktur', 'supervisor'];

      for (const row of allRows) {
        if (row.id === senderId) continue;

        const role = (row.role || '').toLowerCase();
        const isSupervisor = supervisorKeywords.some((kw) => role.includes(kw));
        const rowUnitId = (row as any).unitKerjaId ?? (row as any).unit_kerja_id ?? null;

        if (isSupervisor || (senderUnitId && rowUnitId === senderUnitId)) {
          results.set(row.id, {
            id: row.id,
            nama: row.nama,
            nik: row.nik,
            role: row.role,
            jabatan: row.jabatan,
            unitKerjaId: rowUnitId,
          });
        }
      }
    }

    return Array.from(results.values());
  } catch (err) {
    console.warn('[employeeNotesService] Error fetching supervisors:', err);
    return [];
  }
}
