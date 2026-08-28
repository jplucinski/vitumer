import { describe, expect, it } from 'vitest';
import {
  BREAKPOINTS,
  FOCUS_SPLIT_QUERY,
  FOCUS_IMMERSIVE_MAX_HEIGHT,
  FOCUS_IMMERSIVE_QUERY,
  WIDE_LAYOUT_QUERY,
  isFocusImmersiveLayout,
  isFocusSplitLayout,
  isWideLayout,
} from './breakpoints';

describe('BREAKPOINTS', () => {
  it('matches Tailwind defaults', () => {
    expect(BREAKPOINTS.sm).toBe(640);
    expect(BREAKPOINTS.md).toBe(768);
    expect(BREAKPOINTS.lg).toBe(1024);
    expect(BREAKPOINTS.focusSplitMinHeight).toBe(640);
  });
});

describe('isWideLayout', () => {
  it('is false for phone portrait and iPad-width-but-not-lg', () => {
    expect(isWideLayout(375)).toBe(false);
    expect(isWideLayout(767)).toBe(false);
    expect(isWideLayout(768)).toBe(false);
    expect(isWideLayout(812)).toBe(false);
    expect(isWideLayout(1023)).toBe(false);
  });

  it('is true from lg upward', () => {
    expect(isWideLayout(1024)).toBe(true);
    expect(isWideLayout(1440)).toBe(true);
  });
});

describe('isFocusSplitLayout', () => {
  it('stays stacked on phone landscape (wide-ish, short)', () => {
    expect(isFocusSplitLayout(812, 375)).toBe(false);
    expect(isFocusSplitLayout(844, 390)).toBe(false);
  });

  it('stays stacked on lg width with short height', () => {
    expect(isFocusSplitLayout(1024, 600)).toBe(false);
    expect(isFocusSplitLayout(1024, 639)).toBe(false);
  });

  it('splits only when both lg width and 640px height are met', () => {
    expect(isFocusSplitLayout(1024, 640)).toBe(true);
    expect(isFocusSplitLayout(1024, 768)).toBe(true);
    expect(isFocusSplitLayout(1440, 900)).toBe(true);
  });

  it('does not split at md width even when height is tall', () => {
    expect(isFocusSplitLayout(768, 1024)).toBe(false);
  });
});

describe('media query strings', () => {
  it('embed the same numbers CSS will use', () => {
    expect(WIDE_LAYOUT_QUERY).toBe('(min-width: 1024px)');
    expect(FOCUS_SPLIT_QUERY).toBe('(min-width: 1024px) and (min-height: 640px)');
  });
});

describe('isFocusImmersiveLayout', () => {
  it('is true for phone landscape (wide-ish, short)', () => {
    expect(isFocusImmersiveLayout(812, 375)).toBe(true);
    expect(isFocusImmersiveLayout(844, 390)).toBe(true);
  });

  it('is false for phone portrait', () => {
    expect(isFocusImmersiveLayout(375, 812)).toBe(false);
  });

  it('is false when split applies', () => {
    expect(isFocusImmersiveLayout(1024, 640)).toBe(false);
    expect(isFocusSplitLayout(1024, 640)).toBe(true);
  });

  it('is true for lg width with short height (not split)', () => {
    expect(isFocusImmersiveLayout(1280, 600)).toBe(true);
    expect(isFocusSplitLayout(1280, 600)).toBe(false);
  });
});

describe('FOCUS_IMMERSIVE_QUERY', () => {
  it('embeds landscape + max-height one below split min height', () => {
    expect(FOCUS_IMMERSIVE_MAX_HEIGHT).toBe(BREAKPOINTS.focusSplitMinHeight - 1);
    expect(FOCUS_IMMERSIVE_QUERY).toBe(
      `(orientation: landscape) and (max-height: ${FOCUS_IMMERSIVE_MAX_HEIGHT}px)`
    );
    expect(FOCUS_IMMERSIVE_QUERY).toBe('(orientation: landscape) and (max-height: 639px)');
  });
});
