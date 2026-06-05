import type { SupportLanguage } from 'prettier';
import { locEnd, locStart, parse } from './parser';
import { printer } from './printer';
import type { Node } from './types';

export const languages: SupportLanguage[] = [
  {
    name: 'Nunjucks',
    parsers: ['nunjucks'],
    extensions: ['.njk', '.nunjucks'],
    aliases: ['nunjucks', 'njk'],
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

export const options = {};
export const defaultOptions = {};

export type { Node };
