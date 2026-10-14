/**
 * src/services/faceRecognitionService.ts
 *
 * On-device face recognition pakai TensorFlow Lite (MobileFaceNet).
 *
 * Flow:
 *  - `loadModel()` once at app start (cached).
 *  - `computeEmbeddingFromUri(uri)` — load image, resize 112×112, normalize,
 *    run TFLite, return Float32Array (192-dim).
 *  - `cosineSimilarity(a, b)` — compare 2 embeddings (returns 0…1).
 *  - `enrollFace(employeeId, uri)` — compute embedding, save ke supabase + foto referensi.
 *  - `verifyFace(employeeId, uri)` — compute embedding, fetch reference, compare.
 *
 * Aman: bila model belum di-bundle / native module belum ter-build, fungsi
 * akan throw error deskriptif sehingga UI bisa tampilkan pesan jelas.
 */
import { Asset } from 'expo-asset';
import { Image, Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Module ini akan di-require ondemand untuk hindari crash saat dev-client lama.
let TfliteModule: any = null;
let ImageManipulator: any = null;
let FileSystem: any = null;

const tryLoad = () => {
  if (TfliteModule === null) {
    try {
      TfliteModule = require('react-native-fast-tflite');
    } catch {
      TfliteModule = false;
    }
  }
  if (ImageManipulator === null) {
    try {
      ImageManipulator = require('expo-image-manipulator');
    } catch {
      ImageManipulator = false;
    }
  }
  if (FileSystem === null) {
    try {
      FileSystem = require('expo-file-system');
    } catch {
      FileSystem = false;
    }
  }
};

// Konstanta MobileFaceNet (sesuaikan bila ganti model).
const MODEL_INPUT_SIZE = 112;
const MODEL_OUTPUT_DIM = 192;
const NORM_MEAN = 127.5;
const NORM_STD = 128.0;

const REFERENCE_BUCKET = 'face-references';
const DEFAULT_THRESHOLD = 0.65;

let cachedModel: any = null;

const isLikelyValidModelFile = async (fileUri: string): Promise<boolean> => {
  tryLoad();
  if (!FileSystem) return false;

  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists || typeof info.size !== 'number') {
    return false;
  }

  // MobileFaceNet asli biasanya beberapa MB. Threshold kecil ini hanya untuk
  // memastikan file placeholder/tidak lengkap tidak diproses sebagai model.
  return info.size >= 1024 * 1024;
};

/**
 * Load TFLite model dari assets. Dipanggil sekali; hasil di-cache.
 */
export async function loadModel(): Promise<any> {
  tryLoad();
  if (!TfliteModule) {
    throw new Error('react-native-fast-tflite belum tersedia. Rebuild dev-client.');
  }
  if (cachedModel) return cachedModel;

  // Bundle path lewat expo-asset agar konsisten antar platform.
  const asset = Asset.fromModule(require('../../assets/models/mobilefacenet.tflite'));
  await asset.downloadAsync();
  const localUri = asset.localUri || asset.uri;
  if (!localUri) throw new Error('Gagal memuat file model TFLite.');

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const valid = await isLikelyValidModelFile(localUri);
    if (!valid) {
      throw new Error(
        'File model MobileFaceNet belum tersedia atau masih placeholder. Tambahkan mobilefacenet.tflite asli ke assets/models lalu rebuild dev-client.'
      );
    }
  }

  cachedModel = await TfliteModule.loadTensorflowModel({ url: localUri }, []);
  return cachedModel;
}

import * as jpeg from 'jpeg-js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i++) {
  BASE64_LOOKUP[CHARS.charCodeAt(i)] = i;
}

function base64ToUint8Array(base64: string): Uint8Array {
  let len = base64.length;
  if (base64.endsWith('==')) {
    len -= 2;
  } else if (base64.endsWith('=')) {
    len -= 1;
  }
  
  const bufferLength = (len * 3) / 4;
  const bytes = new Uint8Array(bufferLength);
  
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = BASE64_LOOKUP[base64.charCodeAt(i)];
    const encoded2 = BASE64_LOOKUP[base64.charCodeAt(i + 1)];
    const encoded3 = BASE64_LOOKUP[base64.charCodeAt(i + 2)];
    const encoded4 = BASE64_LOOKUP[base64.charCodeAt(i + 3)];
    
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (p < bufferLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes;
}

/**
 * Konversi URI image lokal → Float32Array siap input TFLite.
 * Menggunakan expo-image-manipulator untuk resize, dan jpeg-js untuk decode di JS.
 * Ini menghindari crash native dari react-native-nitro-image.
 */
async function imageToTensor(uri: string): Promise<Float32Array> {
  tryLoad();
  if (!ImageManipulator || !FileSystem) {
    throw new Error('Dependency native (ImageManipulator/FileSystem) belum siap.');
  }

  // Dapatkan dimensi asli untuk melakukan pemotongan (crop) area tengah berbentuk bujur sangkar.
  // Ini krusial agar gambar wajah dari kamera portrait tidak lonjong/distorsi saat di-resize ke 112x112.
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (w, h) => resolve({ width: w, height: h }),
      (err) => reject(new Error(`Gagal mendeteksi resolusi gambar: ${err?.message || err}`))
    );
  });

  const size = Math.min(width, height);
  const originX = Math.round((width - size) / 2);
  // Geser crop ke atas (upper-middle) jika gambar portrait, karena wajah selfie biasanya di area atas-tengah.
  const originY = height > width ? Math.round((height - size) * 0.22) : Math.round((height - size) / 2);

  console.log(`[face] Cropping center-upper square (${size}x${size} at [${originX}, ${originY}]) and resizing to ${MODEL_INPUT_SIZE}x${MODEL_INPUT_SIZE}`);
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [
      { crop: { originX, originY, width: size, height: size } },
      { resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } },
    ],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.5 } // Kualitas 0.5 jauh lebih cepat dikompresi dan didekode
  );

  console.log(`[face] Reading resized image as base64`);
  const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  console.log(`[face] Decoding JPEG in JavaScript`);
  const jpegData = base64ToUint8Array(base64);
  const rawImageData = jpeg.decode(jpegData, { useTArray: true, formatAsRGBA: true });
  
  const buffer = rawImageData.data; // RGBA Uint8Array
  const tensor = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
  
  let j = 0;
  for (let i = 0; i < buffer.length; i += 4) {
    if (j >= tensor.length) break;
    tensor[j++] = (buffer[i] - NORM_MEAN) / NORM_STD;     // R
    tensor[j++] = (buffer[i + 1] - NORM_MEAN) / NORM_STD; // G
    tensor[j++] = (buffer[i + 2] - NORM_MEAN) / NORM_STD; // B
  }

  try {
    await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });
  } catch (e) {
    // ignore deletion failure
  }
  
  return tensor;
}

/**
 * Hitung embedding 192-dim dari URI gambar wajah (pre-cropped jika mungkin).
 */
export async function computeEmbeddingFromUri(uri: string): Promise<number[]> {
  const model = await loadModel();
  const input = await imageToTensor(uri);
  
  console.log(`[face] input Float32Array length: ${input.length}, buffer byteLength: ${input.buffer.byteLength}`);
  console.log('[face] Running TFLite model.run with ArrayBuffer');
  const output = await model.run([input.buffer]);
  
  if (!output || output.length === 0) {
    throw new Error('Model run returned empty output');
  }
  
  console.log(`[face] output array length: ${output.length}, output[0] byteLength: ${output[0]?.byteLength}`);
  
  // output[0] is returned as raw ArrayBuffer. We must wrap it in a Float32Array to read values.
  const rawArray = new Float32Array(output[0]);
  const embedding = Array.from(rawArray);
  
  console.log(`[face] raw embedding values (first 10): ${embedding.slice(0, 10).map(x => x.toFixed(5)).join(', ')}`);
  
  if (embedding.length !== MODEL_OUTPUT_DIM) {
    console.warn(
      `[face] embedding dim mismatch: expected ${MODEL_OUTPUT_DIM}, got ${embedding.length}`
    );
  }
  const normalized = l2Normalize(embedding);
  console.log(`[face] normalized embedding values (first 10): ${normalized.slice(0, 10).map(x => x.toFixed(5)).join(', ')}`);
  return normalized;
}

function l2Normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  return v.map((x) => x / norm);
}

/**
 * Cosine similarity 2 embedding L2-normalized → range −1..1 (umumnya 0..1).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

// ============================================================
// Supabase persistence
// ============================================================

interface EnrollmentResult {
  embedding: number[];
  referenceUrl: string | null;
  enrolledAt: string;
}

async function uploadReferencePhoto(employeeId: string, uri: string): Promise<string | null> {
  try {
    tryLoad();
    if (!FileSystem || !ImageManipulator) {
      console.warn('[face] FileSystem/ImageManipulator tidak tersedia, skip upload foto referensi.');
      return null;
    }

    const { data: userData } = await supabase.auth.getUser();
    const authId = userData?.user?.id;
    if (!authId) {
      console.warn('[face] gagal upload reference photo: user tidak terautentikasi');
      return null;
    }

    // Kompres & resize foto referensi terlebih dahulu sebelum dibaca ke JS.
    // Ini krusial untuk mencegah ANR (freezing) saat decoding base64 gambar berukuran besar.
    console.log('[face] compressing reference photo for upload...');
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // Ukuran 800px sudah sangat cukup untuk referensi visual
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
    );

    const base64Data = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binaryData = base64ToUint8Array(base64Data);
    const path = `${authId}/reference.jpg`;
    const { error } = await supabase.storage.from(REFERENCE_BUCKET).upload(path, binaryData.buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    // Hapus file sementara hasil kompresi
    try {
      await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });
    } catch {
      // ignore
    }

    if (error) {
      console.warn('[face] gagal upload reference photo', error.message);
      return null;
    }
    const { data } = supabase.storage.from(REFERENCE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err: any) {
    console.warn('[face] upload reference exception', err?.message || err);
    return null;
  }
}

/**
 * Enroll wajah karyawan: hitung embedding + simpan ke DB + upload foto referensi.
 */
export async function enrollFace(employeeId: string, imageUri: string): Promise<EnrollmentResult> {
  const embedding = await computeEmbeddingFromUri(imageUri);
  const enrolledAt = new Date().toISOString();
  const referenceUrl = await uploadReferencePhoto(employeeId, imageUri);

  const update: Record<string, any> = {
    face_embedding: embedding,
    face_embedding_dim: embedding.length,
    face_enrolled_at: enrolledAt,
  };
  if (referenceUrl) update.face_reference_url = referenceUrl;

  const { error } = await supabase.from('employees').update(update).eq('id', employeeId);
  if (error) {
    if (/column|does not exist|schema cache/i.test(error.message)) {
      throw new Error(
        'Skema DB belum punya kolom face_*. Jalankan migration database-add-face-recognition.sql.'
      );
    }
    throw new Error(error.message);
  }

  return { embedding, referenceUrl, enrolledAt };
}

export interface VerifyResult {
  verified: boolean;
  similarity: number;
  threshold: number;
}

/**
 * Verifikasi wajah: hitung embedding dari foto check-in, bandingkan dengan
 * embedding referensi tersimpan. Mengembalikan similarity & status.
 */
export async function verifyFace(employeeId: string, imageUri: string): Promise<VerifyResult> {
  const { data, error } = await supabase
    .from('employees')
    .select('face_embedding, face_match_threshold')
    .eq('id', employeeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.face_embedding) {
    throw new Error('Karyawan belum enroll wajah. Buka Profil → Daftar Wajah dulu.');
  }

  const reference = data.face_embedding as number[];
  const threshold = Number(data.face_match_threshold) || DEFAULT_THRESHOLD;
  
  console.log(`[face] Reference embedding loaded. Dimensions: ${reference.length}`);
  console.log(`[face] Reference embedding first 5 values: ${reference.slice(0, 5).map(x => x.toFixed(5)).join(', ')}`);
  
  const probe = await computeEmbeddingFromUri(imageUri);
  const similarity = cosineSimilarity(reference, probe);

  console.log(`[face] Verification comparison complete. Similarity: ${similarity.toFixed(4)}, Threshold: ${threshold}`);

  return {
    verified: similarity >= threshold,
    similarity,
    threshold,
  };
}

/**
 * Cek apakah karyawan sudah enroll. Berguna untuk UI guard.
 */
export async function isEnrolled(employeeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('employees')
    .select('face_embedding')
    .eq('id', employeeId)
    .maybeSingle();
  if (error) return false;
  return !!data?.face_embedding;
}
