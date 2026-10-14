import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Payslip, Employee } from '../types.ts';
import { XMarkIcon, PrinterIcon, CheckCircleIcon } from './icons.tsx';

interface PayslipDetailProps {
    isOpen: boolean;
    onClose: () => void;
    payslip: Payslip | null;
    employee: Employee | null;
    onSave?: (payslip: Payslip) => void;
    isSaved?: boolean;
}

function terbilangRupiah(n: number): string {
    if (n <= 0) return 'Nol Rupiah';
    const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    
    function toWords(val: number): string {
        val = Math.floor(val);
        if (val < 12) return angka[val];
        if (val < 20) return toWords(val - 10) + ' Belas';
        if (val < 100) return toWords(Math.floor(val / 10)) + ' Puluh ' + toWords(val % 10);
        if (val < 200) return 'Seratus ' + toWords(val - 100);
        if (val < 1000) return toWords(Math.floor(val / 100)) + ' Ratus ' + toWords(val % 100);
        if (val < 2000) return 'Seribu ' + toWords(val - 1000);
        if (val < 1000000) return toWords(Math.floor(val / 1000)) + ' Ribu ' + toWords(val % 1000);
        if (val < 1000000000) return toWords(Math.floor(val / 1000000)) + ' Juta ' + toWords(val % 1000000);
        return '';
    }
    
    const result = toWords(n).trim().replace(/\s+/g, ' ');
    return `${result} Rupiah`;
}

const PayslipDetail: React.FC<PayslipDetailProps> = ({ isOpen, onClose, payslip, employee, onSave, isSaved }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Don't render anything if closed or missing data
    if (!isOpen || !payslip || !employee) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('payslip-print-area');
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Slip Gaji - ${employee.nama} - ${payslip.periode}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                        body { font-family: 'Plus Jakarta Sans', sans-serif; background: white; color: #0f172a; padding: 20px; }
                        @media print {
                            body { padding: 0; -webkit-print-color-adjust: exact; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 500);
    };

    const formatRp = (val?: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

    const bpjsKes = payslip.potonganBPJSKesehatan ?? payslip.potonganBPJS ?? 0;
    const bpjsKet = payslip.potonganBPJSKetenagakerjaan ?? ((payslip.potonganJHT || 0) + (payslip.potonganJP || 0));

    const modalMarkup = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl my-auto flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200">
                {/* Header Action Bar */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-lg">
                            📄
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                Pratinjau Slip Gaji Resmi
                                {isSaved ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" /> Terbit & Terkunci
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                        📝 Draf Kalkulasi
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">{employee.nama} &middot; Periode {payslip.periode}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Cetak / Export PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Sheet Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100/60 max-h-[78vh]" id="payslip-print-area">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-6">
                        
                        {/* Kop Surat RSU Meloy */}
                        <div className="border-b-2 border-teal-800 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-center sm:text-left">
                                <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center text-2xl font-black shadow-md flex-shrink-0">
                                    RSM
                                </div>
                                <div>
                                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">RSU MELOY SANGATTA</h1>
                                    <p className="text-xs text-slate-500 font-medium">Jl. Yos Sudarso II No. 1, Sangatta, Kutai Timur, Kalimantan Timur</p>
                                    <p className="text-[11px] text-slate-400">Telp: (0549) 21010 | Email: info@rsumeloy.com</p>
                                </div>
                            </div>
                            <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-extrabold text-xs uppercase tracking-wider rounded-lg border border-slate-200">
                                    SLIP GAJI KARYAWAN
                                </span>
                                <p className="text-xs text-slate-600 font-semibold mt-1.5">Periode: {payslip.periode}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {payslip.id}</p>
                            </div>
                        </div>

                        {/* Informasional Karyawan */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 font-medium block">Nama Karyawan</span>
                                <span className="text-slate-900 font-bold text-sm block mt-0.5">{employee.nama}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-medium block">NIK / ID</span>
                                <span className="text-slate-900 font-bold text-sm block mt-0.5">{employee.nik || employee.id.slice(0, 8)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-medium block">Jabatan</span>
                                <span className="text-slate-800 font-semibold block mt-0.5">{employee.jabatan || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-medium block">Unit / Departemen</span>
                                <span className="text-slate-800 font-semibold block mt-0.5">{employee.departemen || (employee as any).unit || '-'}</span>
                            </div>
                        </div>

                        {/* Breakdown Pendapatan vs Potongan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            {/* Komponen Pendapatan */}
                            <div className="border border-emerald-200/80 rounded-xl p-4 bg-emerald-50/20">
                                <div className="flex items-center justify-between border-b border-emerald-200 pb-2 mb-3">
                                    <h3 className="font-extrabold text-emerald-800 text-sm flex items-center gap-1.5">
                                        <span>➕</span> PENDAPATAN (BRUTO)
                                    </h3>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span>Gaji Pokok</span>
                                        <span className="font-semibold">{formatRp(payslip.gajiPokok)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span>Tunjangan Profesi / Jabatan</span>
                                        <span className="font-semibold">{formatRp(payslip.tunjanganProfesi)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span>Upah Lembur</span>
                                        <span className="font-semibold">{formatRp(payslip.upahLembur)}</span>
                                    </div>
                                    <div className="border-t border-emerald-200 pt-2.5 flex justify-between items-center font-bold text-emerald-900 text-sm">
                                        <span>Total Pendapatan</span>
                                        <span>{formatRp(payslip.totalPendapatan)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Komponen Potongan */}
                            <div className="border border-rose-200/80 rounded-xl p-4 bg-rose-50/20">
                                <div className="flex items-center justify-between border-b border-rose-200 pb-2 mb-3">
                                    <h3 className="font-extrabold text-rose-800 text-sm flex items-center gap-1.5">
                                        <span>➖</span> POTONGAN
                                    </h3>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span>PPh 21 TER (PP 58/2023)</span>
                                        <span className="font-semibold text-rose-600">- {formatRp(payslip.potonganPPh21)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span>BPJS Kesehatan (1%)</span>
                                        <span className="font-semibold text-rose-600">- {formatRp(bpjsKes)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span>BPJS Ketenagakerjaan (JHT 2% + JP 1%)</span>
                                        <span className="font-semibold text-rose-600">- {formatRp(bpjsKet)}</span>
                                    </div>
                                    <div className="border-t border-rose-200 pt-2.5 flex justify-between items-center font-bold text-rose-900 text-sm">
                                        <span>Total Potongan</span>
                                        <span className="text-rose-700">- {formatRp(payslip.totalPotongan)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Total Take Home Pay */}
                        <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white rounded-xl p-5 shadow-sm space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <span className="text-teal-200 text-xs font-semibold uppercase tracking-wider">GAJI BERSIH DITERIMA (TAKE HOME PAY)</span>
                                    <p className="text-2xl sm:text-3xl font-black mt-0.5 tracking-tight">{formatRp(payslip.gajiBersih)}</p>
                                </div>
                                <div className="text-left sm:text-right text-xs text-teal-100 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                                    <span className="font-semibold block">Status Penerbitan</span>
                                    <span className="font-bold text-emerald-300 text-xs">✅ Diterbitkan Resmi</span>
                                </div>
                            </div>
                            <div className="border-t border-teal-700/80 pt-2 mt-2">
                                <p className="text-xs text-teal-100 italic">
                                    <span className="font-bold text-white not-italic">Terbilang:</span> "{terbilangRupiah(payslip.gajiBersih)}"
                                </p>
                            </div>
                        </div>

                        {/* Footer & Signature Approval Block */}
                        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs text-slate-600">
                            <div>
                                <p className="font-semibold text-slate-800">Catatan Penggajian:</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    Dokumen slip gaji ini diterbitkan secara sah oleh sistem HRMS Pro RSU Meloy. Apabila terdapat kekeliruan perhitungan, harap menghubungi Bagian Keuangan/SDM maksimal 3 hari kerja.
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                                    <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-mono">QR</div>
                                    <span>Verifikasi Otentisitas Digital HRMS-Pro v5.0</span>
                                </div>
                            </div>
                            <div className="text-center flex flex-col justify-between items-center">
                                <p className="text-slate-500">Sangatta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <div className="my-2 border-b border-dashed border-slate-300 w-32 h-12 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                                    [Tanda Tangan Digital]
                                </div>
                                <p className="font-bold text-slate-900">Manajer Keuangan & SDM</p>
                                <p className="text-[10px] text-slate-400">RSU Meloy Sangatta</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Controls for Unsaved Draft */}
                {onSave && !isSaved && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between no-print flex-shrink-0">
                        <span className="text-xs text-slate-500 font-medium">
                            ⚠️ Draf slip gaji ini belum terbit di portal karyawan.
                        </span>
                        <button
                            onClick={() => onSave(payslip)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                        >
                            <CheckCircleIcon className="w-4 h-4 text-emerald-300" />
                            Kunci & Terbitkan Slip Gaji
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalMarkup, document.body);
};

export default PayslipDetail;
