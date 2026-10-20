export const BLOCK_COLORS = ['orange', 'teal', 'blue', 'purple', 'rose', 'amber'] as const;
export type BlockColor = (typeof BLOCK_COLORS)[number];

export const BLOCK_EMOJIS = [
  '\u{1F4BB}',
  '\u2615',
  '\u{1F9D8}',
  '\u{1F4DA}',
  '\u{1F3A8}',
  '\u{1F4A7}',
  '\u26A1',
  '\u{1F3C3}',
  '\u2728',
  '\u{1F3AF}',
] as const;

export const COLOR_SWATCH: Record<BlockColor, string> = {
  orange: '#e07a2f',
  teal: '#3d9b8f',
  blue: '#7f93a8',
  purple: '#8a7560',
  rose: '#c45c6a',
  amber: '#c4923a',
};

export function swatch(color?: string): string {
  return COLOR_SWATCH[normalizeColor(color)];
}

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

export function getColorDotClass(_color?: string): string {
  return '';
}
