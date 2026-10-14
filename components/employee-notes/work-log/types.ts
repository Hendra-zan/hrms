import { AuthenticatedUser, WorkLogEntry, WorkLogCategory, WorkLogShift, WorkLogStatus } from '../../../types.ts';

export interface WorkLogSectionProps {
  authUser: AuthenticatedUser;
  isKaruOrAbove: boolean;
}

export const CATEGORY_LABEL_MAP: Record<WorkLogCategory, string> = {
  pelayanan_pasien: '🩺 Pelayanan Pasien',
  tindakan_medis: '💉 Tindakan Medis',
  administrasi: '📄 Administrasi / Rekam Medis',
  rapat_koordinasi: '👥 Rapat & Shift Handover',
  pemeliharaan_alat: '🛠️ Pemeliharaan Alat',
  edukasi_pasien: '📢 Edukasi / Penyuluhan',
  lainnya: '📌 Aktivitas Lainnya',
};

export const SHIFT_LABEL_MAP: Record<WorkLogShift, string> = {
  pagi: '🌅 Shift Pagi',
  siang: '☀️ Shift Siang',
  malam: '🌙 Shift Malam',
  non_shift: '🏢 Jam Kerja Biasa',
};
