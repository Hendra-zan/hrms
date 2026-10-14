import type { MobileUser } from '../../types';

export interface ProfileScreenProps {
  user: MobileUser;
  onGoDevice?: () => void;
  onGoFaceEnrollment?: () => void;
  onGoAnnouncements?: () => void;
  onGoPayslips?: () => void;
}
