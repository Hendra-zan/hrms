import React, { useState } from 'react';

/* ── Badge ───────────────────────────────────────────────── */
export const Badge: React.FC<{ text: string; color?: string }> = ({ text, color = 'blue' }) => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        green: 'bg-green-100 text-green-700 border-green-200',
        yellow: 'bg-amber-100 text-amber-700 border-amber-200',
        red: 'bg-red-100 text-red-600 border-red-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200',
        teal: 'bg-teal-100 text-teal-700 border-teal-200',
        gray: 'bg-gray-100 text-gray-600 border-gray-200',
        indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[color] ?? colors.blue}`}>
            {text}
        </span>
    );
};

/* ── Step ────────────────────────────────────────────────── */
export const Step: React.FC<{ no: number; title: string; children: React.ReactNode }> = ({ no, title, children }) => (
    <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#06736a] text-white text-sm font-bold flex items-center justify-center mt-0.5 shadow-sm">
            {no}
        </div>
        <div className="flex-1 pb-4 border-b border-gray-100 last:border-b-0">
            <p className="font-bold text-gray-800 text-sm mb-1.5">{title}</p>
            <div className="text-sm text-gray-600 space-y-1">{children}</div>
        </div>
    </div>
);

/* ── InfoBox ─────────────────────────────────────────────── */
export const InfoBox: React.FC<{ type?: 'info' | 'warning' | 'success' | 'error'; children: React.ReactNode }> = ({ type = 'info', children }) => {
    const styles = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
    };
    const icons = { info: 'ℹ️', warning: '⚠️', success: '✅', error: '🚨' };
    return (
        <div className={`rounded-xl border px-4 py-3 text-sm flex gap-2.5 ${styles[type]}`}>
            <span className="text-base flex-shrink-0 mt-0.5">{icons[type]}</span>
            <div className="leading-relaxed">{children}</div>
        </div>
    );
};

/* ── Code ─────────────────────────────────────────────────── */
export const Code: React.FC<{ children: string }> = ({ children }) => (
    <code className="bg-gray-100 text-[#06736a] px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200">{children}</code>
);

/* ── FAQ Accordion ───────────────────────────────────────── */
export const FAQ: React.FC<{ items: { q: string; a: React.ReactNode }[] }> = ({ items }) => {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className={`rounded-xl border transition-all ${open === i ? 'border-[#06736a]/30 bg-teal-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                        onClick={() => setOpen(open === i ? null : i)}
                    >
                        <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span className="text-[#06736a] text-base">❓</span>
                            {item.q}
                        </span>
                        <span className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${open === i ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </button>
                    {open === i && (
                        <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3 leading-relaxed">
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

/* ── Feature Card ────────────────────────────────────────── */
export const FeatureCard: React.FC<{
    icon: string;
    title: string;
    desc: string;
    badge?: string;
    badgeColor?: string;
    highlight?: boolean;
}> = ({ icon, title, desc, badge, badgeColor = 'blue', highlight }) => (
    <div className={`rounded-xl border p-4 flex gap-3 transition-all ${highlight ? 'border-[#06736a]/30 bg-teal-50/40' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}>
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800 text-sm">{title}</p>
                {badge && <Badge text={badge} color={badgeColor} />}
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
);

/* ── TipCard ─────────────────────────────────────────────── */
export const TipCard: React.FC<{ title: string; children: React.ReactNode; color?: 'blue' | 'green' | 'amber' | 'teal' }> = ({ title, children, color = 'blue' }) => {
    const styles = {
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        green: 'bg-green-50 border-green-200 text-green-800',
        amber: 'bg-amber-50 border-amber-200 text-amber-800',
        teal: 'bg-teal-50 border-teal-200 text-teal-800',
    };
    return (
        <div className={`rounded-xl border px-4 py-3 ${styles[color]}`}>
            <p className="font-bold text-xs mb-1.5">💡 {title}</p>
            <div className="text-xs leading-relaxed opacity-90">{children}</div>
        </div>
    );
};

/* ── QuickLink ───────────────────────────────────────────── */
export const QuickLink: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 text-xs text-[#06736a] font-semibold hover:underline"
    >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {label}
    </button>
);

/* ── StatusRow ───────────────────────────────────────────── */
export const StatusRow: React.FC<{ icon: '✅' | '❌' | '⚠️'; children: React.ReactNode }> = ({ icon, children }) => {
    const color = icon === '✅' ? 'text-green-700' : icon === '❌' ? 'text-red-600' : 'text-amber-700';
    return (
        <div className={`flex items-start gap-2 px-4 py-2 text-xs border-b border-gray-100 last:border-b-0 ${color}`}>
            <span className="flex-shrink-0 mt-0.5">{icon}</span>
            <span>{children}</span>
        </div>
    );
};

/* ── Table ───────────────────────────────────────────────── */
export const GuideTable: React.FC<{
    headers: string[];
    rows: string[][];
}> = ({ headers, rows }) => (
    <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
        <table className="w-full">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                    {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                        {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-gray-600">{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

/* ── SectionTitle ────────────────────────────────────────── */
export const SectionTitle: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
    <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2 pt-1">
        <span>{icon}</span>
        <span>{children}</span>
    </h4>
);
