import React from 'react';

interface MyNotesBannerWidgetProps {
    unreadNotesCount: number;
    onClick: () => void;
}

export const MyNotesBannerWidget: React.FC<MyNotesBannerWidgetProps> = ({
    unreadNotesCount,
    onClick,
}) => {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl shadow-sm cursor-pointer group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${unreadNotesCount > 0 ? 'bg-gradient-to-r from-[#06736a] to-teal-600 border border-teal-500/30' : 'bg-white border border-slate-200/80 hover:border-[#06736a]/30'}`}
            onClick={onClick}
        >
            {/* Dot pattern overlay for unread state */}
            {unreadNotesCount > 0 && (
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff18_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            )}

            <div className="relative p-5 flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110 ${
                    unreadNotesCount > 0 ? 'bg-white/20 backdrop-blur-md' : 'bg-teal-50'
                }`}>
                    📋
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h2 className={`text-sm font-bold ${unreadNotesCount > 0 ? 'text-white' : 'text-slate-800'}`}>
                            Catatan & Instruksi Saya
                        </h2>
                        {unreadNotesCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse shadow-lg">
                                {unreadNotesCount}
                            </span>
                        )}
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${unreadNotesCount > 0 ? 'text-teal-100' : 'text-slate-400'}`}>
                        {unreadNotesCount > 0
                            ? `${unreadNotesCount} pesan baru dari Kepala Ruangan / HRD — klik untuk membaca`
                            : 'Tidak ada pesan atau instruksi baru dari Atasan'
                        }
                    </p>
                </div>

                {/* Arrow CTA */}
                <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold group-hover:translate-x-1 transition-transform duration-200 ${
                    unreadNotesCount > 0 ? 'text-teal-100' : 'text-[#06736a]'
                }`}>
                    Buka
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
