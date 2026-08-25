export const BLOCK_COLORS = ['orange', 'teal', 'blue', 'purple', 'rose', 'amber'] as const;
export type BlockColor = (typeof BLOCK_COLORS)[number];

export const BLOCK_EMOJIS = ['💻', '☕', '🧘', '📚', '🎨', '💧', '⚡', '🏃', '✨', '🎯'] as const;

export const COLOR_SWATCH: Record<BlockColor, string> = {
  orange: '#f97316',
  teal: '#2dd4bf',
  blue: '#3b82f6',
  purple: '#a855f7',
  rose: '#f43f5e',
  amber: '#f59e0b',
};

const REST_LABELS = ['przerwa', 'break', 'rest', 'przerwa-kawa'];

export function inferDefaultColor(label: string): BlockColor {
  const lower = label.toLowerCase();
  return REST_LABELS.includes(lower) ? 'teal' : 'orange';
}

export function normalizeColor(color?: string): BlockColor {
  if (color && BLOCK_COLORS.includes(color as BlockColor)) {
    return color as BlockColor;
  }
  return 'orange';
}

export function getColorDotClass(color?: string): string {
  const map: Record<BlockColor, string> = {
    orange: 'bg-orange-400',
    teal: 'bg-teal-400',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
  };
  return map[normalizeColor(color)];
}

export function getColorBadgeClasses(color?: string): string {
  const map: Record<BlockColor, string> = {
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return map[normalizeColor(color)];
}

export function getColorBorderClass(color?: string): string {
  const map: Record<BlockColor, string> = {
    orange: 'border-orange-500',
    teal: 'border-teal-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    rose: 'border-rose-500',
    amber: 'border-amber-500',
  };
  return map[normalizeColor(color)];
}

export function getColorPulseClass(color?: string): string {
  const map: Record<BlockColor, string> = {
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
  };
  return map[normalizeColor(color)];
}
