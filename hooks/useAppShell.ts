/**
 * useAppShell.ts
 * Manages app shell state: portal selection, view routing, data organization
 * Extracted from App.tsx to reduce complexity
 */

import { useMemo, useEffect } from 'react';
import { useAuth, useAppData, useUI, useUIActions } from '../stores/appStore';
import { RouteRegistry } from '../config/routesConfig';
import { canAccessOperationalPortal } from '../services/portalAccessService';
import { isKepalaRuanganRole } from '../utils/roleUtils';
import { RequestStatus } from '../types';
import type { View, Document, SortKey } from '../types';

export interface AppShellState {
  // Portal & auth
  activePortal: 'personal' | 'operational' | null;
  authUser: ReturnType<typeof useAuth>['authUser'];
  canAccessOperationalPortal: boolean;

  // Views
  effectiveView: View;
  isPersonalView: boolean;

  // Data
  employees: ReturnType<typeof useAppData>['employees'];
  employeesWithDocuments: Array<any>;
  sortedAndFilteredEmployees: Array<any>;

  // UI state
  pendingRequestsCount: number;
  dataLoading: boolean;
}

export interface AppShellActions {
  handlePortalChange: (nextPortal: 'personal' | 'operational', source: 'selector' | 'toggle') => void;
  handleSort: (key: SortKey) => void;
}

/**
 * Centralizes all app shell logic in one place
 * Returns both state and action handlers
 */
export const useAppShell = (): [AppShellState, AppShellActions] => {
  // Get all required state
  const { authUser } = useAuth();
  const {
    employees,
    documents,
    allRequests,
    dataLoading,
  } = useAppData();

  const {
    activePortal,
    view,
    searchTerm,
    statusFilter,
    departmentFilter,
    unitFilter,
    sortKey,
    sortDirection,
  } = useUI();

  const {
    setActivePortal,
    setView,
    setSortKey,
    setSortDirection,
    setSearchTerm,
    setStatusFilter,
    setDepartmentFilter,
    setUnitFilter,
  } = useUIActions();

  // Single source of truth: delegate to portalAccessService
  const canAccessOperational = useMemo(() => {
    if (!authUser) return false;
    return canAccessOperationalPortal(authUser.profile.role);
  }, [authUser]);

  // Force personal portal if no access to operational
  useEffect(() => {
    if (!authUser) return;
    if (!canAccessOperational && activePortal !== 'personal') {
      setActivePortal('personal');
      setView('personal-dashboard');
    }
  }, [authUser, canAccessOperational, activePortal, setActivePortal, setView]);

  // Determine effective view based on portal and current view
  const effectiveView = useMemo<View>(() => {
    if (activePortal === 'personal') {
      if (RouteRegistry.isAllowedInPortal(view, 'personal')) return view;
      return 'personal-dashboard';
    }

    if (activePortal === 'operational') {
      if (view === 'personal-dashboard' || view === 'ess') return 'dashboard';
      return view;
    }

    return view;
  }, [activePortal, view]);

  // Combine employees with their documents
  const employeesWithDocuments = useMemo(() => {
    const docsByEmployee = documents.reduce((acc, doc) => {
      (acc[doc.employeeId] = acc[doc.employeeId] || []).push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

    return employees.map((emp) => ({
      ...emp,
      documents: docsByEmployee[emp.id] || [],
    }));
  }, [employees, documents]);

  // Apply search and sort, with role-based filtering for kepala ruangan
  const sortedAndFilteredEmployees = useMemo(() => {
    let filteredEmployees = [...employeesWithDocuments];

    const normalizedSearchTerm = String(searchTerm || '').trim().toLowerCase();
    const normalizedStatusFilter = String(statusFilter || '').trim().toLowerCase();
    const normalizedDepartmentFilter = String(departmentFilter || '').trim().toLowerCase();
    const normalizedUnitFilter = String(unitFilter || '').trim().toLowerCase();

    // Filter by unit for kepala ruangan
    if (isKepalaRuanganRole(authUser?.profile?.role)) {
      const userUnitId = authUser?.profile?.unitKerjaId;
      if (userUnitId) {
        filteredEmployees = filteredEmployees.filter((e) => e.unitKerjaId === userUnitId);
      }
    }

    if (normalizedStatusFilter) {
      filteredEmployees = filteredEmployees.filter(
        (e) => String(e?.status || '').trim().toLowerCase() === normalizedStatusFilter
      );
    }

    if (normalizedDepartmentFilter) {
      filteredEmployees = filteredEmployees.filter((e) =>
        String(e?.departemen || '').trim().toLowerCase() === normalizedDepartmentFilter
      );
    }

    if (normalizedUnitFilter) {
      filteredEmployees = filteredEmployees.filter((e) =>
        String(e?.unitKerjaId || '').trim().toLowerCase() === normalizedUnitFilter
      );
    }

    // Apply search filter
    if (normalizedSearchTerm) {
      filteredEmployees = filteredEmployees.filter((e) => {
        const searchTarget = [
          e?.nama,
          e?.nik,
          e?.email,
          e?.jabatan,
          e?.departemen,
          e?.unitKerjaId,
        ]
          .map((value) => String(value || '').toLowerCase())
          .join(' ');

        return searchTarget.includes(normalizedSearchTerm);
      });
    }

    // Apply sorting
    return filteredEmployees.sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a] || '';
      const bVal = b[sortKey as keyof typeof b] || '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    employeesWithDocuments,
    searchTerm,
    statusFilter,
    departmentFilter,
    unitFilter,
    sortKey,
    sortDirection,
    authUser,
  ]);

  // Count pending requests
  const pendingRequestsCount = useMemo(() => {
    return allRequests.filter((req) => req.status === RequestStatus.Pending).length;
  }, [allRequests]);

  // Check if current view is personal view or shared view
  const isPersonalView = RouteRegistry.isAllowedInPortal(effectiveView, 'personal');

  // State object
  const state: AppShellState = {
    activePortal,
    authUser,
    canAccessOperationalPortal: canAccessOperational,
    effectiveView,
    isPersonalView,
    employees,
    employeesWithDocuments,
    sortedAndFilteredEmployees,
    pendingRequestsCount,
    dataLoading,
  };

  // Action handlers
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePortalChange = (nextPortal: 'personal' | 'operational', _source: 'selector' | 'toggle') => {
    // 1. Switch portal and navigate to its default view
    setActivePortal(nextPortal);
    setView(nextPortal === 'personal' ? 'personal-dashboard' : 'dashboard');

    // 2. Reset all filters so operational search state doesn't bleed into personal view
    setSearchTerm('');
    setStatusFilter('');
    setDepartmentFilter('');
    setUnitFilter('');
  };

  const actions: AppShellActions = {
    handlePortalChange,
    handleSort,
  };

  return [state, actions];
};
