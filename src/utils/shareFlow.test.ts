import { describe, expect, it } from 'vitest';
import { decodeFlowParam, encodeFlowParam, buildShareUrl } from './shareFlow';

const EMOJI_DSL =
  '25m pomo {Warmup, emails} [color:orange, emoji:☕] + 5m break {Step away, water} [color:teal, emoji:💧]';

const LEGACY_PLUS_DSL = '100m block [emoji:🔥] + 1m rest';

describe('encodeFlowParam / decodeFlowParam', () => {
  it('round-trips DSL with emoji and plus separators', () => {
    const param = decodeURIComponent(encodeFlowParam(EMOJI_DSL));
    expect(decodeFlowParam(param)).toBe(EMOJI_DSL);
  });

  it('survives URLSearchParams roundtrip when encoded', () => {
    const encoded = encodeFlowParam(EMOJI_DSL);
    const fromParams = new URLSearchParams(`flow=${encoded}`).get('flow');
    expect(fromParams).not.toBeNull();
    expect(decodeFlowParam(fromParams!)).toBe(EMOJI_DSL);
  });

  it('decodes legacy raw base64 where plus became space in query', () => {
    const rawBase64 = btoa(unescape(encodeURIComponent(LEGACY_PLUS_DSL)));
    const mutated = new URLSearchParams(`flow=${rawBase64}`).get('flow');
    expect(mutated).not.toBe(rawBase64);
    expect(decodeFlowParam(mutated!)).toBe(LEGACY_PLUS_DSL);
  });

  it('handles base64 padding stripped by intermediaries', () => {
    const encoded = encodeFlowParam(EMOJI_DSL);
    const stripped = encoded.replace(/=+$/, '');
    const fromParams = new URLSearchParams(`flow=${stripped}`).get('flow');
    expect(decodeFlowParam(fromParams!)).toBe(EMOJI_DSL);
  });
});

describe('buildShareUrl', () => {
  it('builds a percent-encoded flow query URL', () => {
    const url = buildShareUrl('https://vitumer.example', EMOJI_DSL);
    const flow = new URL(url).searchParams.get('flow');
    expect(flow).not.toBeNull();
    expect(decodeFlowParam(flow!)).toBe(EMOJI_DSL);
  });
});
