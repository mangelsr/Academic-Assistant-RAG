import { Command } from 'commander';
import { runCrawler } from './crawler';
import { DEFAULT_CONFIG } from './config';
import { CrawlOptions } from './types';

const program = new Command();

program
  .name('academic-scraper')
  .description('Automated Playwright crawler to extract course syllabi and academic content for ESPOL degree programs')
  .version('1.0.0');

program
  .option('-c, --carrera <code>', 'ESPOL degree program code (e.g., CI013)', DEFAULT_CONFIG.carrera)
  .option('-o, --output <dir>', 'Directory to save downloaded syllabus PDFs', DEFAULT_CONFIG.outputDir)
  .option('--headful', 'Run browser in visible headful mode for debugging', false)
  .option('-d, --delay <ms>', 'Delay between clicking subjects in milliseconds', String(DEFAULT_CONFIG.delayMs))
  .option('-t, --timeout <ms>', 'Timeout for modal rendering and download events in ms', String(DEFAULT_CONFIG.timeoutMs))
  .option('--overwrite', 'Force re-downloading PDFs if they already exist', false);

program.parse(process.argv);

const options = program.opts();

const crawlOptions: CrawlOptions = {
  carrera: options.carrera,
  outputDir: options.output,
  headless: !options.headful,
  delayMs: parseInt(options.delay, 10),
  timeoutMs: parseInt(options.timeout, 10),
  overwrite: options.overwrite
};

runCrawler(crawlOptions)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Crawling failed:', err);
    process.exit(1);
  });
