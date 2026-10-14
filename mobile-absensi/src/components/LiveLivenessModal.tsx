/**
 * src/components/LiveLivenessModal.tsx
 *
 * Guided Multi-Pose Liveness Detection using expo-camera.
 * Universally compatible with all Android and iOS devices.
 * 
 * Compares 3 poses sequentially (Front, Left, Right) to mathematically
 * prevent static photo spoofing.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeEmbeddingFromUri, cosineSimilarity } from '../services/faceRecognitionService';
import { haptics } from '../utils/haptics';

let useLivenessFallback = false;
let useTemporaryFallback = false;

// Muat preferensi kamera alternatif secara asinkron saat modul dimuat.
void AsyncStorage.getItem('@use_liveness_fallback').then((val) => {
  if (val === 'true') {
    useLivenessFallback = true;
  }
});

interface Props {
  visible: boolean;
  onComplete: (uri: string) => void;
  onCancel: () => void;
  fallbackOnUnavailable?: boolean;
}

type LivenessStep = 0 | 1 | 2 | 3; // 0: Front, 1: Left, 2: Right, 3: Verifying

const STEP_LABEL = [
  'Pose 1: Hadap Lurus ke Kamera',
  'Pose 2: Tengok ke Kiri Sedikit',
  'Pose 3: Tengok ke Kanan Sedikit',
  'Memproses Verifikasi Wajah...',
];

const STEP_HINT = [
  'Posisikan wajah Anda di tengah lingkaran dan hadap lurus.',
  'Putar wajah Anda sedikit ke kiri lalu ambil foto.',
  'Putar wajah Anda sedikit ke kanan lalu ambil foto.',
  'Harap tunggu sebentar, sistem sedang memverifikasi liveness.',
];

export function LiveLivenessModal({
  visible,
  onComplete,
  onCancel,
}: Props) {
  const cameraRef = useRef<any>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [step, setStep] = useState<LivenessStep>(0);
  const [capturedUris, setCapturedUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyingText, setVerifyingText] = useState('');

  // Reset state saat modal dibuka
  useEffect(() => {
    if (visible) {
      setStep(0);
      setCapturedUris([]);
      setLoading(false);
      setErrorMsg('');
      setVerifyingText('');
    }
  }, [visible]);

  // Request permissions
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const status = await Camera.getCameraPermissionsAsync();
        let granted = status.granted;
        if (!granted) {
          const ask = await Camera.requestCameraPermissionsAsync();
          granted = ask.granted;
        }
        setPermission(granted ? 'granted' : 'denied');
      } catch (err) {
        console.warn('[liveness] failed to request permission:', err);
        setPermission('denied');
      }
    })();
  }, [visible]);

  const cleanUpFiles = async (uris: string[]) => {
    for (const uri of uris) {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log(`[liveness] Cleaned up temporary file: ${uri}`);
      } catch (err) {
        console.warn('[liveness] Failed to delete temp file:', uri, err);
      }
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.45, // Dioptimalkan untuk memangkas memori RAM & ukuran berkas
        skipProcessing: false,
      });
      if (photo && photo.uri) {
        const newUris = [...capturedUris, photo.uri];
        setCapturedUris(newUris);
        haptics.success();

        if (step < 2) {
          setStep((step + 1) as LivenessStep);
        } else {
          setStep(3); // Verifying
          await runLivenessCheck(newUris);
        }
      }
    } catch (err: any) {
      console.warn('[liveness] capture error:', err);
      setErrorMsg('Gagal mengambil foto. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const runLivenessCheck = async (urisToCheck: string[]) => {
    setLoading(true);
    try {
      const probes: number[][] = [];
      let idx = 0;
      for (const uri of urisToCheck) {
        setVerifyingText(`Memproses pose ${idx + 1} dari 3...`);
        const emb = await computeEmbeddingFromUri(uri);
        probes.push(emb);
        idx++;
      }

      setVerifyingText('Mengevaluasi pergerakan wajah (Liveness)...');
      // Hitung kesamaan pairwise
      const pairwiseScores: number[] = [];
      for (let i = 0; i < probes.length - 1; i++) {
        pairwiseScores.push(cosineSimilarity(probes[i], probes[i + 1]));
      }
      const minPair = Math.min(...pairwiseScores);
      const maxPair = Math.max(...pairwiseScores);

      console.log(`[liveness] minPair: ${minPair.toFixed(4)}, maxPair: ${maxPair.toFixed(4)}`);

      if (maxPair > 0.97) {
        setErrorMsg('Liveness gagal: Terdeteksi foto statis (spoofing)! Harap gerakkan wajah Anda.');
        setStep(0);
        await cleanUpFiles(urisToCheck);
        setCapturedUris([]);
        return;
      }
      if (minPair < 0.45) {
        setErrorMsg('Liveness gagal: Wajah tidak konsisten atau terdeteksi orang berbeda.');
        setStep(0);
        await cleanUpFiles(urisToCheck);
        setCapturedUris([]);
        return;
      }

      // Berhasil! Hapus foto pose kiri (index 1) dan kanan (index 2) untuk menjaga memori HP bersih
      await cleanUpFiles([urisToCheck[1], urisToCheck[2]]);

      // Kirim pose lurus (indeks 0) ke caller
      onComplete(urisToCheck[0]);
    } catch (err: any) {
      console.warn('[liveness] verification failed:', err);
      setErrorMsg(err?.message || 'Gagal memproses verifikasi biometrik.');
      setStep(0);
      await cleanUpFiles(urisToCheck);
      setCapturedUris([]);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        {permission === 'pending' ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.dim}>Meminta izin kamera…</Text>
          </View>
        ) : permission === 'denied' ? (
          <View style={styles.center}>
            <Text style={styles.dim}>Izin kamera ditolak. Harap berikan izin di pengaturan.</Text>
            <Pressable style={styles.actionBtn} onPress={onCancel}>
              <Text style={styles.actionBtnText}>Tutup</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.container}>
            <View style={styles.topBar}>
              <Pressable style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>Batal</Text>
              </Pressable>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>POSE LIVENESS</Text>
              </View>
            </View>

            <View style={styles.cameraContainer}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
              />
              <View style={styles.guide} pointerEvents="none" />
            </View>

            <View style={styles.bottomBar}>
              <Text style={styles.prompt}>{STEP_LABEL[step]}</Text>
              <Text style={styles.hint}>{step === 3 && verifyingText ? verifyingText : STEP_HINT[step]}</Text>
              
              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              <View style={styles.buttonContainer}>
                {step < 3 ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.captureBtn,
                      { opacity: pressed || loading ? 0.75 : 1 }
                    ]}
                    onPress={takePhoto}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.captureBtnText}>Ambil Foto</Text>
                    )}
                  </Pressable>
                ) : (
                  <ActivityIndicator color={colors.primary} size="large" />
                )}
              </View>

              {/* Tombol bantuan jika kamera lambat */}
              {step < 3 && (
                <Pressable
                  style={styles.fallbackBtn}
                  onPress={() => {
                    setUseTemporaryFallback(true);
                    onCancel();
                    Alert.alert(
                      'Kamera Alternatif Aktif',
                      'Aplikasi beralih ke mode foto biasa untuk absensi ini. Silakan tekan kembali tombol absensi.'
                    );
                  }}
                >
                  <Text style={styles.fallbackBtnText}>Gunakan Kamera Sistem? Klik Di Sini</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

export const isLiveLivenessAvailable = () => !useLivenessFallback && !useTemporaryFallback;
export const isLivenessSupportedDevice = () => true;

export const setUseLivenessFallback = async (value: boolean) => {
  useLivenessFallback = value;
  await AsyncStorage.setItem('@use_liveness_fallback', value ? 'true' : 'false');
};

export const setUseTemporaryFallback = (value: boolean) => {
  useTemporaryFallback = value;
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#000' },
  dim: { color: '#fff', textAlign: 'center', paddingHorizontal: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cancelText: { color: '#fff', fontWeight: '700' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  guide: {
    width: 260,
    height: 320,
    borderRadius: 160,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  prompt: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  errorText: {
    color: colors.danger || '#ff4a4a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,74,74,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  captureBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: 14,
  },
  actionBtnText: { color: '#fff', fontWeight: '800' },
  fallbackBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  fallbackBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 12,
  },
});
