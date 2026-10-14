import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, RefreshControl } from 'react-native';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { ReminderSettings } from './ReminderSettings';
import { ProfileScreenProps } from './types';
import { useProfileState } from './hooks/useProfileState';
import { ProfileHeaderHero } from './components/ProfileHeaderHero';
import { ProfilePersonalSection } from './components/ProfilePersonalSection';
import { ProfileSecuritySection } from './components/ProfileSecuritySection';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { ProfileFooter } from './components/ProfileFooter';

export function ProfileScreen({
  user,
  onGoDevice,
  onGoFaceEnrollment,
  onGoAnnouncements,
  onGoPayslips,
}: ProfileScreenProps) {
  const {
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
  } = useProfileState(user);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 1. Header Hero Card with Avatar */}
      <ProfileHeaderHero
        user={user}
        avatarUploading={avatarUploading}
        onChangeAvatar={handleChangeAvatar}
      />

      {/* 2. Announcements Menu Card */}
      {onGoAnnouncements && (
        <Pressable style={styles.announcementCard} onPress={onGoAnnouncements}>
          <View style={styles.announcementLeft}>
            <Text style={styles.announcementIcon}>📢</Text>
            <View>
              <Text style={styles.announcementTitle}>Kebijakan & Pengumuman</Text>
              <Text style={styles.announcementSubtitle}>Lihat informasi terbaru dari rumah sakit</Text>
            </View>
          </View>
          <Text style={styles.announcementArrow}>➔</Text>
        </Pressable>
      )}

      {/* 3. Personal & Professional Info Section */}
      <ProfilePersonalSection
        user={user}
        phoneEditing={phoneEditing}
        setPhoneEditing={setPhoneEditing}
        phoneDraft={phoneDraft}
        setPhoneDraft={setPhoneDraft}
        phoneSaving={phoneSaving}
        onSavePhone={handleSavePhone}
      />

      {/* 4. Payslip Quick Link */}
      {onGoPayslips && (
        <AppCard title="📄 Slip Gaji & Payroll">
          <View style={styles.payslipAction}>
            <AppButton title="Lihat Riwayat Slip Gaji" onPress={onGoPayslips} variant="primary" />
          </View>
        </AppCard>
      )}

      {/* 5. Reminder Settings */}
      <ReminderSettings />

      {/* 6. Security Settings */}
      <ProfileSecuritySection
        livenessSupported={livenessSupported}
        livenessEnabled={livenessEnabled}
        onToggleLiveness={handleToggleLiveness}
        fingerprintSupported={fingerprintSupported}
        fingerprintEnabled={fingerprintEnabled}
        onToggleFingerprint={handleToggleFingerprint}
        onGoFaceEnrollment={onGoFaceEnrollment}
        onGoDevice={onGoDevice}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onLogout={logout}
      />

      {/* 7. Footer & App Info */}
      <ProfileFooter />

      {/* 8. Password Change Modal */}
      <PasswordChangeModal
        visible={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setNewPassword('');
          setConfirmPassword('');
        }}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        saving={passwordSaving}
        onSubmit={handleChangePassword}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  announcementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  announcementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  announcementSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  announcementArrow: {
    fontSize: 16,
    color: '#0284c7',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  payslipAction: {
    marginTop: 4,
  },
});

export default ProfileScreen;
