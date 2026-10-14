// securityUtils.ts - Utilitas keamanan untuk aplikasi HRMS Pro

/**
 * Fungsi untuk menghasilkan token CSRF
 * @returns Token CSRF yang unik
 */
export const generateCSRFToken = (): string => {
  const randomBytes = new Uint8Array(32);
  const cryptoObj = (typeof window !== 'undefined' && window.crypto) || (typeof globalThis !== 'undefined' && globalThis.crypto);
  if (cryptoObj) {
    cryptoObj.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Menyimpan token CSRF di localStorage
 * @param token Token CSRF yang akan disimpan
 */
export const storeCSRFToken = (token: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('csrf_token', token);
  }
};

/**
 * Mengambil token CSRF dari localStorage
 * @returns Token CSRF yang tersimpan atau null jika tidak ada
 */
export const getCSRFToken = (): string | null => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('csrf_token');
  }
  return null;
};

/**
 * Memvalidasi token CSRF
 * @param token Token yang akan divalidasi
 * @returns Boolean yang menunjukkan apakah token valid
 */
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken();
  return storedToken === token;
};

/**
 * Sanitasi input untuk mencegah XSS
 * @param input String yang akan disanitasi
 * @returns String yang telah disanitasi
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};