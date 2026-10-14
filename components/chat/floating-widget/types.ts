export type FontSize = 'kecil' | 'normal' | 'besar' | 'sangat_besar';
export type WidgetSize = 'kompak' | 'normal' | 'lebar';

export const getWidgetSizeClass = (size: WidgetSize) => {
  if (size === 'kompak') return 'w-80 h-[440px]';
  if (size === 'lebar') return 'w-[440px] h-[600px]';
  return 'w-96 h-[520px]';
};

export const getMessageFontClass = (fontSize: FontSize) => {
  if (fontSize === 'kecil') return 'text-[10px]';
  if (fontSize === 'besar') return 'text-sm';
  if (fontSize === 'sangat_besar') return 'text-base';
  return 'text-xs';
};

export const getTimestampFontClass = (fontSize: FontSize) => {
  if (fontSize === 'kecil') return 'text-[7px]';
  if (fontSize === 'besar') return 'text-[10px]';
  if (fontSize === 'sangat_besar') return 'text-xs';
  return 'text-[8px]';
};
