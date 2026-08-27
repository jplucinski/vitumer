// src/utils/aiService.ts
import { FlowBlock } from './dslParser';
import { inferDefaultColor, normalizeColor } from '../constants/blockOptions';
import { AIMessage, AIRefinementSuggestion } from '../types/aiSession';

export interface AIResponse {
  reasoning: string;
  blocks: Omit<FlowBlock, 'id' | 'completed'>[];
  suggestions: AIRefinementSuggestion[];
}

interface CachedAIResponse {
  createdAt: number;
  response: AIResponse;
}

import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  buildBlockGenerationSystemPrompt,
  type PromptMode,
} from '../constants/aiPrompts';
import { AI_CALL_COPY, AiCallError, normalizeAiCallError, parseOpenRouterError } from './aiCallError';

const CACHE_PREFIX = STORAGE_KEYS.aiCachePrefix;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 3;
const MAX_SUGGESTIONS = 4;

function getCacheKey(
  messages: AIMessage[],
  modelId: string,
  apiBaseUrl: string,
  promptMode: PromptMode
): string {
  const normalized = JSON.stringify({ messages, modelId, apiBaseUrl, promptMode });
  return CACHE_PREFIX + btoa(unescape(encodeURIComponent(normalized))).replace(/=+$/, '');
}

function getCachedResponse(cacheKey: string): AIResponse | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const cached: CachedAIResponse = JSON.parse(raw);
    if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return {
      ...cached.response,
      suggestions: normalizeSuggestions(cached.response.suggestions),
    };
  } catch {
    return null;
  }
}

function setCachedResponse(cacheKey: string, response: AIResponse): void {
  try {
    const cached: CachedAIResponse = { createdAt: Date.now(), response };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch {
    // ignore storage errors
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAutoRetryable(err: unknown, attempt: number): boolean {
  if (attempt >= MAX_RETRIES) return false;
  if (!(err instanceof AiCallError) || err.kind !== 'provider') return false;
  if (err.status === undefined) return true;
  return err.status === 429 || err.status >= 500;
}

function buildSystemPrompt(
  previousBlocks: FlowBlock[] | undefined,
  promptMode: PromptMode
): string {
  return buildBlockGenerationSystemPrompt(promptMode, Boolean(previousBlocks?.length));
}

export function normalizeSuggestions(raw: unknown): AIRefinementSuggestion[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const out: AIRefinementSuggestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const label = String((item as { label?: unknown }).label ?? '').trim();
    const text = String((item as { text?: unknown }).text ?? '').trim();
    if (!label || !text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      label: label.slice(0, 28),
      text: text.slice(0, 200),
    });
    if (out.length >= MAX_SUGGESTIONS) break;
  }

  return out;
}

function serializeAssistantTurn(
  reasoning: string,
  blocks: Omit<FlowBlock, 'id' | 'completed'>[],
  suggestions: AIRefinementSuggestion[]
): string {
  return JSON.stringify({ reasoning, blocks, suggestions });
}

export function buildConversationMessages(
  turns: Array<{
    userMessage: string;
    reasoning: string;
    blocks: FlowBlock[];
    suggestions?: AIRefinementSuggestion[];
  }>
): AIMessage[] {
  const messages: AIMessage[] = [];
  for (const turn of turns) {
    messages.push({ role: 'user', content: turn.userMessage });
    const blocksForApi = turn.blocks.map(({ id: _id, completed: _completed, active: _active, ...rest }) => rest);
    messages.push({
      role: 'assistant',
      content: serializeAssistantTurn(turn.reasoning, blocksForApi, turn.suggestions ?? []),
    });
  }
  return messages;
}

export async function generateBlocksFromConversation(
  apiKey: string,
  modelId: string,
  messages: AIMessage[],
  previousBlocks?: FlowBlock[],
  apiBaseUrl?: string,
  promptMode: PromptMode = 'compact'
): Promise<AIResponse> {
  const defaultUrl = 'https://openrouter.ai/api/v1';
  const cleanBaseUrl = apiBaseUrl && apiBaseUrl.trim() !== ''
    ? apiBaseUrl.replace(/\/+$/, '')
    : defaultUrl;

  const apiMessages: AIMessage[] = [
    { role: 'system', content: buildSystemPrompt(previousBlocks, promptMode) },
    ...messages,
  ];

  const cacheKey = getCacheKey(apiMessages, modelId, cleanBaseUrl, promptMode);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const payload = {
    model: modelId,
    messages: apiMessages,
    response_format: {
      type: 'json_object',
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim() !== '') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (cleanBaseUrl.includes('openrouter.ai')) {
    headers['Referer'] = window.location.origin;
    headers['X-Title'] = 'Vitumer AI Generator';
  }

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_RETRIES) {
    try {
      const resp = await fetch(`${cleanBaseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw parseOpenRouterError(resp.status, errorText);
      }

      const result = await resp.json();
      const content = result?.choices?.[0]?.message?.content;
      if (!content) {
        throw new AiCallError('parse', AI_CALL_COPY.parse);
      }

      try {
        const parsed = JSON.parse(content);
        if (!parsed.reasoning || !Array.isArray(parsed.blocks)) {
          throw new Error('JSON response missing required reasoning or blocks fields.');
        }
        const aiResponse: AIResponse = {
          reasoning: parsed.reasoning,
          blocks: parsed.blocks.map((b: Omit<FlowBlock, 'id' | 'completed'>) => ({
            ...b,
            color: normalizeColor(b.color ?? inferDefaultColor(b.label ?? '')),
          })),
          suggestions: normalizeSuggestions(parsed.suggestions),
        };
        setCachedResponse(cacheKey, aiResponse);
        return aiResponse;
      } catch (err: unknown) {
        if (err instanceof AiCallError) throw err;
        throw new AiCallError('parse', AI_CALL_COPY.parse);
      }
    } catch (err) {
      const normalized = err instanceof AiCallError ? err : normalizeAiCallError(err);
      lastError = normalized;
      attempt += 1;
      if (!isAutoRetryable(normalized, attempt)) break;
      await delay(400 * attempt);
    }
  }

  throw lastError instanceof AiCallError
    ? lastError
    : normalizeAiCallError(lastError);
}

export async function generateBlocksFromAI(
  apiKey: string,
  modelId: string,
  prompt: string,
  apiBaseUrl?: string,
  promptMode: PromptMode = 'compact'
): Promise<AIResponse> {
  return generateBlocksFromConversation(
    apiKey,
    modelId,
    [{ role: 'user', content: prompt }],
    undefined,
    apiBaseUrl,
    promptMode
  );
}
