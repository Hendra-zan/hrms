import { Employee, WorkUnit } from '../../types.ts';

export function printEmployeeBiodata(
  employee: Employee,
  workUnit?: WorkUnit,
  institutionName?: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Gagal membuka halaman cetak. Pastikan pop-up browser tidak diblokir.');
    return;
  }

  const dateStr = new Date().toLocaleDateString('id-ID');
  const birthDateFormatted = employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('id-ID') : '-';
  const hireDateFormatted = employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('id-ID') : '-';

  // Build Education table
  let educationHtml = '<p class="text-gray-500 text-sm">Tidak ada riwayat pendidikan.</p>';
  if (employee.education && employee.education.length > 0) {
    educationHtml = `
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-gray-100 font-semibold border-b">
            <th class="p-2 border">Tingkat</th>
            <th class="p-2 border">Institusi</th>
            <th class="p-2 border">Jurusan</th>
            <th class="p-2 border">Tahun Lulus</th>
            <th class="p-2 border">IPK</th>
          </tr>
        </thead>
        <tbody>
          ${employee.education.map(edu => `
            <tr>
              <td class="p-2 border">${edu.level || '-'}</td>
              <td class="p-2 border">${edu.institution || '-'}</td>
              <td class="p-2 border">${edu.major || '-'}</td>
              <td class="p-2 border">${edu.graduationYear || '-'}</td>
              <td class="p-2 border">${edu.gpa || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Build Work History table
  let workHistoryHtml = '<p class="text-gray-500 text-sm">Tidak ada riwayat pekerjaan.</p>';
  if (employee.workHistory && employee.workHistory.length > 0) {
    workHistoryHtml = `
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-gray-100 font-semibold border-b">
            <th class="p-2 border">Perusahaan/Instansi</th>
            <th class="p-2 border">Jabatan</th>
            <th class="p-2 border">Mulai</th>
            <th class="p-2 border">Selesai</th>
            <th class="p-2 border">Alasan Resign</th>
          </tr>
        </thead>
        <tbody>
          ${employee.workHistory.map(work => `
            <tr>
              <td class="p-2 border">${work.company || '-'}</td>
              <td class="p-2 border">${work.position || '-'}</td>
              <td class="p-2 border">${work.startDate || '-'}</td>
              <td class="p-2 border">${work.endDate || 'Sekarang'}</td>
              <td class="p-2 border">${work.reasonLeaving || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Build Emergency Contacts
  let emergencyHtml = '<p class="text-gray-500 text-sm">Tidak ada kontak darurat.</p>';
  if (employee.emergencyContacts && employee.emergencyContacts.length > 0) {
    emergencyHtml = `
      <div class="grid grid-cols-1 gap-2 text-sm">
        ${employee.emergencyContacts.map(c => `
          <div class="p-2 border rounded">
            <strong>Nama:</strong> ${c.name || '-'} (${c.relationship || '-'}) | 
            <strong>No. HP:</strong> ${c.phone || '-'} | 
            <strong>Alamat:</strong> ${c.address || '-'}
          </div>
        `).join('')}
      </div>
    `;
  }

  const photoSrc = employee.foto || `https://ui-avatars.com/api/?name=${employee.nama.replace(/\s/g, '+')}&background=random`;

  printWindow.document.write(`
    <html>
      <head>
        <title>Biodata Karyawan - ${employee.nama}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; font-size: 12px; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          .label-cell { width: 30%; font-weight: 500; color: #4B5563; padding: 6px 12px; background-color: #F9FAFB; border: 1px solid #E5E7EB; }
          .value-cell { width: 70%; padding: 6px 12px; border: 1px solid #E5E7EB; color: #1F2937; }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 3.5rem;
            font-weight: 900;
            color: rgba(6, 115, 106, 0.05);
            white-space: nowrap;
            pointer-events: none;
            z-index: -1000;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-family: sans-serif;
            text-align: center;
          }
        </style>
      </head>
      <body class="p-8 max-w-4xl mx-auto">
        <div class="watermark">${institutionName || 'HRMS PRO'}</div>
        <div class="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 tracking-wide uppercase">Biodata Karyawan</h1>
            <p class="text-sm text-gray-600 font-semibold mt-1">SISTEM INFORMASI MANAJEMEN SDM (HRMS)</p>
          </div>
          <img class="h-24 w-24 rounded-lg object-cover border-2 border-gray-300" src="${photoSrc}" alt="${employee.nama}">
        </div>

        <h2 class="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">I. Informasi Pribadi</h2>
        <table class="w-full table-fixed mb-6 text-sm">
          <tr>
            <td class="label-cell">Nama Lengkap</td>
            <td class="value-cell font-bold text-gray-900">${employee.nama} ${employee.kredensial ? `, ${employee.kredensial}` : ''}</td>
          </tr>
          <tr>
            <td class="label-cell">Nomor Induk Karyawan (NIK)</td>
            <td class="value-cell">${employee.nik || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Email</td>
            <td class="value-cell">${employee.email || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Nomor Telepon</td>
            <td class="value-cell">${employee.telepon || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Tanggal Lahir</td>
            <td class="value-cell">${birthDateFormatted}</td>
          </tr>
          <tr>
            <td class="label-cell">Agama</td>
            <td class="value-cell">${employee.agama || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Status Pernikahan</td>
            <td class="value-cell">${employee.maritalStatus || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">No. KTP / NIK KTP</td>
            <td class="value-cell">${employee.ktpNumber || '-'}</td>
          </tr>
        </table>

        <h2 class="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">II. Informasi Pekerjaan</h2>
        <table class="w-full table-fixed mb-6 text-sm">
          <tr>
            <td class="label-cell">Jabatan</td>
            <td class="value-cell font-semibold">${employee.jabatan || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Departemen</td>
            <td class="value-cell">${employee.departemen || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Unit Kerja</td>
            <td class="value-cell">${workUnit?.nama || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Tanggal Masuk</td>
            <td class="value-cell">${hireDateFormatted}</td>
          </tr>
          <tr>
            <td class="label-cell">Status Kepegawaian</td>
            <td class="value-cell">${employee.status || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Shift Default</td>
            <td class="value-cell">${employee.shift || '-'}</td>
          </tr>
        </table>

        <div class="page-break"></div>

        <h2 class="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">III. Alamat & Kontak Darurat</h2>
        <table class="w-full table-fixed mb-4 text-sm">
          <tr>
            <td class="label-cell">Alamat KTP</td>
            <td class="value-cell">${employee.address?.ktp || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Alamat Domisili</td>
            <td class="value-cell">${employee.address?.domisili || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Provinsi</td>
            <td class="value-cell">${employee.address?.province || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Kota/Kabupaten</td>
            <td class="value-cell">${employee.address?.city || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Kode Pos</td>
            <td class="value-cell">${employee.address?.postalCode || '-'}</td>
          </tr>
        </table>
        
        <div class="mb-6">
          <p class="text-xs font-semibold text-gray-500 mb-2">KONTAK DARURAT:</p>
          ${emergencyHtml}
        </div>

        <h2 class="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">IV. Jaminan Sosial & Perbankan</h2>
        <table class="w-full table-fixed mb-6 text-sm">
          <tr>
            <td class="label-cell">Nomor Pokok Wajib Pajak (NPWP)</td>
            <td class="value-cell">${employee.npwp || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Nomor BPJS Kesehatan</td>
            <td class="value-cell">${employee.bpjsKesehatan || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Nomor BPJS Ketenagakerjaan</td>
            <td class="value-cell">${employee.bpjsKetenagakerjaan || '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Detail Rekening Bank</td>
            <td class="value-cell">
              ${employee.bankAccount?.bankName || '-'} - ${employee.bankAccount?.accountNumber || '-'} 
              <br><span class="text-xs text-gray-500">a.n. ${employee.bankAccount?.accountHolder || employee.nama}</span>
            </td>
          </tr>
        </table>

        <h2 class="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">V. Riwayat Pendidikan</h2>
        <div class="mb-6">${educationHtml}</div>

        <h2 class="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">VI. Pengalaman Kerja</h2>
        <div class="mb-8">${workHistoryHtml}</div>

        <div class="mt-12 flex justify-between text-sm">
          <div class="text-center w-48">
            <p class="text-gray-600">Dicetak Pada: ${dateStr}</p>
            <div class="h-20"></div>
            <p class="font-bold border-t border-gray-800 pt-1">HRD Administrator</p>
          </div>
          <div class="text-center w-48">
            <p class="text-gray-600">Mengetahui,</p>
            <div class="h-20"></div>
            <p class="font-bold border-t border-gray-800 pt-1">${employee.nama}</p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.onload = function() {
    printWindow.print();
  };
}
