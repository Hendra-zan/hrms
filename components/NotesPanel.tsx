import React, { useState, useEffect } from 'react';
import { SendNoteModal } from './employee-notes/SendNoteModal.tsx';
import { SendReportModal } from './employee-notes/SendReportModal.tsx';
import { WorkLogSection } from './employee-notes/WorkLogSection.tsx';
import { isKepalaRuanganRole, isAdminRole, isHrRole } from '../utils/roleUtils.ts';
import {
  NotesPanelProps,
  PersonalNote,
  useTwoWayNotesState,
  usePersonalNotesState,
  NotesHeaderHero,
  TwoWayNotesSection,
  PersonalNotesSection,
} from './notes/index.ts';

export type { PersonalNote };

export const NotesPanel: React.FC<NotesPanelProps> = ({
  authUser,
  employees = [],
  onNavigate,
  defaultTab,
}) => {
  const userId = authUser.profile?.id || authUser.id;
  const userRole = authUser.profile?.role || '';
  const canSendNotes = isKepalaRuanganRole(userRole) || isAdminRole(userRole) || isHrRole(userRole);
  const isKaruOrAbove = isKepalaRuanganRole(userRole) || isAdminRole(userRole);

  const [activeTab, setActiveTab] = useState<'two-way' | 'personal' | 'work-log'>(defaultTab || 'two-way');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // 1. Two-Way Notes State
  const twoWay = useTwoWayNotesState(userId);

  // 2. Personal Notes State
  const personal = usePersonalNotesState(userId);

  return (
    <div className="space-y-6">
      {/* 1. Header Hero & Tab Navigation */}
      <NotesHeaderHero
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadTwoWayCount={twoWay.unreadTwoWayCount}
        canSendNotes={canSendNotes}
        onOpenSendReport={() => twoWay.setIsSendReportOpen(true)}
        onOpenSendNote={() => twoWay.setIsSendNoteOpen(true)}
      />

      {/* 2. TAB 1: Catatan 2-Arah Atasan */}
      {activeTab === 'two-way' && (
        <TwoWayNotesSection
          userId={userId}
          canSendNotes={canSendNotes}
          twoWaySearch={twoWay.twoWaySearch}
          setTwoWaySearch={twoWay.setTwoWaySearch}
          twoWayDirectionFilter={twoWay.twoWayDirectionFilter}
          setTwoWayDirectionFilter={twoWay.setTwoWayDirectionFilter}
          twoWayCategoryFilter={twoWay.twoWayCategoryFilter}
          setTwoWayCategoryFilter={twoWay.setTwoWayCategoryFilter}
          twoWayStatusFilter={twoWay.twoWayStatusFilter}
          setTwoWayStatusFilter={twoWay.setTwoWayStatusFilter}
          loadingTwoWay={twoWay.loadingTwoWay}
          filteredTwoWayNotes={twoWay.filteredTwoWayNotes}
          selectedNote={twoWay.selectedNote}
          setSelectedNote={twoWay.setSelectedNote}
          noteReplies={twoWay.noteReplies}
          replyText={twoWay.replyText}
          setReplyText={twoWay.setReplyText}
          isSubmittingReply={twoWay.isSubmittingReply}
          isDeletingNote={twoWay.isDeletingNote}
          onSelectNote={(note) => {
            twoWay.setSelectedNote(note);
            twoWay.setReplyText(note.replyContent || '');
            if (note.status === 'unread') {
              twoWay.loadTwoWayNotes();
            }
          }}
          onConfirmAndReply={twoWay.handleConfirmAndReply}
          onChangeStatus={twoWay.handleChangeStatus}
          onDeleteNote={twoWay.handleDeleteTwoWayNote}
        />
      )}

      {/* 3. TAB 2: Catatan Saya (Kerja & Pribadi) */}
      {activeTab === 'personal' && (
        <PersonalNotesSection
          personalSearch={personal.personalSearch}
          setPersonalSearch={personal.setPersonalSearch}
          personalCategoryFilter={personal.personalCategoryFilter}
          setPersonalCategoryFilter={personal.setPersonalCategoryFilter}
          personalDateFilter={personal.personalDateFilter}
          setPersonalDateFilter={personal.setPersonalDateFilter}
          filteredPersonalNotes={personal.filteredPersonalNotes}
          isFormOpen={personal.isFormOpen}
          setIsFormOpen={personal.setIsFormOpen}
          editingPersonalNote={personal.editingPersonalNote}
          formTitle={personal.formTitle}
          setFormTitle={personal.setFormTitle}
          formContent={personal.formContent}
          setFormContent={personal.setFormContent}
          formCategory={personal.formCategory}
          setFormCategory={personal.setFormCategory}
          formColor={personal.formColor}
          setFormColor={personal.setFormColor}
          formIsPinned={personal.formIsPinned}
          setFormIsPinned={personal.setFormIsPinned}
          formDueDate={personal.formDueDate}
          setFormDueDate={personal.setFormDueDate}
          onOpenCreateForm={personal.openCreateForm}
          onOpenEditForm={personal.openEditForm}
          onSavePersonalNote={personal.handleSavePersonalNote}
          onDeletePersonalNote={personal.handleDeletePersonalNote}
          onTogglePinPersonalNote={personal.togglePinPersonalNote}
          onToggleCompletePersonalNote={personal.toggleCompletePersonalNote}
        />
      )}

      {/* 4. TAB 3: Logbook Aktivitas Kerja */}
      {activeTab === 'work-log' && (
        <WorkLogSection
          authUser={authUser}
          isKaruOrAbove={isKaruOrAbove}
        />
      )}

      {/* 5. Modals */}
      <SendNoteModal
        isOpen={twoWay.isSendNoteOpen}
        onClose={() => twoWay.setIsSendNoteOpen(false)}
        onNoteSent={() => {
          twoWay.setIsSendNoteOpen(false);
          twoWay.loadTwoWayNotes();
        }}
        senderId={userId}
        employees={employees}
      />

      <SendReportModal
        isOpen={twoWay.isSendReportOpen}
        onClose={() => twoWay.setIsSendReportOpen(false)}
        senderEmployee={authUser.profile}
        allEmployees={employees}
      />
    </div>
  );
};

export default NotesPanel;
