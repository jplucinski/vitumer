import { FlowBlock } from '../utils/dslParser';

export type AITurnStatus = 'pending' | 'accepted' | 'rejected';

export interface AIRefinementSuggestion {
  label: string;
  text: string;
}

export interface AITurn {
  id: string;
  userMessage: string;
  reasoning: string;
  blocks: FlowBlock[];
  suggestions: AIRefinementSuggestion[];
  status: AITurnStatus;
  createdAt: number;
}

export interface AISessionThread {
  turns: AITurn[];
  startedAt: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
