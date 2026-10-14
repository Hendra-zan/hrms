import type { MobileUser } from '../../../types';

export interface PayslipsHistoryScreenProps {
  user: MobileUser;
  onBack: () => void;
}

export const formatCurrency = (val: number) => {
  return `Rp ${val.toLocaleString('id-ID')}`;
};
