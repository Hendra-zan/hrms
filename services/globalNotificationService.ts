import { dataSupabase as supabase } from './dataSupabaseClient.ts';

export type NotificationType = 'shift_swap' | 'leave_request' | 'note' | 'document_warning';

export interface GlobalNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  timestamp: string;
  unread: boolean;
  targetView: string;
  targetTab?: string;
  rawItem?: any;
}

interface FetchNotificationsParams {
  userRole?: string | null;
  employeeId?: string | null;
  unitId?: string | null;
}

/**
 * Fetch unified role-specific notifications from Supabase
 */
export async function fetchGlobalNotifications(params: FetchNotificationsParams): Promise<GlobalNotificationItem[]> {
  const { userRole, employeeId, unitId } = params;
  const items: GlobalNotificationItem[] = [];

  const isKaru = userRole === 'kepala_ruangan';
  const isHr = userRole === 'hrd' || userRole === 'hr';
  const isAdmin = userRole === 'admin';

  try {
    // 1. Fetch Employee Notes / Inbox Messages
    if (employeeId) {
      const { data: notesData } = await (supabase as any)
        .from('employee_notes')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(10);

      if (notesData) {
        notesData.forEach((note: any) => {
          items.push({
            id: `note-${note.id}`,
            type: 'note',
            title: note.title || '💬 Catatan Internal Baru',
            content: note.content || 'Anda menerima pesan catatan kerja baru.',
            timestamp: note.created_at || new Date().toISOString(),
            unread: true,
            targetView: 'notes',
            rawItem: note,
          });
        });
      }
    }

    // 2. Fetch Shift Swap Requests
    const { data: swapData } = await (supabase as any)
      .from('shift_swap_requests')
      .select(`
        *,
        requester_employee:employees!requester_employee_id(id, nama),
        target_employee:employees!target_employee_id(id, nama)
      `)
      .order('created_at', { ascending: false })
      .limit(15);

    if (swapData) {
      swapData.forEach((swap: any) => {
        // Condition A: Peer target needs to approve
        if (swap.target_employee_id === employeeId && swap.overall_status === 'pending_peer') {
          items.push({
            id: `swap-${swap.id}`,
            type: 'shift_swap',
            title: '🔄 Permintaan Tukar Shift Dari Rekan',
            content: `${swap.requester_employee?.nama || 'Rekan kerja'} mengajak Anda bertukar shift. Alasan: ${swap.reason}`,
            timestamp: swap.created_at,
            unread: true,
            targetView: 'requests',
            targetTab: 'shift_swap',
            rawItem: swap,
          });
        }
        // Condition B: Karu needs to approve (for unit employees)
        else if (isKaru && swap.overall_status === 'pending_unit') {
          items.push({
            id: `swap-${swap.id}`,
            type: 'shift_swap',
            title: '📑 Tukar Shift Staf Menunggu Persetujuan',
            content: `${swap.requester_employee?.nama} & ${swap.target_employee?.nama} mengajukan tukar shift di unit Anda.`,
            timestamp: swap.created_at,
            unread: true,
            targetView: 'requests',
            targetTab: 'shift_swap',
            rawItem: swap,
          });
        }
      });
    }

    // 3. Fetch Leave & Permit Requests (requests)
    let reqData: any[] = [];
    try {
      const { data: d1, error: e1 } = await (supabase as any)
        .from('requests')
        .select('*')
        .in('status', ['Pending', 'pending', 'MENUNGGU', 'menunggu'])
        .order('requestedAt', { ascending: false })
        .limit(15);

      if (!e1 && d1) {
        reqData = d1;
      } else {
        const { data: d2 } = await (supabase as any)
          .from('requests')
          .select('*')
          .in('status', ['Pending', 'pending', 'MENUNGGU', 'menunggu'])
          .limit(15);
        reqData = d2 || [];
      }
    } catch { /* ignore fallback */ }

    if (reqData && reqData.length > 0) {
      reqData.forEach((req: any) => {
        const isApplicant = (req.employee_id || req.employeeId) === employeeId;
        const isApprover = (isKaru && (req.unit_id || req.unitId) === unitId) || isHr || isAdmin;

        if (isApprover && !isApplicant) {
          items.push({
            id: `req-${req.id}`,
            type: 'leave_request',
            title: `📋 Pengajuan ${req.type || 'Cuti/Izin'} Baru`,
            content: `${req.employee_name || req.employeeName || 'Staf'} mengajukan ${req.type || 'Cuti/Izin'} (${req.start_date || req.startDate || 'Tanggal'}). Status: Menunggu Approval.`,
            timestamp: req.requested_at || req.requestedAt || req.created_at || req.start_date || new Date().toISOString(),
            unread: true,
            targetView: 'requests',
            targetTab: 'requests',
            rawItem: req,
          });
        }
      });
    }
  } catch (err) {
    console.warn('[globalNotificationService] Error loading notifications:', err);
  }

  // Sort by newest timestamp
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
