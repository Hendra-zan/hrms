import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Modal, ActivityIndicator } from 'react-native';
import { colors } from '../../../theme/colors';

interface PasswordChangeModalProps {
  visible: boolean;
  onClose: () => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  saving: boolean;
  onSubmit: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  visible,
  onClose,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  saving,
  onSubmit,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ubah Password Login</Text>
          <View style={styles.modalDivider} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password Baru</Text>
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Masukkan password baru..."
              style={styles.modalInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
            <TextInput
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Ulangi password baru..."
              style={styles.modalInput}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={[styles.modalBtn, styles.modalCancelBtn]}
            >
              <Text style={styles.modalCancelBtnText}>Batal</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={saving}
              style={[styles.modalBtn, styles.modalSaveBtn]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Simpan Password</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#f8fafc',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  modalCancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    minWidth: 120,
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
