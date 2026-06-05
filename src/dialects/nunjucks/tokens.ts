import { isTemplateExpressionQuoteStart } from 'template-format-core';
import type { TemplateBlockPrefix, TemplateDialect, TemplateToken } from 'template-format-core';

export type NunjucksBranchKeyword = 'else' | 'elif' | 'elseif';

export type NunjucksTemplateToken = TemplateToken & {
  branchKeyword?: NunjucksBranchKeyword;
};

const blockStarters = new Set([
  'if',
  'for',
  'asyncEach',
  'asyncAll',
  'block',
  'macro',
  'set',
  'filter',
  'call',
]);

const rawBlockNames = new Set(['raw', 'verbatim']);

const endBlockAliases = new Map<string, string>([
  ['endeach', 'asyncEach'],
  ['endall', 'asyncAll'],
]);

export const nunjucksDialect: TemplateDialect = {
  name: 'nunjucks',
  openDelimiter: '{{',
  closeDelimiter: '}}',
  parseToken: parseNunjucksToken,
  findNextOpen: findNextNunjucksOpen,
  isEscapedOpen: isEscapedNunjucksOpen,
  isDynamicElementStart: isDynamicNunjucksElementStart,
  consumeRawBlock: consumeNunjucksRawBlock,
  getBlockExpression: getNunjucksBlockExpression,
  getBlockPrefix: getNunjucksBlockPrefix,
  getTagDelimiters: getNunjucksTagDelimiters,
  getPrintedBlockPrefix: getPrintedNunjucksBlockPrefix,
  getPartialPrefix: getNunjucksPartialPrefix,
  getDecoratorPrefix: getNunjucksDecoratorPrefix,
  getElseKeyword: getNunjucksElseKeyword,
  getBlockClosePrefix: getNunjucksBlockClosePrefix,
  getLineCommentTag: getNunjucksLineCommentTag,
  getBlockCommentTag: getNunjucksBlockCommentTag,
  getBlockCommentMarkers: getNunjucksBlockCommentMarkers,
  shouldPreserveTokenVerbatim: shouldPreserveNunjucksTokenVerbatim,
  shouldPreserveUnclosedBlockRemainder: shouldPreserveUnclosedNunjucksBlockRemainder,
};

function parseNunjucksToken(text: string, position: number): NunjucksTemplateToken {
  if (text.startsWith('{{', position)) {
    return parseDelimitedNunjucksToken(text, position, '{{', '}}', 'variable');
  }

  if (text.startsWith('{#', position)) {
    return parseDelimitedNunjucksToken(text, position, '{#', '#}', 'comment');
  }

  if (text.startsWith('{%', position)) {
    return parseDelimitedNunjucksToken(text, position, '{%', '%}', 'statement');
  }

  return {
    kind: 'mustache',
    content: text[position] ?? '',
    rawContent: text[position] ?? '',
    rawInner: text[position] ?? '',
    start: position,
    end: Math.min(position + 1, text.length),
    triple: false,
    trimOpen: false,
    trimClose: false,
  };
}

function parseDelimitedNunjucksToken(
  text: string,
  position: number,
  open: '{{' | '{%' | '{#',
  close: '}}' | '%}' | '#}',
  tagKind: 'variable' | 'statement' | 'comment',
): NunjucksTemplateToken {
  const contentStart = position + open.length;
  const closeIdx = findNunjucksClose(text, contentStart, close);
  const end = closeIdx >= 0 ? closeIdx + close.length : text.length;
  const rawContent = text.slice(contentStart, closeIdx >= 0 ? closeIdx : undefined);
  const rawInner = rawContent.trim();
  const trimOpen = rawInner.startsWith('-');
  const trimClose = rawInner.endsWith('-');
  const inner = rawInner.replace(/^-/, '').replace(/-$/, '').trim();
  const baseToken = {
    rawContent,
    rawInner,
    start: position,
    end,
    // Internal marker: statement tags print with {% %}; variables print with {{ }}.
    triple: tagKind === 'statement',
    trimOpen,
    trimClose,
  };

  if (tagKind === 'comment') {
    return { kind: 'comment', content: inner, name: undefined, ...baseToken };
  }

  if (tagKind === 'variable') {
    return { kind: 'mustache', content: inner, name: undefined, ...baseToken };
  }

  const statementName = readStatementName(inner);

  if (statementName === 'else') {
    return { kind: 'else', content: 'else', name: 'else', branchKeyword: 'else', ...baseToken };
  }

  if (statementName === 'elif' || statementName === 'elseif') {
    return {
      kind: 'else',
      content: inner,
      name: statementName,
      specialForm: 'elseIf',
      branchKeyword: statementName,
      ...baseToken,
    };
  }

  const endName = readEndBlockName(statementName);
  if (endName) {
    return { kind: 'blockEnd', content: inner, name: endName, ...baseToken };
  }

  if (blockStarters.has(statementName)) {
    return { kind: 'blockStart', content: inner, name: statementName, ...baseToken };
  }

  return { kind: 'mustache', content: inner, name: statementName || undefined, ...baseToken };
}

function findNunjucksClose(text: string, position: number, closeDelimiter: string): number {
  let quote: '"' | "'" | '`' | null = null;
  let escaped = false;

  for (let index = position; index < text.length; index += 1) {
    const char = text[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if ((char === '"' || char === "'" || char === '`') && isTemplateExpressionQuoteStart(text, index, position)) {
      quote = char;
      continue;
    }

    if (text.startsWith(closeDelimiter, index)) {
      return index;
    }
  }

  return -1;
}

function readStatementName(inner: string): string {
  return inner.trim().split(/\s+/)[0] ?? '';
}

function readEndBlockName(statementName: string): string | null {
  if (endBlockAliases.has(statementName)) {
    return endBlockAliases.get(statementName) ?? null;
  }

  if (!statementName.startsWith('end') || statementName.length <= 3) {
    return null;
  }

  return statementName.slice(3);
}

function isEscapedNunjucksOpen(text: string, position: number): boolean {
  if (!text.startsWith('{{', position) && !text.startsWith('{%', position) && !text.startsWith('{#', position)) {
    return false;
  }

  let slashCount = 0;
  for (let index = position - 1; index >= 0 && text[index] === '\\'; index -= 1) {
    slashCount += 1;
  }

  return slashCount % 2 === 1;
}

function findNextNunjucksOpen(text: string, position: number): number {
  let searchPos = position;

  while (searchPos < text.length) {
    const candidates = ['{{', '{%', '{#']
      .map((open) => text.indexOf(open, searchPos))
      .filter((index) => index !== -1)
      .sort((left, right) => left - right);

    if (candidates.length === 0) {
      return -1;
    }

    const candidate = candidates[0];
    if (!isEscapedNunjucksOpen(text, candidate)) {
      return candidate;
    }

    searchPos = candidate + 2;
  }

  return -1;
}

function isDynamicNunjucksElementStart(text: string, position: number): boolean {
  return text.startsWith('<{{', position) || text.startsWith('</{{', position);
}

function consumeNunjucksRawBlock(text: string, position: number): number | null {
  if (!text.startsWith('{%', position)) {
    return null;
  }

  const token = parseNunjucksToken(text, position);
  const name = readStatementName(token.content);

  if (!rawBlockNames.has(name)) {
    return null;
  }

  const closePattern = new RegExp('\\{%\\s*-?\\s*end' + name + '\\s*-?\\s*%\\}');
  const closeMatch = closePattern.exec(text.slice(token.end));

  if (!closeMatch) {
    return text.length;
  }

  return token.end + closeMatch.index + closeMatch[0].length;
}

function getNunjucksBlockExpression(token: TemplateToken): string {
  return token.content.trim();
}

function getNunjucksBlockPrefix(_token: TemplateToken): TemplateBlockPrefix {
  return '#';
}

function getNunjucksTagDelimiters(statement: boolean) {
  return statement ? { open: '{%', close: '%}' } : { open: '{{', close: '}}' };
}

function getPrintedNunjucksBlockPrefix(_prefix: TemplateBlockPrefix): string {
  return '';
}

function getNunjucksPartialPrefix(): string {
  return '';
}

function getNunjucksDecoratorPrefix(): string {
  return '';
}

function getNunjucksElseKeyword(): string {
  return 'else';
}

function getNunjucksBlockClosePrefix(path: string): string {
  if (path === 'asyncEach') {
    return 'endeach';
  }

  if (path === 'asyncAll') {
    return 'endall';
  }

  return 'end' + path;
}

function getNunjucksLineCommentTag(value: string): string {
  return '{# ' + value + ' #}';
}

function getNunjucksBlockCommentTag(value: string): string {
  return '{# ' + value + ' #}';
}

function getNunjucksBlockCommentMarkers() {
  return {
    blockOpen: '{#',
    blockClose: '#}',
    inlineOpen: '{# ',
    inlineClose: ' #}',
    emptyBlock: '{##}',
    emptyInline: '{#  #}',
  };
}

function shouldPreserveNunjucksTokenVerbatim(_token: TemplateToken): boolean {
  return false;
}

function shouldPreserveUnclosedNunjucksBlockRemainder(token: TemplateToken): boolean {
  return rawBlockNames.has(readStatementName(token.content));
}
