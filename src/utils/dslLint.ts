import { BLOCK_COLORS } from '../constants/blockOptions';

export type DslTokenKind =
  | 'multiplier'
  | 'operator'
  | 'paren'
  | 'duration'
  | 'label'
  | 'description'
  | 'attrKey'
  | 'attrValue'
  | 'punct'
  | 'invalid';

export interface DslToken {
  kind: DslTokenKind;
  start: number;
  end: number;
}

export interface DslDiagnostic {
  message: string;
  start: number;
  end: number;
}

export interface DslAnalysis {
  tokens: DslToken[];
  diagnostics: DslDiagnostic[];
}

const FLAG_ATTRS = ['skippable', 'retry', 'retryable', 'hold'];
const KNOWN_ATTRS = ['color', 'emoji', ...FLAG_ATTRS];

const isDigit = (ch: string | undefined) => ch !== undefined && ch >= '0' && ch <= '9';
const isSpace = (ch: string | undefined) => ch !== undefined && /\s/.test(ch);

export function analyzeDSL(text: string): DslAnalysis {
  const tokens: DslToken[] = [];
  const diagnostics: DslDiagnostic[] = [];
  const len = text.length;
  let pos = 0;

  const push = (kind: DslTokenKind, start: number, end: number) => {
    if (end > start) tokens.push({ kind, start, end });
  };
  const report = (message: string, start: number, end = start + 1) => {
    diagnostics.push({ message, start, end: Math.max(end, start + 1) });
  };
  const skipSpace = () => {
    while (isSpace(text[pos])) pos++;
  };
  const atItemEnd = () => pos >= len || text[pos] === '+' || text[pos] === ')';
  const readDigits = () => {
    while (isDigit(text[pos])) pos++;
  };

  const consumeInvalid = () => {
    const start = pos;
    let depth = 0;
    while (pos < len) {
      const ch = text[pos];
      if (ch === '(') depth++;
      else if (ch === ')') {
        if (depth === 0) break;
        depth--;
      } else if (ch === '+' && depth === 0) break;
      pos++;
    }
    let end = pos;
    while (end > start && isSpace(text[end - 1])) end--;
    push('invalid', start, end);
    return { start, end };
  };

  const parseAttributes = (open: number, close: number) => {
    push('punct', open, open + 1);
    push('punct', close, close + 1);
    if (!text.slice(open + 1, close).trim()) {
      report('Empty attribute list "[]"', open, close + 1);
      return;
    }

    let segStart = open + 1;
    for (let i = open + 1; i <= close; i++) {
      if (i < close && text[i] !== ',') continue;
      if (i < close) push('punct', i, i + 1);

      let s = segStart;
      let e = i;
      while (s < e && isSpace(text[s])) s++;
      while (e > s && isSpace(text[e - 1])) e--;
      segStart = i + 1;
      if (s === e) {
        report('Empty attribute', Math.min(i, close - 1), i + 1);
        continue;
      }

      const raw = text.slice(s, e);
      const colon = raw.indexOf(':');
      const key = (colon === -1 ? raw : raw.slice(0, colon)).trim();
      const keyEnd = s + (colon === -1 ? raw.length : raw.slice(0, colon).trimEnd().length);

      if (!KNOWN_ATTRS.includes(key)) {
        push('invalid', s, e);
        report(`Unknown attribute "${key}" (use ${KNOWN_ATTRS.join(', ')})`, s, keyEnd);
        continue;
      }
      push('attrKey', s, keyEnd);

      if (colon === -1) {
        if (!FLAG_ATTRS.includes(key)) report(`Attribute "${key}" needs a value, e.g. ${key}:…`, s, e);
        continue;
      }

      push('punct', s + colon, s + colon + 1);
      let vs = s + colon + 1;
      while (vs < e && isSpace(text[vs])) vs++;
      const value = text.slice(vs, e);
      if (!value) {
        report(`Missing value for "${key}"`, s, e);
        continue;
      }

      const valid =
        key === 'emoji' ||
        (key === 'color' && (BLOCK_COLORS as readonly string[]).includes(value)) ||
        (FLAG_ATTRS.includes(key) && (value === 'true' || value === 'false'));
      push(valid ? 'attrValue' : 'invalid', vs, e);
      if (!valid) {
        report(
          key === 'color'
            ? `Unknown color "${value}" (use ${BLOCK_COLORS.join(', ')})`
            : `"${key}" expects true or false`,
          vs,
          e,
        );
      }
    }
  };

  const parseBlock = () => {
    const start = pos;
    readDigits();
    const unit = text[pos];
    if (unit !== 'h' && unit !== 'm' && unit !== 's') {
      const { end } = consumeInvalid();
      report('Invalid duration unit — use h, m or s (e.g. 25m)', start, end);
      return;
    }
    pos++;
    if (!atItemEnd() && !isSpace(text[pos])) {
      const unitTypo = /[a-z]/i.test(text[pos]);
      while (!atItemEnd() && !isSpace(text[pos]) && !(unitTypo && '{['.includes(text[pos]))) pos++;
      push('invalid', start, pos);
      report(
        unitTypo
          ? `Invalid duration "${text.slice(start, pos)}" — use h, m or s (e.g. 25m)`
          : 'Duration must be followed by a space (e.g. "25m work")',
        start,
        pos,
      );
    } else {
      push('duration', start, pos);
      if (parseInt(text.slice(start, pos - 1), 10) === 0) report('Duration must be greater than 0', start, pos);
    }

    let hasDescription = false;
    let hasAttributes = false;

    while (true) {
      skipSpace();
      if (atItemEnd()) return;
      const ch = text[pos];

      if (ch === '{' || ch === '[') {
        const closeChar = ch === '{' ? '}' : ']';
        const open = pos;
        let close = open + 1;
        while (close < len && text[close] !== closeChar && text[close] !== '+' && text[close] !== ')') close++;
        if (text[close] !== closeChar) {
          pos = open;
          const { end } = consumeInvalid();
          report(
            close < len
              ? `"${text[close]}" is not allowed inside ${ch}…${closeChar}`
              : `Missing closing "${closeChar}"`,
            open,
            end,
          );
          return;
        }

        if (ch === '{') {
          push('punct', open, open + 1);
          push('description', open + 1, close);
          push('punct', close, close + 1);
          if (hasDescription) report('Only one {description} per block', open, close + 1);
          else if (!text.slice(open + 1, close).trim()) report('Empty description "{}"', open, close + 1);
          hasDescription = true;
        } else {
          if (hasAttributes) {
            push('invalid', open, close + 1);
            report('Only one [attributes] list per block — merge them with commas', open, close + 1);
          } else {
            parseAttributes(open, close);
          }
          hasAttributes = true;
        }
        pos = close + 1;
        continue;
      }

      if (ch === '}' || ch === ']' || ch === '(') {
        push('invalid', pos, pos + 1);
        report(
          ch === '(' ? 'Unexpected "(" — loops look like 3 * (...)' : `Unexpected "${ch}"`,
          pos,
        );
        pos++;
        continue;
      }

      const wordStart = pos;
      while (!atItemEnd() && !isSpace(text[pos]) && !'{}[]('.includes(text[pos])) pos++;
      push('label', wordStart, pos);
    }
  };

  const parseItem = (depth: number) => {
    skipSpace();
    if (atItemEnd()) {
      report('Expected a block, e.g. 25m work', Math.min(pos, len - 1));
      return;
    }

    const start = pos;
    if (isDigit(text[pos])) {
      readDigits();
      const numberEnd = pos;
      skipSpace();
      if (text[pos] === '*') {
        push('multiplier', start, numberEnd);
        push('operator', pos, pos + 1);
        if (parseInt(text.slice(start, numberEnd), 10) < 1) report('Multiplier must be at least 1', start, numberEnd);
        pos++;
        skipSpace();
        if (text[pos] !== '(') {
          parseItem(depth);
          return;
        }

        const open = pos;
        push('paren', open, open + 1);
        pos++;
        parseSequence(depth + 1);
        if (text[pos] === ')') {
          push('paren', pos, pos + 1);
          pos++;
        } else {
          report('Missing closing ")"', open);
          return;
        }
        skipSpace();
        if (!atItemEnd()) {
          const { start: s, end } = consumeInvalid();
          report('Unexpected text after loop — put attributes on blocks inside the loop', s, end);
        }
        return;
      }
      pos = start;
      parseBlock();
      return;
    }

    const { end } = consumeInvalid();
    report(
      text[start] === '('
        ? 'Groups need a multiplier, e.g. 3 * (25m work + 5m rest)'
        : 'Block must start with a duration, e.g. 25m work',
      start,
      end,
    );
  };

  const parseSequence = (depth: number) => {
    parseItem(depth);
    while (pos < len) {
      skipSpace();
      if (pos >= len) return;
      if (text[pos] === '+') {
        push('operator', pos, pos + 1);
        pos++;
        parseItem(depth);
        continue;
      }
      if (text[pos] === ')') {
        if (depth > 0) return;
        push('invalid', pos, pos + 1);
        report('Unmatched ")"', pos);
        pos++;
        continue;
      }
      return;
    }
  };

  if (text.trim()) parseSequence(0);

  for (const d of diagnostics) {
    d.start = Math.max(0, Math.min(d.start, len - 1));
    d.end = Math.max(d.start + 1, Math.min(d.end, len));
  }
  tokens.sort((a, b) => a.start - b.start);
  return { tokens, diagnostics };
}

export function getLineColumn(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, offset).split('\n');
  return { line: before.length, column: before[before.length - 1].length + 1 };
}
