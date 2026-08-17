import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { Page, Locator } from 'playwright';
import { getDegreeProgramName, extractModalContent } from '../src/extractor';

describe('Extractor Module Unit Tests', () => {
  describe('getDegreeProgramName()', () => {
    test('returns degree name from heading locator when visible', async () => {
      const mockPage = {
        locator: (selector: string) => {
          if (selector === 'h1.text-center') {
            return {
              first: () => ({
                count: async () => 1,
                isVisible: async () => true,
                innerText: async () => 'CIENCIAS DE LA COMPUTACIÓN'
              })
            };
          }
          return {
            first: () => ({
              count: async () => 0,
              isVisible: async () => false,
              innerText: async () => ''
            })
          };
        },
        title: async () => 'Malla Curricular'
      } as unknown as Page;

      const degreeName = await getDegreeProgramName(mockPage, 'CI013');
      assert.equal(degreeName, 'CI013_CIENCIAS DE LA COMPUTACIÓN');
    });

    test('falls back to page title if heading locator is not present', async () => {
      const mockPage = {
        locator: () => ({
          first: () => ({
            count: async () => 0,
            isVisible: async () => false,
            innerText: async () => ''
          })
        }),
        title: async () => 'ESPOL | INGENIERIA MECANICA'
      } as unknown as Page;

      const degreeName = await getDegreeProgramName(mockPage, 'MEC01');
      assert.equal(degreeName, 'MEC01_INGENIERIA MECANICA');
    });

    test('returns fallback code when no heading or title is available', async () => {
      const mockPage = {
        locator: () => ({
          first: () => ({
            count: async () => 0,
            isVisible: async () => false,
            innerText: async () => ''
          })
        }),
        title: async () => 'Malla Curricular'
      } as unknown as Page;

      const degreeName = await getDegreeProgramName(mockPage, 'CI013');
      assert.equal(degreeName, 'CI013');
    });
  });

  describe('extractModalContent()', () => {
    test('extracts subject code, name, and syllabus/content URLs', async () => {
      const mockModal = {
        waitFor: async () => {},
        locator: (selector: string) => {
          if (selector.includes('Código:')) {
            return {
              first: () => ({
                count: async () => 1,
                locator: () => ({
                  count: async () => 1,
                  innerText: async () => 'CCPG1043'
                })
              })
            };
          }
          if (selector.includes('Materia:')) {
            return {
              first: () => ({
                count: async () => 1,
                locator: () => ({
                  count: async () => 1,
                  innerText: async () => 'FUNDAMENTOS DE PROGRAMACION'
                })
              })
            };
          }
          if (selector.includes('ReporteSyllabus')) {
            return {
              first: () => ({
                count: async () => 1,
                getAttribute: async (attr: string) => attr === 'href' ? 'https://academico.espol.edu.ec/ReporteSyllabus?id=123' : null
              })
            };
          }
          if (selector.includes('Contenidocurso')) {
            return {
              first: () => ({
                count: async () => 1,
                getAttribute: async (attr: string) => attr === 'href' ? 'https://academico.espol.edu.ec/Contenidocurso?id=456' : null
              })
            };
          }
          return {
            first: () => ({
              count: async () => 0,
              getAttribute: async () => null
            })
          };
        },
        innerText: async () => 'CCPG1043 - FUNDAMENTOS DE PROGRAMACION'
      };

      const mockPage = {
        locator: () => ({
          first: () => mockModal
        }),
        url: () => 'https://mallacurricular.espol.edu.ec/Malla/Imagen?codCarrera=CI013'
      } as unknown as Page;

      const modalData = await extractModalContent(mockPage, 1000);

      assert.equal(modalData.code, 'CCPG1043');
      assert.equal(modalData.name, 'FUNDAMENTOS DE PROGRAMACION');
      assert.equal(modalData.hasSyllabusLink, true);
      assert.equal(modalData.syllabusUrl, 'https://academico.espol.edu.ec/ReporteSyllabus?id=123');
      assert.equal(modalData.hasContenidoLink, true);
      assert.equal(modalData.contenidoUrl, 'https://academico.espol.edu.ec/Contenidocurso?id=456');
    });
  });
});
