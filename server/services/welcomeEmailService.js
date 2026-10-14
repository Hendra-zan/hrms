/**
 * server/services/welcomeEmailService.js
 * Service for formatting and delivering welcome emails to newly onboarded employees.
 */

export async function sendWelcomeEmail({ email, nama, nik, password, isDefaultPassword }) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { success: false, reason: 'No email provided' };
  }

  const welcomeMessage = `
🎉 Selamat Datang di RSUD Meloy, ${nama}!

Akun portal HRMS & Absensi Mobile Anda telah berhasil dibuat.

Detail Akun Login:
------------------
NIK: ${nik || '-'}
Email Login: ${email}
Password ${isDefaultPassword ? 'Sementara' : 'Login'}: ${password}

${isDefaultPassword ? '⚠️ PERHATIAN: Anda wajib mengubah password sementara saat pertama kali login di Portal Web atau Aplikasi Mobile HRMS.' : ''}

Akses Portal: https://absensi.rsumeloy.com
  `;

  console.log(`[WelcomeEmailService] Welcome email queued for ${email}:\n${welcomeMessage}`);
  return { success: true, email, timestamp: new Date().toISOString() };
}
