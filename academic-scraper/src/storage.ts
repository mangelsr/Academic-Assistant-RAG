import * as fs from 'fs';
import * as path from 'path';
import { CrawlManifest } from './types';

/**
 * Sanitizes string for safe file system directory and file names.
 */
export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // replace non-alphanumeric chars with _
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_+|_+$/g, ''); // trim leading/trailing underscores
}

/**
 * Ensures a directory path exists.
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Builds standard output subject directory path:
 * downloads/<degreeName>/<subjectCode_subjectName>/
 */
export function buildSubjectFolderPath(baseOutputDir: string, degreeName: string, subjectCode: string, subjectName: string): string {
  const sanitizedDegree = sanitizeFilename(degreeName || 'PROGRAM');
  const sanitizedCode = sanitizeFilename(subjectCode || 'MATERIA');
  const sanitizedName = sanitizeFilename(subjectName || 'UNNAMED');
  
  const subjectDir = path.join(baseOutputDir, sanitizedDegree, `${sanitizedCode}_${sanitizedName}`);
  ensureDirectoryExists(subjectDir);
  return subjectDir;
}

/**
 * Checks if a file exists and is non-empty.
 */
export function isFileDownloaded(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return stats.size > 0;
  }
  return false;
}

/**
 * Saves execution manifest JSON file inside the degree output folder.
 */
export function saveManifest(baseOutputDir: string, degreeName: string, manifest: CrawlManifest): string {
  const sanitizedDegree = sanitizeFilename(degreeName || 'PROGRAM');
  const degreeDir = path.join(baseOutputDir, sanitizedDegree);
  ensureDirectoryExists(degreeDir);
  const manifestPath = path.join(degreeDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifestPath;
}
