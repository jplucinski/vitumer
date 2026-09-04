import { useEffect } from 'react';

type UseKeyboardShortcutsOptions = {
  isFocusMode: boolean;
  blocksCount: number;
  onToggleKeyboardHelp: () => void;
  onEnterFocusMode: () => void;
};

function isTypingInField(): boolean {
  const active = document.activeElement;
  return !!(
    active &&
    (active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.getAttribute('contenteditable') === 'true')
  );
}

export function useKeyboardShortcuts({
  isFocusMode,
  blocksCount,
  onToggleKeyboardHelp,
  onEnterFocusMode,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        if (isTypingInField()) return;
        e.preventDefault();
        onToggleKeyboardHelp();
        return;
      }

      if (
        e.key.toLowerCase() === 'f' &&
        !isFocusMode &&
        blocksCount > 0 &&
        !isTypingInField() &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        onEnterFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, blocksCount, onToggleKeyboardHelp, onEnterFocusMode]);
}
