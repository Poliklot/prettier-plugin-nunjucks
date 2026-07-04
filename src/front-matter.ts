export interface FrontMatter {
  type: 'FrontmatterNode';
  raw: string;
  value: string;
  language: string;
  explicitLanguage: string | null;
  startDelimiter: '---' | '+++';
  endDelimiter: '---' | '+++' | '...';
  end: {
    index: number;
  };
}

export interface ParsedFrontMatter {
  frontMatter?: FrontMatter;
  content: string;
}

const delimiterLength = 3;

export function parseFrontMatter(text: string): ParsedFrontMatter {
  const frontMatter = getFrontMatter(text);

  if (!frontMatter) {
    return { content: text };
  }

  return {
    frontMatter,
    content: text,
  };
}

function getFrontMatter(text: string): FrontMatter | undefined {
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
  let endDelimiterIndex = text.indexOf(`\n${startDelimiter}`, firstLineBreakIndex);

  let language = explicitLanguage;
  if (!language) {
    language = startDelimiter === '+++' ? 'toml' : 'yaml';
  }

  if (endDelimiterIndex === -1 && startDelimiter === '---' && language === 'yaml') {
    endDelimiterIndex = text.indexOf('\n...', firstLineBreakIndex);
  }

  if (endDelimiterIndex === -1) {
    return;
  }

  const frontMatterEndIndex = endDelimiterIndex + 1 + delimiterLength;
  const nextCharacter = text.charAt(frontMatterEndIndex + 1);
  if (!/\s?/.test(nextCharacter)) {
    return;
  }

  const raw = text.slice(0, frontMatterEndIndex);

  return {
    type: 'FrontmatterNode',
    raw,
    value: text.slice(firstLineBreakIndex + 1, endDelimiterIndex),
    language,
    explicitLanguage: explicitLanguage || null,
    startDelimiter,
    endDelimiter: raw.endsWith('...') ? '...' : (startDelimiter as '---' | '+++'),
    end: {
      index: raw.length,
    },
  };
}
