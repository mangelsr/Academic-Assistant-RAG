import { CrawlOptions } from './types';

export const DEFAULT_CONFIG: CrawlOptions = {
  carrera: 'CI013',
  outputDir: './downloads',
  headless: true,
  delayMs: 800,
  overwrite: false,
  timeoutMs: 15000
};
