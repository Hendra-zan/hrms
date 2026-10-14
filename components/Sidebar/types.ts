import type { View } from '../../types.ts';

export interface SidebarProps {
  activePortal: 'personal' | 'operational' | null;
  effectiveView: View;
  systemSettings: { institution_name?: string; logo_url?: string } | null;
  authUser: { profile?: { role?: string; nama?: string }; email?: string };
  canAccessOperationalPortal: boolean;
  pendingRequestsCount: number;
  isLoggingOut: boolean;
  isChangePasswordOpen: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hideHamburger?: boolean;

  // Callbacks
  onNavigate: (view: View, notesTab?: 'two-way' | 'personal') => void;
  onPortalToggle: () => void;
  onChangePasswordClick: () => void;
  onLogout: () => void;
  onAuditLogClick: () => void;
}
