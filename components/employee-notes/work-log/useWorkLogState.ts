import { useState, useEffect, useMemo } from 'react';
import { AuthenticatedUser, WorkLogEntry, WorkLogCategory, WorkLogShift, WorkLogStatus } from '../../../types.ts';
import { workLogService } from '../../../services/workLogService.ts';

export const useWorkLogState = (authUser: AuthenticatedUser, isKaruOrAbove: boolean) => {
  const userId = authUser.profile?.id || authUser.id;
  const userNama = authUser.profile?.nama || 'Saya';
  const unitId = authUser.profile?.unitKerjaId;

  const [subTab, setSubTab] = useState<'my_logs' | 'unit_logs'>('my_logs');
  const [myLogs, setMyLogs] = useState<WorkLogEntry[]>([]);
  const [unitLogs, setUnitLogs] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLogEntry | null>(null);

  // Form fields
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState<WorkLogShift>('pagi');
  const [formStartTime, setFormStartTime] = useState<string>('08:00');
  const [formEndTime, setFormEndTime] = useState<string>('12:00');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<WorkLogCategory>('pelayanan_pasien');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formPatientCount, setFormPatientCount] = useState<string>('');
  const [formStatus, setFormStatus] = useState<WorkLogStatus>('submitted');
  const [isSaving, setIsSaving] = useState(false);

  // Reject / Note Modal for Karu
  const [rejectLogId, setRejectLogId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');

  const calculatedDuration = useMemo(() => {
    if (!formStartTime || !formEndTime) return 0;
    const [h1, m1] = formStartTime.split(':').map(Number);
    const [h2, m2] = formEndTime.split(':').map(Number);
    let startMins = h1 * 60 + m1;
    let endMins = h2 * 60 + m2;
    if (endMins < startMins) endMins += 24 * 60;
    return Math.max(0, endMins - startMins);
  }, [formStartTime, formEndTime]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const logs = await workLogService.fetchWorkLogs(userId);
      setMyLogs(logs);

      if (isKaruOrAbove) {
        const uLogs = await workLogService.fetchUnitWorkLogs(unitId);
        setUnitLogs(uLogs);
      }
    } catch (err) {
      console.warn('Failed to load work logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userId, unitId]);

  const openCreateForm = () => {
    setEditingLog(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormShift('pagi');
    setFormStartTime('08:00');
    setFormEndTime('12:00');
    setFormTitle('');
    setFormCategory('pelayanan_pasien');
    setFormDescription('');
    setFormLocation('');
    setFormPatientCount('');
    setFormStatus('submitted');
    setIsFormOpen(true);
  };

  const openEditForm = (log: WorkLogEntry) => {
    setEditingLog(log);
    setFormDate(log.logDate);
    setFormShift(log.shift);
    setFormStartTime(log.startTime);
    setFormEndTime(log.endTime);
    setFormTitle(log.title);
    setFormCategory(log.category);
    setFormDescription(log.activityDescription);
    setFormLocation(log.location || '');
    setFormPatientCount(log.patientCount !== undefined ? String(log.patientCount) : '');
    setFormStatus(log.status);
    setIsFormOpen(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    setIsSaving(true);
    try {
      if (editingLog) {
        const success = await workLogService.updateWorkLog(editingLog.id, {
          logDate: formDate,
          shift: formShift,
          startTime: formStartTime,
          endTime: formEndTime,
          durationMinutes: calculatedDuration,
          title: formTitle.trim(),
          category: formCategory,
          activityDescription: formDescription.trim(),
          location: formLocation.trim() || undefined,
          patientCount: formPatientCount ? Number(formPatientCount) : undefined,
          status: formStatus,
        });
        if (success) loadLogs();
      } else {
        const res = await workLogService.createWorkLog({
          employeeId: userId,
          employeeNama: userNama,
          unitKerjaId: unitId,
          logDate: formDate,
          shift: formShift,
          startTime: formStartTime,
          endTime: formEndTime,
          durationMinutes: calculatedDuration,
          title: formTitle.trim(),
          category: formCategory,
          activityDescription: formDescription.trim(),
          location: formLocation.trim() || undefined,
          patientCount: formPatientCount ? Number(formPatientCount) : undefined,
          status: formStatus,
        });
        if (res.success) loadLogs();
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving work log:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Hapus entri logbook ini?')) return;
    const success = await workLogService.deleteWorkLog(id);
    if (success) {
      setMyLogs(prev => prev.filter(l => l.id !== id));
      setUnitLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleVerify = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const success = await workLogService.verifyWorkLog(id, userNama, status, notes);
    if (success) {
      setMyLogs(prev => prev.map(l => l.id === id ? { ...l, status, verifiedBy: userNama, verifierNotes: notes } : l));
      setUnitLogs(prev => prev.map(l => l.id === id ? { ...l, status, verifiedBy: userNama, verifierNotes: notes } : l));
      setRejectLogId(null);
      setRejectNote('');
    }
  };

  const activeLogs = subTab === 'my_logs' ? myLogs : unitLogs;

  const filteredLogs = useMemo(() => {
    return activeLogs.filter(l => {
      if (shiftFilter !== 'all' && l.shift !== shiftFilter) return false;
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = l.title.toLowerCase().includes(q);
        const matchDesc = l.activityDescription.toLowerCase().includes(q);
        const matchEmp = (l.employeeNama || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEmp) return false;
      }
      return true;
    });
  }, [activeLogs, shiftFilter, categoryFilter, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const totalMins = myLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
    const approvedCount = myLogs.filter(l => l.status === 'approved').length;
    const pendingCount = myLogs.filter(l => l.status === 'submitted').length;
    const unitPendingCount = unitLogs.filter(l => l.status === 'submitted').length;

    return {
      totalHours: (totalMins / 60).toFixed(1),
      totalLogs: myLogs.length,
      approvedCount,
      pendingCount,
      unitPendingCount,
    };
  }, [myLogs, unitLogs]);

  return {
    userId,
    userNama,
    unitId,
    subTab,
    setSubTab,
    myLogs,
    unitLogs,
    loading,
    selectedDate,
    setSelectedDate,
    shiftFilter,
    setShiftFilter,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    isFormOpen,
    setIsFormOpen,
    editingLog,
    formDate,
    setFormDate,
    formShift,
    setFormShift,
    formStartTime,
    setFormStartTime,
    formEndTime,
    setFormEndTime,
    formTitle,
    setFormTitle,
    formCategory,
    setFormCategory,
    formDescription,
    setFormDescription,
    formLocation,
    setFormLocation,
    formPatientCount,
    setFormPatientCount,
    formStatus,
    setFormStatus,
    isSaving,
    rejectLogId,
    setRejectLogId,
    rejectNote,
    setRejectNote,
    calculatedDuration,
    loadLogs,
    openCreateForm,
    openEditForm,
    handleSaveLog,
    handleDeleteLog,
    handleVerify,
    activeLogs,
    filteredLogs,
    metrics,
  };
};
