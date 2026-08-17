import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  sanitizeFilename,
  ensureDirectoryExists,
  buildSubjectFolderPath,
  isFileDownloaded,
  saveManifest
} from '../src/storage';
import { CrawlManifest } from '../src/types';

describe('Storage Module Unit Tests', () => {
  describe('sanitizeFilename()', () => {
    test('removes Spanish diacritics and accents', () => {
      assert.equal(sanitizeFilename('ÁLGEBRA LÍNEAL Y COMPUTEICÓN'), 'ALGEBRA_LINEAL_Y_COMPUTEICON');
    });

    test('replaces illegal filesystem characters with underscores', () => {
      assert.equal(sanitizeFilename('MAT101: Intro/Basics? *v1*'), 'MAT101_Intro_Basics_v1');
    });

    test('collapses multiple consecutive underscores', () => {
      assert.equal(sanitizeFilename('Subject___Name___Test'), 'Subject_Name_Test');
    });

    test('trims leading and trailing underscores', () => {
      assert.equal(sanitizeFilename('___test_name___'), 'test_name');
    });

    test('handles empty or special input strings', () => {
      assert.equal(sanitizeFilename(''), '');
      assert.equal(sanitizeFilename('ñáéíóúÑÁÉÍÓÚ'), 'naeiouNAEIOU');
    });
  });

  describe('ensureDirectoryExists()', () => {
    test('creates nested directory when it does not exist', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syllabus-test-'));
      const targetDir = path.join(tempDir, 'nested', 'deep', 'folder');

      assert.equal(fs.existsSync(targetDir), false);
      ensureDirectoryExists(targetDir);
      assert.equal(fs.existsSync(targetDir), true);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('does not throw if directory already exists', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syllabus-test-'));

      assert.doesNotThrow(() => {
        ensureDirectoryExists(tempDir);
      });

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('buildSubjectFolderPath()', () => {
    test('builds correctly sanitized and structured path', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syllabus-test-'));
      const resultPath = buildSubjectFolderPath(
        tempDir,
        'CIENCIAS DE LA COMPUTACIÓN',
        'CCPG1043',
        'FUNDAMENTOS DE PROGRAMACIÓN'
      );

      const expectedSubPath = path.join(
        tempDir,
        'CIENCIAS_DE_LA_COMPUTACION',
        'CCPG1043_FUNDAMENTOS_DE_PROGRAMACION'
      );

      assert.equal(resultPath, expectedSubPath);
      assert.equal(fs.existsSync(resultPath), true);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('uses fallback defaults when parameters are missing or empty', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syllabus-test-'));
      const resultPath = buildSubjectFolderPath(tempDir, '', '', '');

      const expectedSubPath = path.join(tempDir, 'PROGRAM', 'MATERIA_UNNAMED');
      assert.equal(resultPath, expectedSubPath);
      assert.equal(fs.existsSync(resultPath), true);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('isFileDownloaded()', () => {
    test('returns false for non-existent file', () => {
      assert.equal(isFileDownloaded('/non/existent/file.pdf'), false);
    });

    test('returns false for 0-byte empty file', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syllabus-test-'));
      const emptyFilePath = path.join(tempDir, 'empty.pdf');
      fs.writeFileSync(emptyFilePath, '');

      assert.equal(isFileDownloaded(emptyFilePath), false);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('returns true for existing non-empty file', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syllabus-test-'));
      const validFilePath = path.join(tempDir, 'syllabus.pdf');
      fs.writeFileSync(validFilePath, '%PDF-1.4 Mock Content');

      assert.equal(isFileDownloaded(validFilePath), true);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('saveManifest()', () => {
    test('saves valid JSON manifest file in degree folder', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syllabus-test-'));
      const mockManifest: CrawlManifest = {
        timestamp: new Date().toISOString(),
        programCode: 'CI013',
        degreeName: 'CIENCIAS DE LA COMPUTACIÓN',
        totalSubjects: 1,
        downloadedSyllabi: 1,
        downloadedContenidos: 1,
        skipped: 0,
        failed: 0,
        details: [
          {
            code: 'CCPG1043',
            name: 'FUNDAMENTOS DE PROGRAMACION',
            status: 'SUCCESS',
            folderPath: path.join(tempDir, 'CIENCIAS_DE_LA_COMPUTACION', 'CCPG1043_FUNDAMENTOS_DE_PROGRAMACION'),
            syllabusPath: 'syllabus.pdf',
            contenidoPath: 'contenidocurso.pdf'
          }
        ]
      };

      const manifestPath = saveManifest(tempDir, 'CIENCIAS DE LA COMPUTACIÓN', mockManifest);

      assert.equal(fs.existsSync(manifestPath), true);
      assert.equal(path.basename(manifestPath), 'manifest.json');

      const fileContent = fs.readFileSync(manifestPath, 'utf-8');
      const parsedManifest = JSON.parse(fileContent) as CrawlManifest;

      assert.equal(parsedManifest.programCode, 'CI013');
      assert.equal(parsedManifest.details.length, 1);
      assert.equal(parsedManifest.details[0].code, 'CCPG1043');

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});
