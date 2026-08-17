import type { SupportLanguage } from 'prettier';
import { locEnd, locStart, parse } from './parser';
import { printer } from './printer';
import type { Node } from './types';

export const languages: SupportLanguage[] = [
  {
    name: 'Nunjucks',
    parsers: ['nunjucks'],
    extensions: ['.njk', '.nunjucks', '.nunj'],
    aliases: ['nunjucks', 'njk', 'nunj'],
    vscodeLanguageIds: ['nunjucks'],
  },
];

export const parsers = {
  nunjucks: {
    parse,
    astFormat: 'nunjucks-ast',
    locStart,
    locEnd,
  },
};

export const printers = {
  'nunjucks-ast': printer,
};

export const options = {
  blockTags: {
    since: '0.1.2',
    category: 'Nunjucks',
    type: 'string',
    array: true,
    default: [{ value: [] }],
    description: 'Additional Nunjucks statement tags that should be parsed as block tags.',
  },
  inlineTags: {
    since: '0.1.2',
    category: 'Nunjucks',
    type: 'string',
    array: true,
    default: [{ value: [] }],
    description: 'Nunjucks statement tags that should stay inline even when known as block tags.',
  },
  forkTags: {
    since: '0.1.2',
    category: 'Nunjucks',
    type: 'string',
    array: true,
    default: [{ value: [] }],
    description: 'Additional Nunjucks statement tags that should be parsed as branch/fork tags inside custom blocks.',
  },
  classAttributeLayout: {
    since: '0.2.0',
    category: 'HTML',
    type: 'choice',
    default: 'auto',
    description: 'Control whether class attribute values may use multiple lines.',
    choices: [
      {
        value: 'auto',
        description: 'Wrap long and conditional class attributes using the default formatting rules.',
      },
      {
        value: 'single-line',
        description: 'Keep class attribute values on a single physical line.',
      },
    ],
  },
};
export const defaultOptions = {};

export type { Node };
