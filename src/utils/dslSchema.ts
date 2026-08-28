// src/utils/dslSchema.ts
import { FlowBlock } from './dslParser';
import { inferDefaultColor, normalizeColor } from '../constants/blockOptions';

export function normalizeBlock(block: Record<string, unknown>): FlowBlock {
  const label = typeof block.label === 'string' ? block.label : 'block';
  const legacyType = block.type as string | undefined;
  const color = normalizeColor(
    typeof block.color === 'string' && block.color
      ? block.color
      : legacyType === 'rest'
        ? 'teal'
        : inferDefaultColor(label)
  );

  return {
    id: String(block.id ?? Math.random().toString(36).substring(2, 11)),
    duration: typeof block.duration === 'number' ? block.duration : 1500,
    label,
    color,
    completed: Boolean(block.completed),
    description: typeof block.description === 'string' ? block.description : undefined,
    emoji: typeof block.emoji === 'string' ? block.emoji : undefined,
    skippable: typeof block.skippable === 'boolean' ? block.skippable : undefined,
    retryable: typeof block.retryable === 'boolean' ? block.retryable : undefined,
    hold: typeof block.hold === 'boolean' ? block.hold : undefined,
    active: typeof block.active === 'boolean' ? block.active : undefined,
  };
}

export function normalizeBlocks(data: unknown[]): FlowBlock[] {
  return data.map(item => normalizeBlock(item as Record<string, unknown>));
}

export function validateBlocks(data: any): data is FlowBlock[] {
  if (!Array.isArray(data)) return false;
  for (const block of data) {
    if (typeof block !== 'object' || block === null) return false;
    if (typeof block.id !== 'string' && typeof block.id !== 'number') return false;
    if (typeof block.duration !== 'number' || block.duration <= 0) return false;
    if (typeof block.label !== 'string') return false;
    if (typeof block.color !== 'string' || block.color.trim() === '') return false;
    if (typeof block.completed !== 'boolean') return false;
    if (block.description !== undefined && typeof block.description !== 'string') return false;
    if (block.emoji !== undefined && typeof block.emoji !== 'string') return false;
    if (block.color !== undefined && typeof block.color !== 'string') return false;
    if (block.skippable !== undefined && typeof block.skippable !== 'boolean') return false;
    if (block.retryable !== undefined && typeof block.retryable !== 'boolean') return false;
    if (block.hold !== undefined && typeof block.hold !== 'boolean') return false;
  }
  return true;
}

export function stringifyBlocks(blocks: FlowBlock[]): string {
  return blocks.map(block => {
    let durStr = '';
    if (block.duration % 3600 === 0) {
      durStr = `${block.duration / 3600}h`;
    } else if (block.duration % 60 === 0) {
      durStr = `${block.duration / 60}m`;
    } else {
      durStr = `${block.duration}s`;
    }

    const attrs: string[] = [];
    if (block.color) attrs.push(`color:${block.color}`);
    if (block.emoji) attrs.push(`emoji:${block.emoji}`);
    if (block.skippable) attrs.push(`skippable`);
    if (block.retryable) attrs.push(`retry`);
    if (block.hold) attrs.push(`hold`);
    
    const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
    const descStr = block.description ? ` {${block.description}}` : '';

    return `${durStr} ${block.label}${descStr}${attrStr}`;
  }).join(' + ');
}
