import type { FrontmatterNode } from './types';

type FrontmatterNodeData = Omit<FrontmatterNode, 'range'>;

export interface ParsedFrontMatter {
  node: FrontmatterNodeData;
  endIndex: number;
}

interface ClosingDelimiter {
  delimiter: FrontmatterNode['endDelimiter'];
  startIndex: number;
  endIndex: number;
}

const delimiterLength = 3;

export function parseFrontMatter(text: string): ParsedFrontMatter | undefined {
  const start = text.startsWith('\uFEFF') ? 1 : 0;
  const startDelimiter = text.slice(start, start + delimiterLength);

  if (startDelimiter !== '---' && startDelimiter !== '+++') {
    return;
  }

  const firstLineBreakIndex = text.indexOf('\n', start + delimiterLength);
  if (firstLineBreakIndex === -1) {
    return;
  }

  const explicitLanguage = text.slice(start + delimiterLength, firstLineBreakIndex).trim();
  const language = explicitLanguage || (startDelimiter === '+++' ? 'toml' : 'yaml');
  const closingDelimiter = findClosingDelimiter(
    text,
    firstLineBreakIndex + 1,
    getAllowedEndDelimiters(startDelimiter, language),
  );

  if (!closingDelimiter) {
    return;
  }

  const raw = text.slice(0, closingDelimiter.endIndex);

  return {
    node: {
      type: 'FrontmatterNode',
      raw,
      value: text.slice(firstLineBreakIndex + 1, closingDelimiter.startIndex),
      language,
      explicitLanguage: explicitLanguage || null,
      startDelimiter,
      endDelimiter: closingDelimiter.delimiter,
    },
    endIndex: closingDelimiter.endIndex,
  };
}

function getAllowedEndDelimiters(
  startDelimiter: FrontmatterNode['startDelimiter'],
  language: string,
): Set<FrontmatterNode['endDelimiter']> {
  const delimiters = new Set<FrontmatterNode['endDelimiter']>([startDelimiter]);
  const normalizedLanguage = language.toLowerCase();

  if (startDelimiter === '---' && (normalizedLanguage === 'yaml' || normalizedLanguage === 'yml')) {
    delimiters.add('...');
  }

  return delimiters;
}

function findClosingDelimiter(
  text: string,
  startIndex: number,
  allowedDelimiters: Set<FrontmatterNode['endDelimiter']>,
): ClosingDelimiter | undefined {
  let lineStart = startIndex;

  while (lineStart <= text.length) {
    const nextLineBreak = text.indexOf('\n', lineStart);
    const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak;
    const line = text.slice(lineStart, lineEnd);
    const match = line.match(/^(---|\+\+\+|\.\.\.)[\t ]*\r?$/);
    const delimiter = match?.[1] as FrontmatterNode['endDelimiter'] | undefined;

    if (delimiter && allowedDelimiters.has(delimiter)) {
      return {
        delimiter,
        startIndex: lineStart,
        endIndex: lineEnd,
      };
    }

    if (nextLineBreak === -1) {
      return;
    }

    lineStart = nextLineBreak + 1;
  }

  return;
}
