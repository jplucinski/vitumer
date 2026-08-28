/** Keep CSS @media numbers in src/index.css in sync with these values. */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  focusSplitMinHeight: 640,
} as const;

export const WIDE_LAYOUT_QUERY = `(min-width: ${BREAKPOINTS.lg}px)`;

export const FOCUS_SPLIT_QUERY = `(min-width: ${BREAKPOINTS.lg}px) and (min-height: ${BREAKPOINTS.focusSplitMinHeight}px)`;

export const FOCUS_IMMERSIVE_MAX_HEIGHT = BREAKPOINTS.focusSplitMinHeight - 1;

export const FOCUS_IMMERSIVE_QUERY = `(orientation: landscape) and (max-height: ${FOCUS_IMMERSIVE_MAX_HEIGHT}px)`;

export function isWideLayout(widthPx: number): boolean {
  return widthPx >= BREAKPOINTS.lg;
}

export function isFocusSplitLayout(widthPx: number, heightPx: number): boolean {
  return isWideLayout(widthPx) && heightPx >= BREAKPOINTS.focusSplitMinHeight;
}

export function isFocusImmersiveLayout(widthPx: number, heightPx: number): boolean {
  return widthPx > heightPx && heightPx < BREAKPOINTS.focusSplitMinHeight;
}
