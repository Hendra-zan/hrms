import { useState, useEffect, useMemo } from 'react';
import { PersonalNote } from '../types.ts';

export const usePersonalNotesState = (userId: string) => {
  const personalStorageKey = `hrms_personal_user_notes_${userId}`;
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>(() => {
    try {
      const raw = localStorage.getItem(personalStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [personalSearch, setPersonalSearch] = useState('');
  const [personalCategoryFilter, setPersonalCategoryFilter] = useState<string>('all');
  const [personalDateFilter, setPersonalDateFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPersonalNote, setEditingPersonalNote] = useState<PersonalNote | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'kerja' | 'pribadi' | 'tugas' | 'pengingat'>('kerja');
  const [formColor, setFormColor] = useState<'teal' | 'blue' | 'purple' | 'amber' | 'rose'>('teal');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formDueDate, setFormDueDate] = useState<string>('');

  useEffect(() => {
    if (userId) {
      localStorage.setItem(personalStorageKey, JSON.stringify(personalNotes));
    }
  }, [personalNotes, userId, personalStorageKey]);

  const openCreateForm = () => {
    setEditingPersonalNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('kerja');
    setFormColor('teal');
    setFormIsPinned(false);
    setFormDueDate('');
    setIsFormOpen(true);
  };

  const openEditForm = (note: PersonalNote) => {
    setEditingPersonalNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category);
    setFormColor(note.colorTag);
    setFormIsPinned(note.isPinned);
    setFormDueDate(note.dueDate || '');
    setIsFormOpen(true);
  };

  const handleSavePersonalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;
    const nowIso = new Date().toISOString();
    if (editingPersonalNote) {
      setPersonalNotes(prev => prev.map(n => {
        if (n.id === editingPersonalNote.id) {
          return {
            ...n,
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
            colorTag: formColor,
            isPinned: formIsPinned,
            dueDate: formDueDate || undefined,
            updatedAt: nowIso,
          };
        }
        return n;
      }));
    } else {
      const newNote: PersonalNote = {
        id: `pnote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        colorTag: formColor,
        isPinned: formIsPinned,
        isCompleted: false,
        dueDate: formDueDate || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setPersonalNotes(prev => [newNote, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleDeletePersonalNote = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan pribadi ini?')) {
      setPersonalNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const togglePinPersonalNote = (id: string) => {
    setPersonalNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const toggleCompletePersonalNote = (id: string) => {
    setPersonalNotes(prev => prev.map(n => n.id === id ? { ...n, isCompleted: !n.isCompleted, updatedAt: new Date().toISOString() } : n));
  };

  const filteredPersonalNotes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return personalNotes
      .filter(n => {
        if (personalCategoryFilter !== 'all' && n.category !== personalCategoryFilter) return false;
        if (personalDateFilter === 'today') {
          if (!n.dueDate) return false;
          const d = new Date(n.dueDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }
        if (personalDateFilter === 'week') {
          const d = new Date(n.createdAt);
          return d >= weekAgo;
        }
        if (personalDateFilter === 'month') {
          const d = new Date(n.createdAt);
          return d >= monthStart;
        }
        if (personalDateFilter === 'overdue') {
          if (!n.dueDate || n.isCompleted) return false;
          const d = new Date(n.dueDate);
          d.setHours(0, 0, 0, 0);
          return d < today;
        }
        if (personalSearch.trim()) {
          const q = personalSearch.toLowerCase();
          return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        const da = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.updatedAt).getTime();
        const db = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.updatedAt).getTime();
        return da - db;
      });
  }, [personalNotes, personalCategoryFilter, personalDateFilter, personalSearch]);

  return {
    personalNotes,
    personalSearch,
    setPersonalSearch,
    personalCategoryFilter,
    setPersonalCategoryFilter,
    personalDateFilter,
    setPersonalDateFilter,
    isFormOpen,
    setIsFormOpen,
    editingPersonalNote,
    formTitle,
    setFormTitle,
    formContent,
    setFormContent,
    formCategory,
    setFormCategory,
    formColor,
    setFormColor,
    formIsPinned,
    setFormIsPinned,
    formDueDate,
    setFormDueDate,
    filteredPersonalNotes,
    openCreateForm,
    openEditForm,
    handleSavePersonalNote,
    handleDeletePersonalNote,
    togglePinPersonalNote,
    toggleCompletePersonalNote,
  };
};
