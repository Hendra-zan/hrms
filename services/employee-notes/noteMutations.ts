import { EmployeeNote, NoteCategory, NotePriority, NoteStatus } from '../../types.ts';
import {
  NoteReply,
  getLocalNotes,
  saveLocalNotes,
  getNotesTable,
  getRepliesTable,
} from './types.ts';

export async function createNote(note: {
  employeeId: string;
  senderId: string;
  category: NoteCategory;
  priority?: NotePriority;
  title: string;
  content: string;
  direction?: 'top_down' | 'bottom_up';
  attachmentUrl?: string;
}): Promise<{ success: boolean; data?: EmployeeNote; error?: string }> {
  const nowIso = new Date().toISOString();
  const newNote: EmployeeNote = {
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    employeeId: note.employeeId,
    senderId: note.senderId,
    category: note.category,
    priority: note.priority || 'normal',
    title: note.title,
    content: note.content,
    status: 'unread',
    direction: note.direction || 'top_down',
    attachmentUrl: note.attachmentUrl,
    createdAt: nowIso,
  };

  try {
    const { data, error } = await getNotesTable()
      .insert({
        employee_id: note.employeeId,
        sender_id: note.senderId,
        category: note.category,
        priority: note.priority || 'normal',
        title: note.title,
        content: note.content,
        status: 'unread',
        direction: note.direction || 'top_down',
      })
      .select()
      .single();

    if (error) {
      console.warn('[employeeNotesService] DB Insert Error, fallback local:', error.message);
      const local = getLocalNotes();
      saveLocalNotes([newNote, ...local]);
      return { success: true, data: newNote };
    }

    const row: any = data;
    const created: EmployeeNote = {
      id: String(row.id),
      employeeId: row.employee_id,
      senderId: row.sender_id,
      category: row.category as NoteCategory,
      priority: row.priority as NotePriority,
      title: row.title,
      content: row.content,
      status: 'unread',
      createdAt: row.created_at,
    };

    const local = getLocalNotes();
    saveLocalNotes([created, ...local]);

    return { success: true, data: created };
  } catch (err: any) {
    const local = getLocalNotes();
    saveLocalNotes([newNote, ...local]);
    return { success: true, data: newNote };
  }
}

export async function replyAndConfirmNote(
  noteId: string,
  replyContent?: string,
  newStatus: NoteStatus = 'confirmed'
): Promise<boolean> {
  const nowIso = new Date().toISOString();

  try {
    const updatePayload: any = {
      status: newStatus,
      confirmed_at: nowIso,
    };
    if (replyContent !== undefined) {
      updatePayload.reply_content = replyContent;
    }

    const { error } = await getNotesTable()
      .update(updatePayload)
      .eq('id', noteId);

    if (error) {
      console.warn('[employeeNotesService] DB update error, fallback local:', error.message);
    }

    const local = getLocalNotes().map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          status: newStatus,
          confirmedAt: nowIso,
          replyContent: replyContent !== undefined ? replyContent : n.replyContent,
        };
      }
      return n;
    });
    saveLocalNotes(local);

    return true;
  } catch (err) {
    console.warn('[employeeNotesService] Error replying to note:', err);
    return false;
  }
}

export async function fetchNoteReplies(noteId: string): Promise<NoteReply[]> {
  if (!noteId) return [];

  try {
    const { data, error } = await getRepliesTable()
      .select(`
        id,
        note_id,
        sender_id,
        message,
        attachment_url,
        created_at,
        sender:sender_id(nama, role)
      `)
      .eq('note_id', noteId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[employeeNotesService] Fallback replies local:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      noteId: row.note_id,
      senderId: row.sender_id,
      senderNama: row.sender?.nama || 'Pengirim',
      senderRole: row.sender?.role || '',
      message: row.message,
      attachmentUrl: row.attachment_url,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[employeeNotesService] Error fetching note replies:', err);
    return [];
  }
}

export async function addNoteReply(
  noteId: string,
  senderId: string,
  message: string,
  attachmentUrl?: string,
  newStatus: NoteStatus = 'read'
): Promise<{ success: boolean; data?: NoteReply }> {
  const nowIso = new Date().toISOString();
  const newReply: NoteReply = {
    id: `rpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    noteId,
    senderId,
    senderNama: 'Saya',
    message,
    attachmentUrl,
    createdAt: nowIso,
  };

  try {
    const { data, error } = await getRepliesTable()
      .insert({
        note_id: noteId,
        sender_id: senderId,
        message,
        attachment_url: attachmentUrl,
      })
      .select(`
        id,
        note_id,
        sender_id,
        message,
        attachment_url,
        created_at,
        sender:sender_id(nama, role)
      `)
      .single();

    if (error) {
      console.warn('[employeeNotesService] Reply insert DB fallback:', error.message);
    }

    await replyAndConfirmNote(noteId, message, newStatus);

    const resData = data as any;
    const created: NoteReply = resData
      ? {
          id: String(resData.id),
          noteId: resData.note_id,
          senderId: resData.sender_id,
          senderNama: resData.sender?.nama || 'Saya',
          senderRole: resData.sender?.role || '',
          message: resData.message,
          attachmentUrl: resData.attachment_url,
          createdAt: resData.created_at,
        }
      : newReply;

    return { success: true, data: created };
  } catch (err) {
    console.warn('[employeeNotesService] Error adding note reply:', err);
    return { success: true, data: newReply };
  }
}

export async function toggleSubTask(noteId: string, todoId: string, done: boolean): Promise<boolean> {
  try {
    const local = getLocalNotes().map((n) => {
      if (n.id === noteId && n.todos) {
        return {
          ...n,
          todos: n.todos.map((t) => (t.id === todoId ? { ...t, done } : t)),
        };
      }
      return n;
    });
    saveLocalNotes(local);
    return true;
  } catch (err) {
    console.warn('[employeeNotesService] Error toggling subtask:', err);
    return false;
  }
}

export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const { error } = await getNotesTable().delete().eq('id', noteId);

    if (error) {
      console.warn('[employeeNotesService] deleteNote DB error:', error.message);
    }

    const local = getLocalNotes().filter((n) => n.id !== noteId);
    saveLocalNotes(local);

    return true;
  } catch (err) {
    console.warn('[employeeNotesService] deleteNote error:', err);
    return false;
  }
}
