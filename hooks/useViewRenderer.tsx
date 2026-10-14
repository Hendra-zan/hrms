/**
 * useViewRenderer.tsx
 * Centralized view rendering for the main app shell.
 */

import React from 'react';
import type {
  Employee,
  View,
  AuthenticatedUser,
  AttendanceRecord,
  AllRequest,
  WorkUnit,
  Department,
  Position,
  SystemSettings,
  SortKey,
  AttendanceChangeRequest,
  AttendanceRevisionHistory,
  ShiftDefinition,
} from '../types';
import type { RequestType, RequestStatus } from '../types';
import { DEFAULT_SHIFT_DEFINITIONS } from '../types';
import { mergeAllUnitShiftDefs } from '../utils/mergeShiftDefs';

import {
  renderDashboard,
  renderEmployeeAttendanceDetail,
  renderEmployeeSelfService,
} from './viewRendererHelpers.tsx';

import { canManageOrganization, canManageSystemSettings } from '../services/portalAccessService';

import { lazyWithRetry } from '../utils/lazyWithRetry';

const Dashboard = lazyWithRetry(() => import('../components/Dashboard'));
const EmployeeTable = lazyWithRetry(() => import('../components/EmployeeTable'));
const OrganizationSettings = lazyWithRetry(() => import('../components/OrganizationSettings'));
const SystemSettings = lazyWithRetry(() => import('../components/SystemSettings'));
const HikvisionPanel = lazyWithRetry(() => import('../components/HikvisionPanel'));
const GuidePanel = lazyWithRetry(() => import('../components/GuidePanel'));
const AttendanceManagement = lazyWithRetry(() => import('../components/AttendanceManagement'));
const PayrollManagement = lazyWithRetry(() => import('../components/PayrollManagement'));
const RequestManagement = lazyWithRetry(() => import('../components/RequestManagement'));
const UnitScheduleManagement = lazyWithRetry(() => import('../components/UnitScheduleManagement'));
const AuditLogViewer = lazyWithRetry(() => import('../components/AuditLogViewer'));
const AnnouncementsPanel = lazyWithRetry(() => import('../components/AnnouncementsPanel'));
const NotesPanel = lazyWithRetry(() => import('../components/NotesPanel'));

interface ViewRendererProps {
  effectiveView: View;
  authUser: AuthenticatedUser;
  employees: Employee[];
  employeesWithDocuments: Employee[];
  sortedAndFilteredEmployees: Employee[];
  attendanceRecords: AttendanceRecord[];
  allRequests: AllRequest[];
  workUnits: WorkUnit[];
  departments: Department[];
  positions: Position[];
  systemSettings: SystemSettings | null;
  dataLoading: boolean;
  sortKey: SortKey | string;
  sortDirection: 'asc' | 'desc';
  onSort: (key: string) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (id: string) => Promise<void> | void;
  onView: (emp: Employee) => void;
  onNavigateToEmployeeAttendanceDetail: (emp: Employee) => void;
  onImport: (importedData?: any[]) => Promise<void> | void;
  handleSaveWorkUnit: (wu: unknown) => void;
  handleDeleteWorkUnit: (wu: unknown) => void;
  handleSaveDepartment: (dept: unknown) => void;
  handleDeleteDepartment: (dept: unknown) => void;
  handleSavePosition: (pos: unknown) => void;
  handleDeletePosition: (pos: unknown) => void;
  handleUpdateSystemSettings: (settings: unknown) => void;
  handleSaveOperationalAttendance: (record: unknown) => Promise<boolean> | void;
  loadPendingAttendanceChangeRequests: () => Promise<AttendanceChangeRequest[]> | void;
  loadAttendanceRevisionHistory: () => Promise<AttendanceRevisionHistory[]> | void;
  handleApproveAttendanceChangeRequest: (requestId: string, note?: string) => Promise<boolean> | void;
  handleRejectAttendanceChangeRequest: (requestId: string, note?: string) => Promise<boolean> | void;
  handleUpdateRequestStatus: (requestId: string, type: RequestType | string, newStatus: RequestStatus | string) => Promise<void> | void;
  handleNewRequest: (request: unknown) => void;
  handleSavePersonalAttendance: (record: unknown) => Promise<boolean> | void;
  onBackFromEmployeeAttendanceDetail: () => void;
  employeeToView: Employee | null;
  isAdminRole: (role: string) => boolean;
  isKepalaRuanganRole: (role: string) => boolean;
  isHrRole: (role: string) => boolean;
  onNavigate?: (view: View) => void;
  essDefaultTab?: 'overview' | 'attendance' | 'profile' | 'kinerja' | 'chat';
  notesDefaultTab?: 'two-way' | 'personal';
  setEssDefaultTab?: (tab: 'overview' | 'attendance' | 'profile' | 'kinerja' | 'chat') => void;
  essAutoOpenAction?: 'payslip' | 'leave' | 'reimbursement' | null;
  setEssAutoOpenAction?: (action: 'payslip' | 'leave' | 'reimbursement' | null) => void;
  /** Active portal — used to enforce operational-only views */
  activePortal?: 'personal' | 'operational' | null;
}

export const renderViewContent = (props: ViewRendererProps): React.ReactNode => {
  const {
    effectiveView,
    authUser,
    employees,
    employeesWithDocuments,
    sortedAndFilteredEmployees,
    attendanceRecords,
    allRequests,
    workUnits,
    departments,
    positions,
    systemSettings,
    dataLoading,
    sortKey,
    sortDirection,
    onSort,
    onEdit,
    onDelete,
    onView,
    onImport,
    onNavigateToEmployeeAttendanceDetail,
    handleSaveWorkUnit,
    handleDeleteWorkUnit,
    handleSaveDepartment,
    handleDeleteDepartment,
    handleSavePosition,
    handleDeletePosition,
    handleUpdateSystemSettings,
    handleSaveOperationalAttendance,
    loadPendingAttendanceChangeRequests,
    loadAttendanceRevisionHistory,
    handleApproveAttendanceChangeRequest,
    handleRejectAttendanceChangeRequest,
    handleUpdateRequestStatus,
    handleNewRequest,
    handleSavePersonalAttendance,
    onBackFromEmployeeAttendanceDetail,
    employeeToView,
    isAdminRole,
    isKepalaRuanganRole,
    isHrRole,
    onNavigate,
    essDefaultTab,
    notesDefaultTab,
    setEssDefaultTab,
    essAutoOpenAction,
    setEssAutoOpenAction,
    activePortal,
  } = props;

  const userRole = authUser?.profile?.role;

  /** Helper: renders an access-denied card for operational-only views */
  const operationalOnly = (label: string) => (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-6 text-center animate-portal-enter">
      <div className="text-3xl mb-3">🔒</div>
      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Akses Ditolak — {label}</p>
      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
        Halaman ini hanya tersedia di <strong>Portal Operasional</strong>.
        Beralih portal melalui sidebar untuk melanjutkan.
      </p>
    </div>
  );

  switch (effectiveView) {
    case 'employees':
      return (
        <EmployeeTable
          employees={sortedAndFilteredEmployees}
          workUnits={workUnits}
          onEdit={onEdit as any}
          onDelete={onDelete as any}
          onView={onView as any}
          onImport={onImport as any}
          sortKey={sortKey as any}
          sortDirection={sortDirection}
          onSort={onSort}
          isViewOnly={isKepalaRuanganRole(authUser?.profile?.role)}
        />
      );

    case 'organization':
      // Admin-only, operational portal only
      if (activePortal !== 'operational') return operationalOnly('Pengaturan Organisasi');
      if (!canManageOrganization(userRole)) return null;
      return (
        <OrganizationSettings
          workUnits={workUnits}
          departments={departments}
          positions={positions}
          onSaveWorkUnit={handleSaveWorkUnit}
          onDeleteWorkUnit={handleDeleteWorkUnit}
          onSaveDepartment={handleSaveDepartment}
          onDeleteDepartment={handleDeleteDepartment}
          onSavePosition={handleSavePosition}
          onDeletePosition={handleDeletePosition}
        />
      );

    case 'system':
      // Admin-only, operational portal only
      if (activePortal !== 'operational') return operationalOnly('Pengaturan Sistem');
      if (!canManageSystemSettings(userRole)) return null;
      return (
        <SystemSettings settings={systemSettings} onUpdate={handleUpdateSystemSettings as any} loading={dataLoading} />
      );

    case 'attendance':
    case 'attendance-report': {
      const allShifts = mergeAllUnitShiftDefs(
        workUnits as any[],
        systemSettings?.default_shifts
      );
      return (
        <AttendanceManagement
          employees={employees}
          attendanceRecords={attendanceRecords}
          onSave={handleSaveOperationalAttendance as any}
          canManageAttendance={true}
          canApproveAttendanceRequests={true}
          currentUserId={authUser.id}
          onLoadPendingRequests={loadPendingAttendanceChangeRequests as any}
          onLoadRevisionHistory={loadAttendanceRevisionHistory as any}
          onApproveRequest={handleApproveAttendanceChangeRequest as any}
          onRejectRequest={handleRejectAttendanceChangeRequest as any}
          onOpenEmployeeHistory={onNavigateToEmployeeAttendanceDetail}
          isReportMode={effectiveView === 'attendance-report'}
          shiftDefinitions={allShifts}
        />
      );
    }

    case 'payroll':
      return <PayrollManagement employees={employees} attendanceRecords={attendanceRecords} />;

    case 'requests':
      return (
        <RequestManagement
          allRequests={allRequests}
          employees={employees}
          onUpdateRequestStatus={handleUpdateRequestStatus}
          currentUserRole={authUser.profile.role}
          currentEmployeeId={authUser.profile.id}
        />
      );

    case 'audit-log':
      // Admin-only, operational portal only
      if (activePortal !== 'operational') return operationalOnly('Audit Log');
      return isAdminRole(authUser.profile.role) ? <AuditLogViewer isInline /> : null;

    case 'guide':
      return <GuidePanel />;

    case 'announcements':
      return <AnnouncementsPanel authUser={authUser} defaultTab="semua" titleOverride="📢 Pusat Pengumuman & Kebijakan RS" />;

    case 'policies':
      return <AnnouncementsPanel authUser={authUser} defaultTab="kebijakan" titleOverride="📜 Pusat Pengumuman & Kebijakan RS" />;

    case 'notes':
      return <NotesPanel authUser={authUser} employees={employees} onNavigate={onNavigate} defaultTab={notesDefaultTab} />;

    case 'unit-schedule':
      return isKepalaRuanganRole(authUser.profile.role) ? <UnitScheduleManagement kepalaRuangan={authUser.profile} /> : null;

    case 'ess': {
      return renderEmployeeSelfService(
        authUser,
        employeesWithDocuments,
        attendanceRecords,
        allRequests,
        handleNewRequest,
        handleSavePersonalAttendance,
        onEdit,
        essDefaultTab,
        onNavigate,
        essAutoOpenAction
      );
    }

    case 'personal-dashboard':
      return <Dashboard employees={employees} currentUser={authUser.profile} attendanceRecords={attendanceRecords} onNavigate={(view, tab, action) => {
        if (view === 'ess' && onNavigate) {
          if (tab && setEssDefaultTab) setEssDefaultTab(tab);
          if (action && setEssAutoOpenAction) setEssAutoOpenAction(action);
          onNavigate('ess' as View);
        } else if (onNavigate) {
          onNavigate(view as View);
        }
      }} />;

    case 'employee-attendance-detail':
      return renderEmployeeAttendanceDetail(employeeToView, attendanceRecords, workUnits, loadAttendanceRevisionHistory as any, onBackFromEmployeeAttendanceDetail);

    case 'dashboard':
    default:
      return renderDashboard(authUser, employees, attendanceRecords, allRequests, isAdminRole, isHrRole, isKepalaRuanganRole, onNavigate, handleUpdateRequestStatus as any);
  }
};
