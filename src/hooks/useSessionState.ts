import { useReducer, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { parseDSL, type FlowBlock } from '../utils/dslParser';
import { normalizeBlocks } from '../utils/dslSchema';
import { decodeFlowParam } from '../utils/shareFlow';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { restoreTimerProgress, type RestoredTimer } from '../utils/timerProgress';

export const MOCK_BLOCKS: FlowBlock[] = [
  {
    id: '1',
    duration: 1500,
    label: 'pomo',
    completed: false,
    description: 'Warmup, emails',
    emoji: '☕',
    color: 'orange',
  },
  {
    id: '2',
    duration: 300,
    label: 'break',
    completed: false,
    description: 'Step away, water',
    emoji: '💧',
    color: 'teal',
  },
  {
    id: '3',
    duration: 1500,
    label: 'pomo',
    completed: false,
    description: 'Main work — UI/UX project',
    emoji: '🎨',
    color: 'orange',
  },
  {
    id: '4',
    duration: 300,
    label: 'break',
    completed: false,
    description: 'Stretching',
    emoji: '🧘',
    color: 'teal',
  },
  {
    id: '5',
    duration: 1500,
    label: 'pomo',
    completed: false,
    description: 'Implement views',
    emoji: '💻',
    color: 'orange',
  },
];

type SessionState = {
  blocks: FlowBlock[];
  blocksHydrated: boolean;
  resume: RestoredTimer | null;
  isFocusMode: boolean;
};

type SessionAction =
  | { type: 'HYDRATE_FROM_URL'; blocks: FlowBlock[] }
  | { type: 'HYDRATE_FROM_STORAGE'; blocks: FlowBlock[] }
  | { type: 'HYDRATION_COMPLETE' }
  | { type: 'SET_BLOCKS'; updater: SetStateAction<FlowBlock[]> }
  | { type: 'RESET_SESSION' }
  | { type: 'ENTER_FOCUS' }
  | { type: 'EXIT_FOCUS' }
  | { type: 'TOGGLE_FOCUS' }
  | { type: 'UPDATE_RESUME'; resume: RestoredTimer | null };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'HYDRATE_FROM_URL':
      return { ...state, blocks: action.blocks, blocksHydrated: true };
    case 'HYDRATE_FROM_STORAGE':
      return { ...state, blocks: action.blocks };
    case 'HYDRATION_COMPLETE':
      return { ...state, blocksHydrated: true };
    case 'SET_BLOCKS': {
      const nextBlocks =
        typeof action.updater === 'function' ? action.updater(state.blocks) : action.updater;
      return { ...state, blocks: nextBlocks };
    }
    case 'RESET_SESSION':
      return {
        ...state,
        blocks: state.blocks.map((b) => ({ ...b, completed: false, active: false })),
      };
    case 'ENTER_FOCUS':
      return { ...state, isFocusMode: true };
    case 'EXIT_FOCUS':
      return { ...state, isFocusMode: false };
    case 'TOGGLE_FOCUS':
      return { ...state, isFocusMode: !state.isFocusMode };
    case 'UPDATE_RESUME':
      return { ...state, resume: action.resume };
    default:
      return state;
  }
}

export function useSessionState() {
  const [state, dispatch] = useReducer(sessionReducer, {
    blocks: MOCK_BLOCKS,
    blocksHydrated: false,
    resume: null,
    isFocusMode: false,
  });

  useEffect(() => {
    const flowParam = new URLSearchParams(window.location.search).get('flow');
    if (flowParam) {
      try {
        const parsed = parseDSL(decodeFlowParam(flowParam));
        if (parsed.length > 0) {
          const normalized = normalizeBlocks(parsed);
          localStorage.setItem(STORAGE_KEYS.activeBlocks, JSON.stringify(normalized));
          dispatch({ type: 'HYDRATE_FROM_URL', blocks: normalized });
          return;
        }
      } catch (err) {
        console.error('Failed to decode flow parameter from URL', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEYS.activeBlocks);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'HYDRATE_FROM_STORAGE', blocks: normalizeBlocks(parsed) });
        } else {
          localStorage.removeItem(STORAGE_KEYS.activeBlocks);
          console.warn('Removed invalid data from localStorage');
        }
      } catch (err) {
        console.error('Failed to load saved blocks from localStorage', err);
      }
    }
    dispatch({ type: 'HYDRATION_COMPLETE' });
  }, []);

  useEffect(() => {
    if (!state.blocksHydrated) return;
    if (state.blocks.length > 0) {
      localStorage.setItem(STORAGE_KEYS.activeBlocks, JSON.stringify(state.blocks));
    }
  }, [state.blocks, state.blocksHydrated]);

  useEffect(() => {
    dispatch({
      type: 'UPDATE_RESUME',
      resume: restoreTimerProgress(
        state.blocks,
        localStorage.getItem(STORAGE_KEYS.timerProgress),
        Date.now()
      ),
    });
  }, [state.blocks, state.isFocusMode]);

  const setBlocks = useCallback((value: SetStateAction<FlowBlock[]>) => {
    dispatch({ type: 'SET_BLOCKS', updater: value });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET_SESSION' });
    localStorage.removeItem(STORAGE_KEYS.timerProgress);
  }, []);

  const toggleFocusMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_FOCUS' });
  }, []);

  const enterFocusMode = useCallback(() => {
    dispatch({ type: 'ENTER_FOCUS' });
  }, []);

  return {
    blocks: state.blocks,
    blocksHydrated: state.blocksHydrated,
    resume: state.resume,
    isFocusMode: state.isFocusMode,
    setBlocks: setBlocks as Dispatch<SetStateAction<FlowBlock[]>>,
    resetSession,
    toggleFocusMode,
    enterFocusMode,
  };
}
