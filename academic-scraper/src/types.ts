export interface CrawlOptions {
  carrera: string;
  outputDir: string;
  headless: boolean;
  delayMs: number;
  overwrite: boolean;
  timeoutMs: number;
}

export type SubjectStatus = 'SUCCESS' | 'PARTIAL' | 'NO_FILES' | 'DOWNLOAD_ERROR' | 'SKIPPED';

export interface SubjectRecord {
  code: string;
  name: string;
  status: SubjectStatus;
  folderPath?: string;
  syllabusPath?: string;
  contenidoPath?: string;
  syllabusUrl?: string;
  contenidoUrl?: string;
  error?: string;
}

export interface CrawlManifest {
  timestamp: string;
  programCode: string;
  degreeName: string;
  totalSubjects: number;
  downloadedSyllabi: number;
  downloadedContenidos: number;
  skipped: number;
  failed: number;
  details: SubjectRecord[];
}
