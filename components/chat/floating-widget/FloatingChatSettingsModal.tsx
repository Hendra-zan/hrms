import React from 'react';
import { FontSize, WidgetSize } from './types.ts';

interface FloatingChatSettingsModalProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  widgetSize: WidgetSize;
  setWidgetSize: (size: WidgetSize) => void;
}

export const FloatingChatSettingsModal: React.FC<FloatingChatSettingsModalProps> = ({
  showSettings,
  setShowSettings,
  fontSize,
  setFontSize,
  widgetSize,
  setWidgetSize,
}) => {
  if (!showSettings) return null;

  return (
    <div className="absolute inset-x-0 top-12 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 shadow-xl z-20 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>⚙️</span> Preferensi Tampilan Chat
        </h5>
        <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ukuran Jendela</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['kompak', 'normal', 'lebar'] as WidgetSize[]).map(sz => (
            <button
              key={sz}
              onClick={() => setWidgetSize(sz)}
              className={`py-1 text-xs font-bold rounded-lg border capitalize transition-all ${
                widgetSize === sz
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-[#06736a] text-[#06736a] dark:text-teal-300 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ukuran Teks Pesan</label>
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { id: 'kecil', label: 'Kecil' },
            { id: 'normal', label: 'Normal' },
            { id: 'besar', label: 'Besar' },
            { id: 'sangat_besar', label: 'XL' },
          ] as { id: FontSize; label: string }[]).map(f => (
            <button
              key={f.id}
              onClick={() => setFontSize(f.id)}
              className={`py-1 text-xs font-bold rounded-lg border transition-all ${
                fontSize === f.id
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-[#06736a] text-[#06736a] dark:text-teal-300 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
