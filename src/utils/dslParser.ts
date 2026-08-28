// src/utils/dslParser.ts
import { inferDefaultColor, normalizeColor } from '../constants/blockOptions';

export interface FlowBlock {
  id: string;
  duration: number;
  label: string;
  color: string;
  completed: boolean;
  description?: string;
  emoji?: string;
  skippable?: boolean;
  retryable?: boolean;
  hold?: boolean;
  active?: boolean;
}

function splitByPlus(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;

    if (char === '+' && parenDepth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map(p => p.trim()).filter(Boolean);
}

export function parseDSL(dslText: string): FlowBlock[] {
  const cleaned = dslText.trim();
  if (!cleaned) return [];

  const parts = splitByPlus(cleaned);
  const blocks: FlowBlock[] = [];

  for (const part of parts) {
    // 1. Check for multiplier with group: 3 * (25m pomo + 5m break)
    const multiplierMatch = part.match(/^(\d+)\s*\*\s*\((.*)\)$/);
    if (multiplierMatch) {
      const multiplier = parseInt(multiplierMatch[1], 10);
      const innerDSL = multiplierMatch[2];
      const parsedInner = parseDSL(innerDSL);
      
      for (let i = 0; i < multiplier; i++) {
        blocks.push(...parsedInner.map(b => ({
          ...b,
          id: Math.random().toString(36).substring(2, 11)
        })));
      }
      continue;
    }

    // 2. Check for simple multiplier without parenthesis: 3 * 25m pomo
    const simpleMultiplierMatch = part.match(/^(\d+)\s*\*\s*([^(].*)$/);
    if (simpleMultiplierMatch) {
      const multiplier = parseInt(simpleMultiplierMatch[1], 10);
      const innerBlockDSL = simpleMultiplierMatch[2].trim();
      const parsedInner = parseDSL(innerBlockDSL);
      
      for (let i = 0; i < multiplier; i++) {
        blocks.push(...parsedInner.map(b => ({
          ...b,
          id: Math.random().toString(36).substring(2, 11)
        })));
      }
      continue;
    }

    // 3. Parse single block: 25m praca {Kodowanie widoku} [color:orange, emoji:💻]
    const durationMatch = part.match(/^(\d+)([hms])(?:\s+(.*)|$)/);
    if (!durationMatch) {
      // If the part doesn't match standard block structure, we skip or handle as a fallback
      continue;
    }

    const value = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    let remainder = durationMatch[3] ? durationMatch[3].trim() : '';

    let duration = 0;
    if (unit === 'h') duration = value * 3600;
    else if (unit === 'm') duration = value * 60;
    else if (unit === 's') duration = value;

    // Extract description {...}
    let description: string | undefined;
    const descMatch = remainder.match(/\{([^}]+)\}/);
    if (descMatch) {
      description = descMatch[1].trim();
      remainder = remainder.replace(/\{[^}]+\}/, '').trim();
    }

    // Extract attributes [...]
    let color: string | undefined;
    let emoji: string | undefined;
    let skippable: boolean | undefined;
    let retryable: boolean | undefined;
    let hold: boolean | undefined;

    const attrMatch = remainder.match(/\[([^\]]+)\]/);
    if (attrMatch) {
      const attrContent = attrMatch[1];
      remainder = remainder.replace(/\[[^\]]+\]/, '').trim();
      
      const attrs = attrContent.split(',').map(a => a.trim());
      for (const attr of attrs) {
        if (attr.includes(':')) {
          const [key, val] = attr.split(':').map(x => x.trim());
          if (key === 'color') color = val;
          else if (key === 'emoji') emoji = val;
          else if (key === 'skippable') skippable = val === 'true';
          else if (key === 'retry' || key === 'retryable') retryable = val === 'true';
          else if (key === 'hold') hold = val === 'true';
        } else {
          if (attr === 'skippable') skippable = true;
          else if (attr === 'retry' || attr === 'retryable') retryable = true;
          else if (attr === 'hold') hold = true;
        }
      }
    }

    const label = remainder || 'custom';
    const resolvedColor = normalizeColor(color ?? inferDefaultColor(label));

    blocks.push({
      id: Math.random().toString(36).substring(2, 11),
      duration,
      label,
      color: resolvedColor,
      completed: false,
      description,
      emoji,
      skippable,
      retryable,
      hold
    });
  }

  return blocks;
}
