export type AiCallErrorKind = 'auth' | 'provider' | 'parse' | 'empty';

export const AI_CALL_COPY = {
  noKey: 'Connect OpenRouter in Settings to generate a session with AI.',
  auth: 'Couldn’t authenticate with OpenRouter. Check the key in Settings.',
  credits: 'Not enough credits. Switch model or add credits on OpenRouter.',
  modelUnavailable: 'This model isn’t available. Pick another and retry.',
  rateLimited: 'Rate limited. Retry, or pick another model.',
  unavailable: 'OpenRouter is unavailable. Retry or pick another model.',
  network: 'Network error. Check the connection, then retry.',
  otherHttp: 'OpenRouter request failed. Pick another model or retry.',
  parse: 'The model returned invalid output. Retry.',
  emptyBlocks: 'AI did not generate any blocks. Retry.',
} as const;

export class AiCallError extends Error {
  readonly kind: AiCallErrorKind;
  readonly status?: number;
  readonly detail?: string;

  constructor(
    kind: AiCallErrorKind,
    message: string,
    options?: { status?: number; detail?: string }
  ) {
    super(message);
    this.name = 'AiCallError';
    this.kind = kind;
    this.status = options?.status;
    this.detail = options?.detail;
  }
}

const MODEL_UNAVAILABLE_RE =
  /model (is )?not found|no endpoints found|not a valid model|unknown model/i;

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function extractDetail(bodyText: string | undefined): string | undefined {
  if (!bodyText) return undefined;

  let candidate: string | undefined;
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (parsed && typeof parsed === 'object') {
      const message = (parsed as { error?: { message?: unknown } }).error?.message;
      if (typeof message === 'string') candidate = message;
    }
  } catch {
    if (!looksLikeJson(bodyText)) candidate = bodyText.trim();
  }

  if (!candidate) return undefined;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.length > 160 || looksLikeJson(trimmed)) return undefined;
  return trimmed;
}

export function parseOpenRouterError(
  status: number | undefined,
  bodyText: string | undefined,
  options?: { network?: boolean }
): AiCallError {
  if (options?.network) {
    return new AiCallError('provider', AI_CALL_COPY.network);
  }

  const detail = extractDetail(bodyText);
  const extra = { status, detail };

  if (status === 401 || status === 403) {
    return new AiCallError('auth', AI_CALL_COPY.auth, extra);
  }
  if (status === 402) {
    return new AiCallError('provider', AI_CALL_COPY.credits, extra);
  }
  if (status === 429) {
    return new AiCallError('provider', AI_CALL_COPY.rateLimited, extra);
  }
  if (status !== undefined && status >= 500) {
    return new AiCallError('provider', AI_CALL_COPY.unavailable, extra);
  }
  if (status === 404 || (detail && MODEL_UNAVAILABLE_RE.test(detail))) {
    return new AiCallError('provider', AI_CALL_COPY.modelUnavailable, extra);
  }
  return new AiCallError('provider', AI_CALL_COPY.otherHttp, extra);
}

export function normalizeAiCallError(err: unknown): AiCallError {
  if (err instanceof AiCallError) return err;
  return parseOpenRouterError(undefined, undefined, { network: true });
}
