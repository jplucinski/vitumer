import { useCallback, useEffect, useState } from 'react';
import { FlowBlock } from '../utils/dslParser';
import {
  buildConversationMessages,
  generateBlocksFromConversation,
} from '../utils/aiService';
import { inferDefaultColor, normalizeColor } from '../constants/blockOptions';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { PromptMode } from '../constants/aiPrompts';
import { AISessionThread, AITurn } from '../types/aiSession';

function createTurnId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function normalizeBlocks(
  blocks: Omit<FlowBlock, 'id' | 'completed'>[]
): FlowBlock[] {
  return blocks.map((b) => ({
    ...b,
    id: createTurnId(),
    color: normalizeColor(b.color ?? inferDefaultColor(b.label)),
    completed: false,
    active: false,
  }));
}

function loadThread(): AISessionThread {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.aiThread);
    if (!raw) {
      return { turns: [], startedAt: Date.now() };
    }
    const parsed = JSON.parse(raw) as AISessionThread;
    if (!parsed || !Array.isArray(parsed.turns)) {
      return { turns: [], startedAt: Date.now() };
    }
    return {
      ...parsed,
      turns: parsed.turns.map((turn) => ({
        ...turn,
        suggestions: Array.isArray(turn.suggestions) ? turn.suggestions : [],
      })),
    };
  } catch {
    return { turns: [], startedAt: Date.now() };
  }
}

function persistThread(thread: AISessionThread): void {
  try {
    localStorage.setItem(STORAGE_KEYS.aiThread, JSON.stringify(thread));
  } catch {
    // ignore storage errors
  }
}

function getPreviousBlocks(turns: AITurn[]): FlowBlock[] | undefined {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    if (turns[i].blocks.length > 0) {
      return turns[i].blocks;
    }
  }
  return undefined;
}

interface UseAISessionThreadOptions {
  apiKey: string | null;
  modelId: string;
  promptMode: PromptMode;
  onAccept?: (blocks: FlowBlock[]) => void;
}

export function useAISessionThread({
  apiKey,
  modelId,
  promptMode,
  onAccept,
}: UseAISessionThreadOptions) {
  const [thread, setThread] = useState<AISessionThread>(() => loadThread());
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingTurnId, setThinkingTurnId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    persistThread(thread);
  }, [thread]);

  const updateThread = useCallback((updater: (prev: AISessionThread) => AISessionThread) => {
    setThread((prev) => updater(prev));
  }, []);

  const runGeneration = useCallback(
    async (turnsBeforeNew: AITurn[], userMessage: string) => {
      if (!apiKey) {
        throw new Error('Connect OpenRouter in Settings to generate a session with AI.');
      }

      const messages = buildConversationMessages(turnsBeforeNew);
      messages.push({ role: 'user', content: userMessage });

      const previousBlocks = getPreviousBlocks(turnsBeforeNew);
      const response = await generateBlocksFromConversation(
        apiKey,
        modelId,
        messages,
        previousBlocks,
        undefined,
        promptMode
      );

      const blocks = normalizeBlocks(response.blocks);
      if (blocks.length === 0) {
        throw new Error('AI did not generate any blocks. Try a different prompt.');
      }

      return {
        reasoning: response.reasoning,
        blocks,
        suggestions: response.suggestions,
      };
    },
    [apiKey, modelId, promptMode]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      setIsThinking(true);
      setError(null);

      const turnsBeforeNew = thread.turns;
      const turnId = createTurnId();
      const optimisticTurn: AITurn = {
        id: turnId,
        userMessage: trimmed,
        reasoning: '',
        blocks: [],
        suggestions: [],
        status: 'pending',
        createdAt: Date.now(),
      };

      updateThread((prev) => ({
        ...prev,
        turns: [...prev.turns, optimisticTurn],
      }));
      setThinkingTurnId(turnId);

      try {
        const { reasoning, blocks, suggestions } = await runGeneration(turnsBeforeNew, trimmed);

        updateThread((prev) => ({
          ...prev,
          turns: prev.turns.map((t) =>
            t.id === turnId ? { ...t, reasoning, blocks, suggestions } : t
          ),
        }));
      } catch (err: any) {
        updateThread((prev) => ({
          ...prev,
          turns: prev.turns.filter((t) => t.id !== turnId),
        }));
        setError(err.message ?? 'AI generation failed.');
      } finally {
        setIsThinking(false);
        setThinkingTurnId(null);
      }
    },
    [isThinking, runGeneration, thread.turns, updateThread]
  );

  const editAndResend = useCallback(
    async (existingTurnId: string, newText: string) => {
      const trimmed = newText.trim();
      if (!trimmed || isThinking) return;

      const turnIndex = thread.turns.findIndex((t) => t.id === existingTurnId);
      if (turnIndex === -1) return;

      setIsThinking(true);
      setError(null);

      const turnsBefore = thread.turns.slice(0, turnIndex);
      const newTurnId = createTurnId();
      const optimisticTurn: AITurn = {
        id: newTurnId,
        userMessage: trimmed,
        reasoning: '',
        blocks: [],
        suggestions: [],
        status: 'pending',
        createdAt: Date.now(),
      };

      updateThread((prev) => ({
        ...prev,
        turns: [...turnsBefore, optimisticTurn],
      }));
      setThinkingTurnId(newTurnId);

      try {
        const { reasoning, blocks, suggestions } = await runGeneration(turnsBefore, trimmed);

        updateThread((prev) => ({
          ...prev,
          turns: prev.turns.map((t) =>
            t.id === newTurnId ? { ...t, reasoning, blocks, suggestions } : t
          ),
        }));
      } catch (err: any) {
        updateThread((prev) => ({
          ...prev,
          turns: prev.turns.filter((t) => t.id !== newTurnId),
        }));
        setError(err.message ?? 'AI generation failed.');
      } finally {
        setIsThinking(false);
        setThinkingTurnId(null);
      }
    },
    [isThinking, runGeneration, thread.turns, updateThread]
  );

  const acceptTurn = useCallback(
    (turnId: string) => {
      const turn = thread.turns.find((t) => t.id === turnId);
      if (!turn) return;

      onAccept?.(turn.blocks);
      setThread({ turns: [], startedAt: Date.now() });
    },
    [onAccept, thread.turns]
  );

  const rejectTurn = useCallback(
    (turnId: string) => {
      updateThread((prev) => ({
        ...prev,
        turns: prev.turns.map((t) =>
          t.id === turnId ? { ...t, status: 'rejected' as const } : t
        ),
      }));
    },
    [updateThread]
  );

  const resetThread = useCallback(() => {
    setThread({ turns: [], startedAt: Date.now() });
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const latestPendingTurn = [...thread.turns].reverse().find((t) => t.status === 'pending');

  return {
    thread,
    isThinking,
    thinkingTurnId,
    error,
    latestPendingTurn,
    sendMessage,
    editAndResend,
    acceptTurn,
    rejectTurn,
    resetThread,
    clearError,
  };
}
