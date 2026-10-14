import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../auth/AuthContext';
import { authService } from '../../../services/authService';
import { changeAvatar } from '../../../services/avatarService';
import { haptics } from '../../../utils/haptics';
import { isLiveLivenessAvailable, isLivenessSupportedDevice, setUseLivenessFallback } from '../../../components/LiveLivenessModal';
import { MobileUser } from '../../../types';

export function useProfileState(user: MobileUser) {
  const { refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState<string>(user.telepon || '');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [livenessEnabled, setLivenessEnabled] = useState(false);
  const [livenessSupported, setLivenessSupported] = useState(false);
  const [fingerprintSupported, setFingerprintSupported] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    setLivenessSupported(isLivenessSupportedDevice());
    setLivenessEnabled(isLiveLivenessAvailable());

    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        setFingerprintSupported(hasHardware);

        const enabled = await AsyncStorage.getItem('@use_fingerprint');
        setFingerprintEnabled(enabled === 'true');
      } catch (err) {
        console.warn('Failed to load fingerprint status:', err);
      }
    })();
  }, []);

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Gagal', 'Password baru wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Gagal', 'Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Gagal', 'Konfirmasi password tidak cocok.');
      return;
    }

    setPasswordSaving(true);
    try {
      await authService.changePassword(newPassword);
      haptics.success();
      Alert.alert('Sukses', 'Password login Anda berhasil diubah.');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      haptics.error();
      Alert.alert('Gagal', err?.message || 'Gagal mengubah password. Silakan coba lagi.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleToggleLiveness = async () => {
    const newVal = !livenessEnabled;
    await setUseLivenessFallback(!newVal);
    setLivenessEnabled(newVal);
    haptics.success();
    Alert.alert(
      newVal ? 'Verifikasi Gerakan Aktif' : 'Verifikasi Gerakan Nonaktif',
      newVal
        ? 'Aplikasi kini akan mewajibkan verifikasi gerakan wajah (kedip & senyum) saat melakukan absensi.'
        : 'Aplikasi kini menggunakan mode foto biasa tanpa gerakan.'
    );
  };

  const handleToggleFingerprint = async () => {
    if (!fingerprintSupported) {
      Alert.alert('Tidak Didukung', 'Sensor biometrik sidik jari tidak ditemukan pada perangkat ini.');
      return;
    }

    const newVal = !fingerprintEnabled;
    if (newVal) {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifikasi sidik jari Anda',
        fallbackLabel: 'Gunakan Password',
      });
      if (!res.success) {
        Alert.alert('Gagal', 'Verifikasi biometrik dibatalkan atau gagal.');
        return;
      }
    }

    await AsyncStorage.setItem('@use_fingerprint', newVal ? 'true' : 'false');
    setFingerprintEnabled(newVal);
    haptics.success();
    Alert.alert(
      newVal ? 'Biometrik Aktif' : 'Biometrik Nonaktif',
      newVal
        ? 'Login cepat dengan sidik jari/FaceID kini telah diaktifkan.'
        : 'Login cepat dengan sidik jari telah dinonaktifkan.'
    );
  };

  const handleSavePhone = async () => {
    if (phoneDraft.trim() === (user.telepon || '')) {
      setPhoneEditing(false);
      return;
    }
    setPhoneSaving(true);
    try {
      await authService.updateContactInfo({ telepon: phoneDraft.trim() });
      await refreshProfile();
      haptics.success();
      setPhoneEditing(false);
      Alert.alert('Sukses', 'Nomor telepon berhasil diperbarui.');
    } catch (err: any) {
      haptics.error();
      Alert.alert('Gagal', err?.message || 'Gagal memperbarui nomor telepon.');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleChangeAvatar = async () => {
    setAvatarUploading(true);
    try {
      const url = await changeAvatar(user.id);
      if (url) {
        await refreshProfile();
        haptics.success();
        Alert.alert('Sukses', 'Foto profil berhasil diperbarui.');
      }
    } catch (err: any) {
      haptics.error();
      Alert.alert('Gagal', err?.message || 'Gagal mengunggah foto profil.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return {
    refreshing,
    onRefresh,
    phoneEditing,
    setPhoneEditing,
    phoneDraft,
    setPhoneDraft,
    phoneSaving,
    handleSavePhone,
    avatarUploading,
    handleChangeAvatar,
    livenessEnabled,
    livenessSupported,
    handleToggleLiveness,
    fingerprintSupported,
    fingerprintEnabled,
    handleToggleFingerprint,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordSaving,
    handleChangePassword,
    logout,
  };
}
