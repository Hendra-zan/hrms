import { RequestType, RequestStatus } from '../../services/requestService';

export const TYPES: RequestType[] = ['Cuti', 'Izin', 'Overtime', 'Reimburse'];

export const STATUS_STYLE: Record<RequestStatus, { bg: string; fg: string; label: string }> = {
    Pending: { bg: '#FEF3C7', fg: '#92400E', label: 'Menunggu' },
    Approved: { bg: '#DCFCE7', fg: '#166534', label: 'Disetujui' },
    Rejected: { bg: '#FEE2E2', fg: '#991B1B', label: 'Ditolak' },
};
