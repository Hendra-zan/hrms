import { Employee } from '../../types.ts';

export interface UareUFingerprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fingerprintData: {
    template: string;
    format: string;
    quality?: number;
    hostname?: string;
    ip_local?: string;
  }) => void;
  employeeName?: string;
  employee?: Employee;
  actionType?: 'checkin' | 'checkout';
  mode?: 'verify' | 'enroll';
}

export type ScanPhase =
  | 'checking'
  | 'bridge_error'
  | 'no_device'
  | 'ready'
  | 'scanning'
  | 'processing'
  | 'success'
  | 'scan_failed';

export const SCAN_TIMEOUT_SECONDS = 10;
