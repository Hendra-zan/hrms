import { useState, useEffect, useMemo, useCallback } from 'react';
import { EmployeeNote } from '../../../types.ts';
import { employeeNotesService, NoteReply } from '../../../services/employeeNotesService.ts';

export const useTwoWayNotesState = (userId: string) => {
  const [twoWayNotes, setTwoWayNotes] = useState<EmployeeNote[]>([]);
  const [loadingTwoWay, setLoadingTwoWay] = useState(true);
  const [selectedNote, setSelectedNote] = useState<EmployeeNote | null>(null);
  const [noteReplies, setNoteReplies] = useState<NoteReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isSendNoteOpen, setIsSendNoteOpen] = useState(false);
  const [isSendReportOpen, setIsSendReportOpen] = useState(false);
  const [twoWayCategoryFilter, setTwoWayCategoryFilter] = useState<string>('all');
  const [twoWayDirectionFilter, setTwoWayDirectionFilter] = useState<string>('all');
  const [twoWayStatusFilter, setTwoWayStatusFilter] = useState<string>('all');
  const [twoWaySearch, setTwoWaySearch] = useState('');
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null);

  const loadTwoWayNotes = useCallback(async () => {
    if (!userId) return;
    setLoadingTwoWay(true);
    try {
      const notes = await employeeNotesService.fetchNotesInvolvingUser(userId);
      setTwoWayNotes(notes);
    } catch (err) {
      console.warn('Failed to load two-way notes:', err);
    } finally {
      setLoadingTwoWay(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTwoWayNotes();
  }, [loadTwoWayNotes]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    import('../../../services/supabaseClient.ts').then(({ supabase }) => {
      const sub = supabase
        .channel(`notes-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employee_notes',
            filter: `employee_id=eq.${userId}`,
          },
          () => {
            loadTwoWayNotes();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'employee_notes',
            filter: `sender_id=eq.${userId}`,
          },
          () => {
            loadTwoWayNotes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(sub);
      };
    });
  }, [userId, loadTwoWayNotes]);

  // Fetch thread replies when selectedNote changes
  useEffect(() => {
    if (selectedNote?.id) {
      employeeNotesService.fetchNoteReplies(selectedNote.id).then(replies => {
        setNoteReplies(replies);
      });
    } else {
      setNoteReplies([]);
    }
  }, [selectedNote?.id]);

  const handleConfirmAndReply = async (noteId: string) => {
    if (!noteId || !replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await employeeNotesService.addNoteReply(noteId, userId, replyText.trim(), undefined, 'confirmed');
      if (res.success && res.data) {
        setNoteReplies(prev => [...prev, res.data!]);
        setTwoWayNotes(prev => prev.map(n => {
          if (n.id === noteId) {
            return {
              ...n,
              status: 'confirmed',
              replyContent: replyText.trim() || n.replyContent,
              confirmedAt: new Date().toISOString(),
            };
          }
          return n;
        }));
        if (selectedNote?.id === noteId) {
          setSelectedNote(prev => prev ? {
            ...prev,
            status: 'confirmed',
            replyContent: replyText.trim() || prev.replyContent,
            confirmedAt: new Date().toISOString(),
          } : null);
        }
        setReplyText('');
      }
    } catch (err) {
      console.error('Error replying note:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleChangeStatus = async (noteId: string, newStatus: 'rejected' | 'escalated') => {
    const label = newStatus === 'rejected' ? 'menolak' : 'mengeskasi';
    if (!confirm(`Apakah Anda yakin ingin ${label} catatan/laporan ini?`)) return;
    const success = await employeeNotesService.replyAndConfirmNote(noteId, undefined, newStatus);
    if (success) {
      setTwoWayNotes(prev => prev.map(n => n.id === noteId ? { ...n, status: newStatus } : n));
      if (selectedNote?.id === noteId) setSelectedNote(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleDeleteTwoWayNote = async (noteId: string) => {
    if (!confirm('Hapus catatan ini secara permanen? Tindakan ini tidak bisa dibatalkan.')) return;
    setIsDeletingNote(noteId);
    try {
      await employeeNotesService.deleteNote(noteId);
      setTwoWayNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) setSelectedNote(null);
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setIsDeletingNote(null);
    }
  };

  const filteredTwoWayNotes = useMemo(() => {
    return twoWayNotes.filter(note => {
      if (twoWayCategoryFilter !== 'all' && note.category !== twoWayCategoryFilter) return false;
      if (twoWayDirectionFilter !== 'all' && note.direction !== twoWayDirectionFilter) return false;
      if (twoWayStatusFilter !== 'all' && note.status !== twoWayStatusFilter) return false;
      if (twoWaySearch.trim()) {
        const q = twoWaySearch.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchContent = note.content.toLowerCase().includes(q);
        const matchSender = (note.senderNama || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchSender) return false;
      }
      return true;
    });
  }, [twoWayNotes, twoWayCategoryFilter, twoWayDirectionFilter, twoWayStatusFilter, twoWaySearch]);

  const unreadTwoWayCount = useMemo(() => {
    return twoWayNotes.filter(n => n.status === 'unread').length;
  }, [twoWayNotes]);

  return {
    twoWayNotes,
    loadingTwoWay,
    selectedNote,
    setSelectedNote,
    noteReplies,
    replyText,
    setReplyText,
    isSubmittingReply,
    isSendNoteOpen,
    setIsSendNoteOpen,
    isSendReportOpen,
    setIsSendReportOpen,
    twoWayCategoryFilter,
    setTwoWayCategoryFilter,
    twoWayDirectionFilter,
    setTwoWayDirectionFilter,
    twoWayStatusFilter,
    setTwoWayStatusFilter,
    twoWaySearch,
    setTwoWaySearch,
    isDeletingNote,
    filteredTwoWayNotes,
    unreadTwoWayCount,
    loadTwoWayNotes,
    handleConfirmAndReply,
    handleChangeStatus,
    handleDeleteTwoWayNote,
  };
};
