const OLD_PREFIX = 'dividedtime_';
export const STORAGE_PREFIX = 'vitumer_';

export const storageKey = (suffix: string) => `${STORAGE_PREFIX}${suffix}`;

export const STORAGE_KEYS = {
  colorMode: storageKey('color_mode'),
  theme: storageKey('theme'),
  activeBlocks: storageKey('active_blocks'),
  timerProgress: storageKey('timer_progress'),
  rejectedAiSuggestions: storageKey('rejected_ai_suggestions'),
  aiThread: storageKey('ai_thread'),
  aiCachePrefix: storageKey('ai_cache_'),
  aiPromptMode: storageKey('ai_prompt_mode'),
  openrouterPasskeyVault: storageKey('openrouter_passkey_vault'),
} as const;

export function migrateLegacyStorageKeys() {
  const suffixes = [
    'color_mode',
    'theme',
    'active_blocks',
    'timer_progress',
    'rejected_ai_suggestions',
  ];

  for (const suffix of suffixes) {
    const oldKey = `${OLD_PREFIX}${suffix}`;
    const newKey = `${STORAGE_PREFIX}${suffix}`;
    const value = localStorage.getItem(oldKey);
    if (value !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, value);
    }
    localStorage.removeItem(oldKey);
  }

  const keysToMigrate: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${OLD_PREFIX}ai_cache_`)) {
      keysToMigrate.push(key);
    }
  }

  for (const oldKey of keysToMigrate) {
    const newKey = oldKey.replace(OLD_PREFIX, STORAGE_PREFIX);
    if (localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey)!);
    }
    localStorage.removeItem(oldKey);
  }
}
