import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/colors';
import { formatDateID } from '../../utils/date';
import { scheduleService, type EmployeeSchedule } from '../../services/scheduleService';
import { createShiftSwapRequest } from '../../services/shiftSwapService';
import { supabase } from '../../config/supabase';
import type { MobileUser } from '../../types';

interface ShiftSwapModalProps {
  visible: boolean;
  onClose: () => void;
  user: MobileUser;
  onSuccess: () => void;
}

export function ShiftSwapModal({ visible, onClose, user, onSuccess }: ShiftSwapModalProps) {
  const [mySchedules, setMySchedules] = useState<EmployeeSchedule[]>([]);
  const [selectedMySchedule, setSelectedMySchedule] = useState<EmployeeSchedule | null>(null);
  const [peers, setPeers] = useState<any[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null);
  const [peerSchedules, setPeerSchedules] = useState<EmployeeSchedule[]>([]);
  const [selectedPeerSchedule, setSelectedPeerSchedule] = useState<EmployeeSchedule | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && user.employeeId) {
      loadInitialData();
    } else {
      resetState();
    }
  }, [visible, user]);

  const resetState = () => {
    setMySchedules([]);
    setSelectedMySchedule(null);
    setPeers([]);
    setSelectedPeer(null);
    setPeerSchedules([]);
    setSelectedPeerSchedule(null);
    setReason('');
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Ambil jadwal milik sendiri
      const myScheds = await scheduleService.listForEmployee(user.employeeId || user.id);
      setMySchedules(myScheds.filter(s => !s.isOffDay && s.status === 'published'));

      // 2. Ambil daftar rekan kerja di unit/departemen yang sama
      let query = (supabase as any)
        .from('employees')
        .select('id, nama, jabatan, departemen, foto')
        .neq('id', user.employeeId || user.id);

      if (user.departemen) {
        query = query.eq('departemen', user.departemen);
      }

      const { data: peerData, error: peerErr } = await query;
      if (!peerErr && peerData) {
        setPeers(peerData);
      }
    } catch (e: any) {
      console.warn('Failed to load shift swap data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPeer = async (peer: any) => {
    setSelectedPeer(peer);
    setSelectedPeerSchedule(null);
    try {
      const pScheds = await scheduleService.listForEmployee(peer.id);
      setPeerSchedules(pScheds.filter(s => !s.isOffDay && s.status === 'published'));
    } catch (e) {
      setPeerSchedules([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMySchedule) {
      Alert.alert('Peringatan', 'Pilih jadwal Anda yang ingin ditukar');
      return;
    }
    if (!selectedPeer) {
      Alert.alert('Peringatan', 'Pilih rekan kerja yang diajak bertukar');
      return;
    }
    if (!selectedPeerSchedule) {
      Alert.alert('Peringatan', 'Pilih jadwal milik rekan kerja yang ingin diambil');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Peringatan', 'Mohon isi alasan pengajuan tukar shift');
      return;
    }

    setSubmitting(true);
    try {
      await createShiftSwapRequest({
        requesterEmployeeId: user.employeeId || user.id,
        requesterScheduleId: selectedMySchedule.id,
        targetEmployeeId: selectedPeer.id,
        targetScheduleId: selectedPeerSchedule.id,
        reason: reason.trim(),
      });
      Alert.alert('Berhasil', 'Pengajuan tukar shift berhasil dikirim ke rekan kerja');
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal mengajukan tukar shift');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Pengajuan Tukar Shift</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
          ) : (
            <FlatList
              data={[1]}
              keyExtractor={() => 'form'}
              showsVerticalScrollIndicator={false}
              renderItem={() => (
                <View style={styles.formContainer}>
                  {/* 1. Pilih Jadwal Milik Sendiri */}
                  <Text style={styles.sectionLabel}>1. Pilih Jadwal Anda yang Ditolak/Ditukar</Text>
                  {mySchedules.length === 0 ? (
                    <Text style={styles.emptyText}>Tidak ada jadwal aktif ditemukan</Text>
                  ) : (
                    <View style={styles.optionsWrap}>
                      {mySchedules.slice(0, 7).map((s) => {
                        const isSelected = selectedMySchedule?.id === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => setSelectedMySchedule(s)}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {formatDateID(s.scheduleDate)} ({s.shiftName})
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {/* 2. Pilih Rekan Kerja */}
                  <Text style={styles.sectionLabel}>2. Pilih Rekan Kerja (Satu Unit/Departemen)</Text>
                  {peers.length === 0 ? (
                    <Text style={styles.emptyText}>Tidak ada rekan kerja ditemukan</Text>
                  ) : (
                    <View style={styles.optionsWrap}>
                      {peers.map((p) => {
                        const isSelected = selectedPeer?.id === p.id;
                        return (
                          <Pressable
                            key={p.id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => handleSelectPeer(p)}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              👤 {p.nama}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {/* 3. Pilih Jadwal Rekan Kerja */}
                  {selectedPeer && (
                    <>
                      <Text style={styles.sectionLabel}>
                        3. Pilih Jadwal {selectedPeer.nama} yang Diambil
                      </Text>
                      {peerSchedules.length === 0 ? (
                        <Text style={styles.emptyText}>Rekan kerja belum memiliki jadwal aktif</Text>
                      ) : (
                        <View style={styles.optionsWrap}>
                          {peerSchedules.slice(0, 7).map((ps) => {
                            const isSelected = selectedPeerSchedule?.id === ps.id;
                            return (
                              <Pressable
                                key={ps.id}
                                style={[styles.chip, isSelected && styles.chipActive]}
                                onPress={() => setSelectedPeerSchedule(ps)}
                              >
                                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                  {formatDateID(ps.scheduleDate)} ({ps.shiftName})
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}

                  {/* 4. Alasan */}
                  <Text style={styles.sectionLabel}>4. Alasan Tukar Shift</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Ada keperluan keluarga mendadak"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.actions}>
                    <AppButton
                      title="Batal"
                      variant="secondary"
                      onPress={onClose}
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    <AppButton
                      title={submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                      onPress={handleSubmit}
                      disabled={submitting}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#06736a',
    borderColor: '#06736a',
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
