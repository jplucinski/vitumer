// WebAuthn PRF vault — seals secrets at rest with a passkey-derived AES key.
// Protects disk / localStorage dumps; does NOT protect against XSS after unlock.

import { STORAGE_KEYS } from '../constants/storageKeys';

const HKDF_INFO = new TextEncoder().encode('vitumer-openrouter-key-v1');
const UV: UserVerificationRequirement = 'required';

export type PasskeyVaultRecord = {
  v: 1;
  credId: string;
  salt: string;
  iv: string;
  ct: string;
};

type PrfExtensionResults = {
  prf?: {
    enabled?: boolean;
    results?: {
      first?: ArrayBuffer;
    };
  };
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function bufferSourceToBytes(value: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

export function isWebAuthnAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
}

export function getPasskeyVaultRecord(): PasskeyVaultRecord | null {
  const raw = localStorage.getItem(STORAGE_KEYS.openrouterPasskeyVault);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PasskeyVaultRecord;
    if (parsed?.v !== 1 || !parsed.credId || !parsed.salt || !parsed.iv || !parsed.ct) {
      localStorage.removeItem(STORAGE_KEYS.openrouterPasskeyVault);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.openrouterPasskeyVault);
    return null;
  }
}

export function hasPasskeyVault(): boolean {
  return getPasskeyVaultRecord() !== null;
}

export function clearPasskeyVault(): void {
  localStorage.removeItem(STORAGE_KEYS.openrouterPasskeyVault);
}

async function deriveAesKey(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: HKDF_INFO,
    },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function getPrfOutput(credId: Uint8Array, salt: Uint8Array): Promise<ArrayBuffer> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: window.location.hostname,
      allowCredentials: [{ type: 'public-key', id: credId }],
      userVerification: UV,
      extensions: {
        prf: {
          eval: {
            first: salt,
          },
        },
      } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error('Passkey authentication was cancelled.');
  }

  const ext = assertion.getClientExtensionResults() as PrfExtensionResults;
  const first = ext.prf?.results?.first;
  if (!first) {
    throw new Error('This authenticator did not return a PRF result. Try another passkey device.');
  }
  return first;
}

/** Client capability hint only — authenticator may still lack PRF at seal time. */
export async function isPrfExtensionSupported(): Promise<boolean> {
  if (!isWebAuthnAvailable() || !window.isSecureContext) return false;

  const PK = window.PublicKeyCredential as typeof PublicKeyCredential & {
    getClientCapabilities?: () => Promise<Record<string, boolean>>;
  };

  if (typeof PK.getClientCapabilities === 'function') {
    try {
      const caps = await PK.getClientCapabilities();
      if (caps['extension:prf'] === false) return false;
      if (caps['extension:prf'] === true) return true;
    } catch {
      // fall through
    }
  }

  return true;
}

/**
 * Register a new passkey (PRF) and seal `secret` into localStorage.
 * Prefers PRF eval during create (one ceremony); falls back to get() when needed.
 * Replaces any existing vault record.
 */
export async function sealSecretWithPasskey(secret: string): Promise<void> {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn is not available in this browser.');
  }
  if (!window.isSecureContext) {
    throw new Error('Passkeys require a secure context (HTTPS or localhost).');
  }

  const salt = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { id: window.location.hostname, name: 'Vitumer' },
      user: {
        id: userId,
        name: 'vitumer-openrouter-vault',
        displayName: 'Vitumer OpenRouter vault',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: UV,
      },
      timeout: 120_000,
      extensions: {
        prf: {
          eval: {
            first: salt,
          },
        },
      } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;

  if (!cred) {
    throw new Error('Passkey registration was cancelled.');
  }

  const createExt = cred.getClientExtensionResults() as PrfExtensionResults;
  if (!createExt.prf?.enabled) {
    throw new Error(
      'This authenticator does not support WebAuthn PRF. Use session-only storage instead.'
    );
  }

  const credId = bufferSourceToBytes(cred.rawId);
  let prfOutput = createExt.prf.results?.first ?? null;
  if (!prfOutput) {
    // Platform/roaming authenticators that enable PRF at create but only eval on get.
    prfOutput = await getPrfOutput(credId, salt);
  }

  const aesKey = await deriveAesKey(prfOutput);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(secret)
  );

  const record: PasskeyVaultRecord = {
    v: 1,
    credId: bytesToBase64(credId),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ct: bytesToBase64(bufferSourceToBytes(ciphertext)),
  };

  localStorage.setItem(STORAGE_KEYS.openrouterPasskeyVault, JSON.stringify(record));
}

/** Unlock vault with passkey → returns plaintext secret. */
export async function unlockSecretWithPasskey(): Promise<string> {
  const record = getPasskeyVaultRecord();
  if (!record) {
    throw new Error('No passkey vault found.');
  }

  const credId = base64ToBytes(record.credId);
  const salt = base64ToBytes(record.salt);
  const iv = base64ToBytes(record.iv);
  const ct = base64ToBytes(record.ct);

  const prfOutput = await getPrfOutput(credId, salt);
  const aesKey = await deriveAesKey(prfOutput);

  try {
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
    return new TextDecoder().decode(plainBuf);
  } catch {
    throw new Error('Failed to decrypt vault. Wrong passkey or corrupted data.');
  }
}
