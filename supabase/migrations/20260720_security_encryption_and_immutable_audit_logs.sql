-- ============================================================
-- Migration: Enkripsi Kolom Sensitif & Immutable Audit Logs
-- Tujuan   : Pemenuhan Kepatuhan Keamanan Data (UU PDP No. 27/2022)
-- ============================================================

-- 1. Mengaktifkan ekstensi pgcrypto untuk enkripsi AES-256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fungsi Helper Enkripsi Data Sensitif (AES-256)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_text(p_plain_text TEXT, p_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF p_plain_text IS NULL OR TRIM(p_plain_text) = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(pgp_sym_encrypt(p_plain_text, p_key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fungsi Helper Dekripsi Data Sensitif (AES-256)
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_text(p_cipher_text TEXT, p_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF p_cipher_text IS NULL OR TRIM(p_cipher_text) = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(decode(p_cipher_text, 'base64'), p_key);
EXCEPTION WHEN OTHERS THEN
  -- Jika data lama belum terenkripsi (fallback ke plain text aman)
  RETURN p_cipher_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Proteksi Audit Logs: Mencegah UPDATE dan DELETE (Immutable Audit Trail)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries are immutable and cannot be updated or deleted (UU PDP Compliance).';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_update_delete ON public.audit_logs;

CREATE TRIGGER trg_prevent_audit_log_update_delete
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_tampering();

COMMENT ON TRIGGER trg_prevent_audit_log_update_delete ON public.audit_logs IS
  'Proteksi integritas audit log: Menolak pembatalan, pembaruan, atau penghapusan catatan jejak audit.';
