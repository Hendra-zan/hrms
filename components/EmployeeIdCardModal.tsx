import React, { useRef } from 'react';
import { Employee, WorkUnit } from '../types.ts';
import { XMarkIcon, PrinterIcon } from './icons.tsx';

interface EmployeeIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  workUnit?: WorkUnit;
  institutionName?: string;
}

export const EmployeeIdCardModal: React.FC<EmployeeIdCardModalProps> = ({
  isOpen,
  onClose,
  employee,
  workUnit,
  institutionName = 'RSU MELOY',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka halaman cetak. Pastikan pop-up browser tidak diblokir.');
      return;
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(employee.nik || employee.id)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${employee.nama}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f3f4f6;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-container {
              display: flex;
              gap: 20px;
              justify-content: center;
              align-items: center;
              flex-wrap: wrap;
            }
            /* Standard PVC Card Size CR80: 85.6mm x 53.9mm */
            .id-card {
              width: 85.6mm;
              height: 130mm;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
              border: 1px solid #e5e7eb;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            .card-header {
              background: linear-gradient(135deg, #06736a 0%, #044e48 100%);
              color: white;
              padding: 12px;
              text-align: center;
            }
            .hospital-title {
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 1px;
              margin: 0;
              text-transform: uppercase;
            }
            .hospital-subtitle {
              font-size: 8px;
              opacity: 0.85;
              margin-top: 2px;
            }
            .photo-container {
              margin: 15px auto 10px auto;
              width: 90px;
              height: 110px;
              border-radius: 8px;
              border: 3px solid #06736a;
              overflow: hidden;
              background-color: #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .photo-container img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .employee-info {
              text-align: center;
              padding: 0 10px;
              flex: 1;
            }
            .emp-name {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              margin: 0 0 3px 0;
            }
            .emp-role {
              font-size: 11px;
              font-weight: 600;
              color: #06736a;
              margin: 0 0 6px 0;
            }
            .badge-dept {
              display: inline-block;
              background-color: #f0fdf4;
              color: #166534;
              border: 1px solid #bbf7d0;
              font-size: 9px;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 12px;
              margin-bottom: 8px;
            }
            .emp-nik {
              font-size: 10px;
              color: #6b7280;
              font-family: monospace;
            }
            .card-footer {
              background: #f9fafb;
              border-top: 1px dashed #e5e7eb;
              padding: 10px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .qr-code {
              width: 42px;
              height: 42px;
            }
            .footer-meta {
              text-align: right;
              font-size: 7px;
              color: #9ca3af;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div className="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #06736a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
              🖨️ Cetak ID Card Sekarang
            </button>
          </div>
          <div class="page-container">
            <!-- Kartu Depan -->
            <div class="id-card">
              <div class="card-header">
                <h1 class="hospital-title">${institutionName}</h1>
                <div class="hospital-subtitle">KARTU TANDA ANGGOTA KARYAWAN</div>
              </div>
              <div class="photo-container">
                ${employee.foto ? `<img src="${employee.foto}" alt="${employee.nama}" />` : `<div style="font-size:32px; font-weight:bold; color:#06736a;">${employee.nama.charAt(0)}</div>`}
              </div>
              <div class="employee-info">
                <h2 class="emp-name">${employee.nama}</h2>
                <p class="emp-role">${employee.jabatan || 'Staf Rumah Sakit'}</p>
                <div class="badge-dept">${employee.departemen || workUnit?.nama || 'RSU Meloy'}</div>
                <p class="emp-nik">NIK: ${employee.nik || '-'}</p>
              </div>
              <div class="card-footer">
                <img src="${qrCodeUrl}" class="qr-code" alt="QR NIK" />
                <div class="footer-meta">
                  <div>Valid ID Member</div>
                  <div>RSU Meloy Official</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const qrCodeModalUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(employee.nik || employee.id)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎴 ID Card Karyawan Siap Cetak</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="flex justify-center my-4">
          <div ref={cardRef} className="w-[260px] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-center flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#06736a] to-[#044e48] text-white p-3">
              <p className="text-xs font-black uppercase tracking-wider">{institutionName}</p>
              <p className="text-[9px] opacity-80">KARTU TANDA ANGGOTA</p>
            </div>

            {/* Avatar Photo */}
            <div className="my-3 mx-auto w-20 h-24 rounded-xl border-2 border-[#06736a] overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {employee.foto ? (
                <img src={employee.foto} alt={employee.nama} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#06736a]">{employee.nama.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="px-3 pb-2 flex-1">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{employee.nama}</h4>
              <p className="text-xs font-semibold text-[#06736a] mt-0.5">{employee.jabatan || 'Staf'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {employee.departemen || workUnit?.nama || 'RSU Meloy'}
              </span>
              <p className="text-[11px] font-mono text-gray-500 mt-2">NIK: {employee.nik || '-'}</p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 p-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <img src={qrCodeModalUrl} className="w-9 h-9" alt="QR Code" />
              <div className="text-right text-[8px] text-gray-400">
                <p>Verifikasi Digital</p>
                <p className="font-semibold text-gray-600 dark:text-gray-300">HRMS Pro System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#06736a] hover:bg-[#044e48] text-white font-medium text-sm transition shadow-lg shadow-[#06736a]/30 flex items-center justify-center gap-2"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Cetak ID Card (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
