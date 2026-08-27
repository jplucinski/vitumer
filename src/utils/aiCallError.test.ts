import { describe, expect, it } from 'vitest';
import {
  AI_CALL_COPY,
  AiCallError,
  normalizeAiCallError,
  parseOpenRouterError,
} from './aiCallError';

const jsonBody = JSON.stringify({
  error: { message: 'Provider exploded', code: 400 },
});

describe('parseOpenRouterError', () => {
  it('maps 401 to auth and never copies the JSON body into message', () => {
    const err = parseOpenRouterError(401, jsonBody);
    expect(err).toBeInstanceOf(AiCallError);
    expect(err.kind).toBe('auth');
    expect(err.status).toBe(401);
    expect(err.message).toBe(AI_CALL_COPY.auth);
    expect(err.message).not.toContain('{');
    expect(err.detail).toBe('Provider exploded');
  });

  it('maps 404 to provider + model-unavailable copy', () => {
    const err = parseOpenRouterError(404, '{"error":{"message":"No such model"}}');
    expect(err.kind).toBe('provider');
    expect(err.message).toBe(AI_CALL_COPY.modelUnavailable);
  });

  it('maps 402 / 429 / 500 to provider with matching copy', () => {
    expect(parseOpenRouterError(402, '').message).toBe(AI_CALL_COPY.credits);
    expect(parseOpenRouterError(429, '').message).toBe(AI_CALL_COPY.rateLimited);
    expect(parseOpenRouterError(500, '').message).toBe(AI_CALL_COPY.unavailable);
    expect(parseOpenRouterError(500, '').kind).toBe('provider');
  });

  it('treats model-not-found text as unavailable even when status is 400', () => {
    const err = parseOpenRouterError(
      400,
      JSON.stringify({ error: { message: 'openai/nope is not a valid model' } })
    );
    expect(err.message).toBe(AI_CALL_COPY.modelUnavailable);
  });

  it('omits JSON-looking or long detail', () => {
    const raw = parseOpenRouterError(400, '{"not":"openrouter-shape"}');
    expect(raw.detail).toBeUndefined();
    expect(raw.message).toBe(AI_CALL_COPY.otherHttp);

    const long = 'x'.repeat(161);
    const err = parseOpenRouterError(400, JSON.stringify({ error: { message: long } }));
    expect(err.detail).toBeUndefined();
  });

  it('maps network failures to provider + network copy', () => {
    const err = parseOpenRouterError(undefined, undefined, { network: true });
    expect(err.kind).toBe('provider');
    expect(err.status).toBeUndefined();
    expect(err.message).toBe(AI_CALL_COPY.network);
  });
});

describe('normalizeAiCallError', () => {
  it('returns the same AiCallError instance', () => {
    const err = new AiCallError('parse', AI_CALL_COPY.parse);
    expect(normalizeAiCallError(err)).toBe(err);
  });

  it('wraps unknown errors as network provider failures', () => {
    const err = normalizeAiCallError(new TypeError('Failed to fetch'));
    expect(err.kind).toBe('provider');
    expect(err.message).toBe(AI_CALL_COPY.network);
  });
});
