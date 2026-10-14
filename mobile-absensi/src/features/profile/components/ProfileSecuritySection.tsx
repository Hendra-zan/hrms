import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppCard } from '../../../components/AppCard';
import { AppButton } from '../../../components/AppButton';

interface ProfileSecuritySectionProps {
  livenessSupported: boolean;
  livenessEnabled: boolean;
  onToggleLiveness: () => void;
  fingerprintSupported: boolean;
  fingerprintEnabled: boolean;
  onToggleFingerprint: () => void;
  onGoFaceEnrollment?: () => void;
  onGoDevice?: () => void;
  onOpenPasswordModal: () => void;
  onLogout: () => void;
}

export const ProfileSecuritySection: React.FC<ProfileSecuritySectionProps> = ({
  livenessSupported,
  livenessEnabled,
  onToggleLiveness,
  fingerprintSupported,
  fingerprintEnabled,
  onToggleFingerprint,
  onGoFaceEnrollment,
  onGoDevice,
  onOpenPasswordModal,
  onLogout,
}) => {
  return (
    <AppCard title="⚙️ Pengaturan Keamanan">
      <View style={styles.actions}>
        {livenessSupported ? (
          <AppButton
            title={livenessEnabled ? 'Nonaktifkan Deteksi Gerakan (Liveness)' : 'Aktifkan Deteksi Gerakan (Liveness)'}
            onPress={onToggleLiveness}
            variant={livenessEnabled ? 'danger' : 'primary'}
          />
        ) : (
          <AppButton
            title="Liveness Tidak Didukung Perangkat"
            onPress={() => {}}
            disabled
            variant="secondary"
          />
        )}
        {fingerprintSupported ? (
          <AppButton
            title={fingerprintEnabled ? 'Nonaktifkan Absen Sidik Jari (Fingerprint)' : 'Aktifkan Absen Sidik Jari (Fingerprint)'}
            onPress={onToggleFingerprint}
            variant={fingerprintEnabled ? 'danger' : 'primary'}
          />
        ) : null}
        {onGoFaceEnrollment && (
          <AppButton title="Daftar Biometrik Wajah" onPress={onGoFaceEnrollment} variant="secondary" />
        )}
        {onGoDevice && (
          <AppButton title="Kelola Perangkat Absen" onPress={onGoDevice} variant="secondary" />
        )}
        <AppButton title="Ubah Password Login" onPress={onOpenPasswordModal} variant="secondary" />
        <AppButton title="Keluar Akun" onPress={onLogout} variant="secondary" />
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
});
