import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';
import { MobileUser } from '../../../types';

interface ProfilePersonalSectionProps {
  user: MobileUser;
  phoneEditing: boolean;
  setPhoneEditing: (val: boolean) => void;
  phoneDraft: string;
  setPhoneDraft: (val: string) => void;
  phoneSaving: boolean;
  onSavePhone: () => void;
}

export const ProfilePersonalSection: React.FC<ProfilePersonalSectionProps> = ({
  user,
  phoneEditing,
  setPhoneEditing,
  phoneDraft,
  setPhoneDraft,
  phoneSaving,
  onSavePhone,
}) => {
  const infoRows = [
    { label: 'NIK / No. Karyawan', value: user.nik || '-', icon: '🔢', key: 'nik' },
    { label: 'Jabatan', value: user.jabatan || '-', icon: '💼', key: 'jabatan' },
    { label: 'Unit Kerja / Departemen', value: user.departemen || '-', icon: '🏥', key: 'departemen' },
    { label: 'Shift Kerja', value: user.shift || 'Reguler', icon: '⏱️', key: 'shift' },
    { label: 'Email', value: user.email || '-', icon: '✉️', key: 'email' },
    { label: 'Nomor Telepon / WA', value: user.telepon || '-', icon: '📱', key: 'telepon' },
    { label: 'Nomor STR/SIP', value: (user as any).nomorSTR || '-', icon: '📜', key: 'str' },
    { label: 'Status Kepegawaian', value: user.status || 'Aktif', icon: '✅', key: 'status' },
  ];

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Detail Profil</Text>
      <View style={styles.divider} />
      {infoRows.map((row, idx) => {
        const isTelepon = row.key === 'telepon';
        return (
          <View key={row.label}>
            <View style={styles.row}>
              <Text style={styles.rowIcon}>{row.icon}</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                {isTelepon && phoneEditing ? (
                  <View style={styles.inlinePhoneEdit}>
                    <TextInput
                      value={phoneDraft}
                      onChangeText={setPhoneDraft}
                      placeholder="+62 812-XXXX-XXXX"
                      keyboardType="phone-pad"
                      style={styles.inlinePhoneInput}
                      autoFocus
                    />
                    <View style={styles.inlinePhoneActions}>
                      <Pressable
                        onPress={() => {
                          setPhoneDraft(user.telepon || '');
                          setPhoneEditing(false);
                        }}
                        style={styles.inlineCancelBtn}
                      >
                        <Text style={styles.inlineCancelBtnText}>Batal</Text>
                      </Pressable>
                      <Pressable
                        onPress={onSavePhone}
                        disabled={phoneSaving}
                        style={styles.inlineSaveBtn}
                      >
                        <Text style={styles.inlineSaveBtnText}>
                          {phoneSaving ? '...' : 'Simpan'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.rowValueContainer}>
                    <Text style={styles.rowValue}>{row.value}</Text>
                    {isTelepon && (
                      <Pressable onPress={() => setPhoneEditing(true)} style={styles.editIconBtn} hitSlop={12}>
                        <Text style={styles.editIconText}>✏️ Ubah</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </View>
            {idx < infoRows.length - 1 && <View style={styles.subDivider} />}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  subDivider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginVertical: 10,
    marginLeft: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  editIconBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  editIconText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  inlinePhoneEdit: {
    marginTop: 6,
  },
  inlinePhoneInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  inlinePhoneActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  inlineCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  inlineCancelBtnText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  inlineSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  inlineSaveBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
});
