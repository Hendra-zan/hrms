import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeData: z.object({
    nama: z.string().min(1, 'Nama wajib diisi').max(200),
    email: z.union([
      z.string().email('Format email tidak valid'),
      z.literal(''),
      z.null(),
      z.undefined(),
    ]).optional().nullable(),
    role: z.string().optional().nullable(),
    jabatan: z.string().optional().nullable(),
    departemen: z.string().optional().nullable(),
    unitKerjaId: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
    telepon: z.string().max(50).optional().nullable(),
    status: z.string().optional().nullable(),
    shift: z.string().optional().nullable(),
    user_id: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
    userId: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
    birthDate: z.string().optional().nullable(),
    ktpNumber: z.string().max(50).optional().nullable(),
    agama: z.string().optional().nullable(),
    maritalStatus: z.string().optional().nullable(),
    hireDate: z.string().optional().nullable(),
    sisaCuti: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().nullable(),
    spesialisasi: z.string().optional().nullable(),
    kredensial: z.string().optional().nullable(),
    nomorSTR: z.string().optional().nullable(),
    tanggalKadaluarsaSTR: z.string().optional().nullable(),
    npwp: z.string().optional().nullable(),
    bpjsKesehatan: z.string().optional().nullable(),
    bpjsKetenagakerjaan: z.string().optional().nullable(),
    address: z.record(z.any()).optional().nullable(),
    bankAccount: z.record(z.any()).optional().nullable(),
    compensation: z.record(z.any()).optional().nullable(),
    education: z.array(z.record(z.any())).optional().nullable(),
    emergencyContacts: z.array(z.record(z.any())).optional().nullable(),
    sertifikasi: z.array(z.string()).optional().nullable(),
    kompetensi: z.array(z.string()).optional().nullable(),
    workHistory: z.array(z.record(z.any())).optional().nullable(),
    foto: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
    pin_mesin: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
  }).passthrough(),
  password: z.union([z.string().min(6, 'Password minimal 6 karakter'), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
  documents: z.array(z.object({
    name: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    fileUrl: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
    uploadedAt: z.string().optional().nullable(),
  })).optional().default([]),
});

export const updateEmployeeSchema = z.object({
  updateData: z.object({}).passthrough().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'updateData tidak boleh kosong' }
  ),
  documents: z.array(z.object({
    name: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    fileUrl: z.union([z.string(), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
    uploadedAt: z.string().optional().nullable(),
  })).optional().default([]),
  newPassword: z.union([z.string().min(6, 'Password minimal 6 karakter'), z.literal(''), z.null(), z.undefined()]).optional().nullable(),
});
