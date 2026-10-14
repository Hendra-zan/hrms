import { NoteCategory, NotePriority } from '../../types.ts';
import {
  fetchNotesForEmployee,
  fetchNotesInvolvingUser,
  fetchNotesSentBy,
  fetchSupervisors,
} from './noteQueries.ts';
import {
  createNote,
  replyAndConfirmNote,
  fetchNoteReplies,
  addNoteReply,
  toggleSubTask,
  deleteNote,
} from './noteMutations.ts';

export const employeeNotesService = {
  fetchNotesForEmployee,
  fetchNotesInvolvingUser,
  fetchNotesSentBy,
  fetchSupervisors,
  createNote,
  replyAndConfirmNote,
  fetchNoteReplies,
  addNoteReply,
  toggleSubTask,
  deleteNote,
  async createEmployeeNote(note: {
    employeeId: string;
    senderId: string;
    category: NoteCategory;
    priority?: NotePriority;
    title: string;
    content: string;
    direction?: 'top_down' | 'bottom_up';
    attachmentUrl?: string;
  }) {
    return createNote(note);
  },
};
