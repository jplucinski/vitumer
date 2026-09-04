import { useReducer, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

const THEME_CLASSES = ['theme-aura', 'theme-cyberpunk', 'theme-forest', 'theme-nord'] as const;

type UiState = {
  isDark: boolean;
  theme: string;
  showSettings: boolean;
  showKeyboardHelp: boolean;
  showQrModal: boolean;
  shareUrl: string;
};

type UiAction =
  | { type: 'TOGGLE_DARK' }
  | { type: 'SET_THEME'; theme: string }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'TOGGLE_KEYBOARD_HELP' }
  | { type: 'CLOSE_KEYBOARD_HELP' }
  | { type: 'OPEN_QR_MODAL'; shareUrl: string }
  | { type: 'CLOSE_QR_MODAL' };

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'TOGGLE_DARK':
      return { ...state, isDark: !state.isDark };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'OPEN_SETTINGS':
      return { ...state, showSettings: true };
    case 'CLOSE_SETTINGS':
      return { ...state, showSettings: false };
    case 'TOGGLE_KEYBOARD_HELP':
      return { ...state, showKeyboardHelp: !state.showKeyboardHelp };
    case 'CLOSE_KEYBOARD_HELP':
      return { ...state, showKeyboardHelp: false };
    case 'OPEN_QR_MODAL':
      return { ...state, showQrModal: true, shareUrl: action.shareUrl };
    case 'CLOSE_QR_MODAL':
      return { ...state, showQrModal: false };
    default:
      return state;
  }
}

export function useAppUi() {
  const [state, dispatch] = useReducer(uiReducer, {
    isDark: localStorage.getItem(STORAGE_KEYS.colorMode) !== 'light',
    theme: localStorage.getItem(STORAGE_KEYS.theme) || 'aura',
    showSettings: false,
    showKeyboardHelp: false,
    showQrModal: false,
    shareUrl: '',
  });

  useEffect(() => {
    const root = document.documentElement;
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`theme-${state.theme}`);
    if (state.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.isDark, state.theme]);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK' });
    const currentlyDark = localStorage.getItem(STORAGE_KEYS.colorMode) !== 'light';
    localStorage.setItem(STORAGE_KEYS.colorMode, currentlyDark ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((theme: string) => {
    dispatch({ type: 'SET_THEME', theme });
  }, []);

  const openSettings = useCallback(() => dispatch({ type: 'OPEN_SETTINGS' }), []);
  const closeSettings = useCallback(() => dispatch({ type: 'CLOSE_SETTINGS' }), []);
  const toggleKeyboardHelp = useCallback(() => dispatch({ type: 'TOGGLE_KEYBOARD_HELP' }), []);
  const closeKeyboardHelp = useCallback(() => dispatch({ type: 'CLOSE_KEYBOARD_HELP' }), []);
  const openQrModal = useCallback((shareUrl: string) => {
    dispatch({ type: 'OPEN_QR_MODAL', shareUrl });
  }, []);
  const closeQrModal = useCallback(() => dispatch({ type: 'CLOSE_QR_MODAL' }), []);

  const persistTheme = useCallback((theme: string) => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, []);

  return {
    isDark: state.isDark,
    theme: state.theme,
    showSettings: state.showSettings,
    showKeyboardHelp: state.showKeyboardHelp,
    showQrModal: state.showQrModal,
    shareUrl: state.shareUrl,
    toggleDarkMode,
    setTheme,
    openSettings,
    closeSettings,
    toggleKeyboardHelp,
    closeKeyboardHelp,
    openQrModal,
    closeQrModal,
    persistTheme,
  };
}
