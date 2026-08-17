import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/config';

describe('Config Module Unit Tests', () => {
  test('DEFAULT_CONFIG contains expected default configuration parameters', () => {
    assert.equal(DEFAULT_CONFIG.carrera, 'CI013');
    assert.equal(DEFAULT_CONFIG.outputDir, './downloads');
    assert.equal(DEFAULT_CONFIG.headless, true);
    assert.equal(DEFAULT_CONFIG.delayMs, 800);
    assert.equal(DEFAULT_CONFIG.timeoutMs, 15000);
    assert.equal(DEFAULT_CONFIG.overwrite, false);
  });
});
