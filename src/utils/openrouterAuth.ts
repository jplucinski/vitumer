// src/utils/openrouterAuth.ts
// ------------------------------------------------------------
// Helper functions for PKCE, token exchange and local storage.
// Security notes are marked with /*** SEC ***/ comments.

import { clearPasskeyVault } from './passkeyVault';

/** Generate a cryptographically random string */
export const randomString = (length = 64): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  const cryptoObj = window.crypto ?? (window as any).msCrypto;
  cryptoObj.getRandomValues(randomValues);
  let result = '';
  randomValues.forEach(v => (result += charset[v % charset.length]));
  return result;
};

/** Base64‑URL‑encode a Uint8Array */
export const base64UrlEncode = (buf: Uint8Array): string => {
  return btoa(String.fromCharCode(...Array.from(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

/** SHA‑256 hash a UTF‑8 string */
const sha256 = async (plain: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
};

/** Create the PKCE code_challenge from a verifier */
export const createCodeChallenge = async (verifier: string): Promise<string> => {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
};

/** *** SEC *** Store the verifier only for the OAuth flow (sessionStorage) */
export const storeCodeVerifier = (verifier: string): void => {
  sessionStorage.setItem('openrouter_code_verifier', verifier);
};

export const getCodeVerifier = (): string | null =>
  sessionStorage.getItem('openrouter_code_verifier');

/** *** SEC *** Session-only plaintext — cleared when the tab closes */
export const storeApiKeySession = (apiKey: string): void => {
  sessionStorage.setItem('openrouter_api_key', apiKey);
};

export const getStoredApiKey = (): string | null => sessionStorage.getItem('openrouter_api_key');

/** One-shot migrate: old plaintext localStorage key → session, then wipe LS */
export const migrateLegacyPlaintextApiKey = (): void => {
  const legacy = localStorage.getItem('openrouter_api_key');
  if (!legacy) return;
  if (!sessionStorage.getItem('openrouter_api_key')) {
    sessionStorage.setItem('openrouter_api_key', legacy);
  }
  localStorage.removeItem('openrouter_api_key');
};

/** Clear all OpenRouter related data (incl. passkey vault ciphertext) */
export const clearAllOpenRouterData = (): void => {
  localStorage.removeItem('openrouter_api_key');
  sessionStorage.removeItem('openrouter_api_key');
  sessionStorage.removeItem('openrouter_code_verifier');
  sessionStorage.removeItem('openrouter_auth_mode');
  clearPasskeyVault();
};

export const setAuthMode = (mode: 'session' | 'passkey'): void => {
  sessionStorage.setItem('openrouter_auth_mode', mode);
};

export const getAuthMode = (): 'session' | 'passkey' | null => {
  const mode = sessionStorage.getItem('openrouter_auth_mode');
  return mode === 'session' || mode === 'passkey' ? mode : null;
};

/** OAuth callback — root path so static hosting serves index.html without rewrites */
export const getOAuthCallbackUrl = (): string => `${window.location.origin}/`;

/** Build the auth URL that the user will be redirected to */
export const buildAuthUrl = async (callbackUrl = getOAuthCallbackUrl()): Promise<string> => {
  const verifier = randomString(128);
  storeCodeVerifier(verifier);
  const challenge = await createCodeChallenge(verifier);
  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `https://openrouter.ai/auth?${params.toString()}`;
};

/** Exchange the temporary code for a user‑controlled API key */
export const exchangeCodeForKey = async (code: string): Promise<string> => {
  const verifier = getCodeVerifier();
  if (!verifier) {
    throw new Error('Code verifier missing from sessionStorage.');
  }

  const payload = {
    code,
    code_verifier: verifier,
    code_challenge_method: 'S256',
  };

  const resp = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Exchange failed (${resp.status}): ${txt}`);
  }
  const data = await resp.json();
  sessionStorage.removeItem('openrouter_code_verifier');
  const apiKey = data.key ?? data.api_key;
  if (!apiKey) {
    throw new Error('API key not present in exchange response.');
  }
  return apiKey;
};

/** Send a chat message to OpenRouter or Custom Endpoint */
export const sendMessage = async (
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  baseUrl?: string
): Promise<string> => {
  const defaultUrl = 'https://openrouter.ai/api/v1';
  const cleanBaseUrl = baseUrl && baseUrl.trim() !== '' 
    ? baseUrl.replace(/\/+$/, '') 
    : defaultUrl;

  const payload = { model, messages };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim() !== '') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (cleanBaseUrl.includes('openrouter.ai')) {
    headers['Referer'] = window.location.origin;
    headers['X-Title'] = 'Vitumer OpenRouter Demo';
  }

  const resp = await fetch(`${cleanBaseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Chat API error (${resp.status}): ${txt}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected chat response format.');
  }
  return content;
};

/** Helper to clear all stored data (used by UI) */
export const disconnectOpenRouter = (): void => {
  clearAllOpenRouterData();
};

export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
};

export type ModelSort = 'most-popular' | 'pricing-low-to-high' | 'pricing-high-to-low';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

function buildOpenRouterHeaders(apiKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey?.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }
  headers['Referer'] = window.location.origin;
  headers['X-Title'] = 'Vitumer OpenRouter Demo';
  return headers;
}

/** Fetch available models from OpenRouter (supports server-side search via `q`) */
export async function fetchOpenRouterModels(options?: {
  q?: string;
  apiKey?: string | null;
  sort?: ModelSort;
}): Promise<OpenRouterModel[]> {
  const params = new URLSearchParams({
    output_modalities: 'text',
    sort: options?.sort ?? 'most-popular',
  });

  const query = options?.q?.trim();
  if (query) {
    params.set('q', query);
  }

  const resp = await fetch(`${OPENROUTER_BASE_URL}/models?${params.toString()}`, {
    headers: buildOpenRouterHeaders(options?.apiKey),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to fetch models (${resp.status}): ${txt}`);
  }

  const data = await resp.json();
  const models: unknown[] = Array.isArray(data?.data) ? data.data : [];

  return models
    .map((item): OpenRouterModel | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : '';
      const name = typeof record.name === 'string' ? record.name : id;
      if (!id) return null;
      const pricingRaw = record.pricing;
      let pricing: OpenRouterModel['pricing'];
      if (pricingRaw && typeof pricingRaw === 'object') {
        const p = pricingRaw as Record<string, unknown>;
        pricing = {
          prompt: typeof p.prompt === 'string' ? p.prompt : undefined,
          completion: typeof p.completion === 'string' ? p.completion : undefined,
        };
      }
      return {
        id,
        name,
        description: typeof record.description === 'string' ? record.description : undefined,
        context_length:
          typeof record.context_length === 'number' ? record.context_length : undefined,
        pricing,
      };
    })
    .filter((model): model is OpenRouterModel => model !== null);
}

// ------------------------------------------------------------
