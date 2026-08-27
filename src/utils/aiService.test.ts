import { afterEach, describe, expect, it, vi } from 'vitest';
import { AI_CALL_COPY, AiCallError } from './aiCallError';
import { generateBlocksFromConversation } from './aiService';

describe('generateBlocksFromConversation errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws AiCallError auth on 401 without the raw body in message', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: 'Invalid token', code: 401 } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    const err = await generateBlocksFromConversation('sk-test', 'openai/gpt-4o-mini', [
      { role: 'user', content: 'hi' },
    ]).catch((e) => e);

    expect(err).toBeInstanceOf(AiCallError);
    expect(err).toMatchObject({
      name: 'AiCallError',
      kind: 'auth',
      status: 401,
      message: AI_CALL_COPY.auth,
    });
    expect(String(err.message)).not.toContain('Invalid token');
    expect(err.detail).toBe('Invalid token');
  });
});
