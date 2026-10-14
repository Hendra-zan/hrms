import React from 'react';
import { WorkLogSectionProps } from './types.ts';
import { useWorkLogState } from './useWorkLogState.ts';
import { WorkLogToolbar } from './WorkLogToolbar.tsx';
import { WorkLogCardList } from './WorkLogCardList.tsx';
import { WorkLogFormModal } from './WorkLogFormModal.tsx';
import { KaruRejectModal } from './KaruRejectModal.tsx';

export const WorkLogSection: React.FC<WorkLogSectionProps> = ({ authUser, isKaruOrAbove }) => {
  const state = useWorkLogState(authUser, isKaruOrAbove);

  return (
    <div className="space-y-6">
      <WorkLogToolbar
        isKaruOrAbove={isKaruOrAbove}
        subTab={state.subTab}
        setSubTab={state.setSubTab}
        metrics={state.metrics}
        shiftFilter={state.shiftFilter}
        setShiftFilter={state.setShiftFilter}
        categoryFilter={state.categoryFilter}
        setCategoryFilter={state.setCategoryFilter}
        statusFilter={state.statusFilter}
        setStatusFilter={state.setStatusFilter}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        openCreateForm={state.openCreateForm}
      />

      <WorkLogCardList
        subTab={state.subTab}
        loading={state.loading}
        filteredLogs={state.filteredLogs}
        openCreateForm={state.openCreateForm}
        openEditForm={state.openEditForm}
        handleDeleteLog={state.handleDeleteLog}
        handleVerify={state.handleVerify}
        setRejectLogId={state.setRejectLogId}
      />

      <WorkLogFormModal
        isFormOpen={state.isFormOpen}
        setIsFormOpen={state.setIsFormOpen}
        editingLog={state.editingLog}
        formDate={state.formDate}
        setFormDate={state.setFormDate}
        formShift={state.formShift}
        setFormShift={state.setFormShift}
        formStartTime={state.formStartTime}
        setFormStartTime={state.setFormStartTime}
        formEndTime={state.formEndTime}
        setFormEndTime={state.setFormEndTime}
        formTitle={state.formTitle}
        setFormTitle={state.setFormTitle}
        formCategory={state.formCategory}
        setFormCategory={state.setFormCategory}
        formDescription={state.formDescription}
        setFormDescription={state.setFormDescription}
        formLocation={state.formLocation}
        setFormLocation={state.setFormLocation}
        formPatientCount={state.formPatientCount}
        setFormPatientCount={state.setFormPatientCount}
        formStatus={state.formStatus}
        setFormStatus={state.setFormStatus}
        isSaving={state.isSaving}
        calculatedDuration={state.calculatedDuration}
        handleSaveLog={state.handleSaveLog}
      />

      <KaruRejectModal
        rejectLogId={state.rejectLogId}
        setRejectLogId={state.setRejectLogId}
        rejectNote={state.rejectNote}
        setRejectNote={state.setRejectNote}
        handleVerify={state.handleVerify}
      />
    </div>
  );
};
