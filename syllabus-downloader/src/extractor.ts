import { Page, Locator } from 'playwright';

export interface ExtractedModalData {
  code: string;
  name: string;
  syllabusUrl?: string;
  hasSyllabusLink: boolean;
  contenidoUrl?: string;
  hasContenidoLink: boolean;
}

/**
 * Extracts degree program name from the page DOM or heading.
 */
export async function getDegreeProgramName(page: Page, fallbackCode: string): Promise<string> {
  try {
    const headingSelectors = [
      'h1.text-center',
      'h1',
      '.body-content h1',
      '#lblCarrera',
      '#lblNombreCarrera',
      '.titulo-carrera',
      '.carrera-title',
      'h2',
      'h3',
      '.page-header'
    ];

    for (const selector of headingSelectors) {
      const el = page.locator(selector).first();
      if (await el.count() > 0 && await el.isVisible()) {
        const text = (await el.innerText()).trim();
        if (text && text.length > 2 && !text.toLowerCase().includes('malla curricular')) {
          return `${fallbackCode}_${text}`;
        }
      }
    }

    const title = await page.title();
    if (title && !title.toLowerCase().includes('malla curricular')) {
      const cleanTitle = title.replace(/ESPOL\s*\|\s*/i, '').trim();
      if (cleanTitle) {
        return `${fallbackCode}_${cleanTitle}`;
      }
    }
  } catch (err) {
    // Ignore and fallback to code
  }
  return fallbackCode;
}

/**
 * Finds all subject click targets on the Malla Curricular page grid.
 */
export async function getGridSubjectLocators(page: Page): Promise<Locator[]> {
  const gridTiles = page.locator('.casilla, div[data-pos], a.materia-link');
  const count = await gridTiles.count();
  const locators: Locator[] = [];
  for (let i = 0; i < count; i++) {
    locators.push(gridTiles.nth(i));
  }
  return locators;
}

/**
 * Extracts modal details, syllabus link (Silabo), and course content link (Descargar contenido).
 */
export async function extractModalContent(page: Page, timeoutMs: number = 8000): Promise<ExtractedModalData> {
  const modalLocator = page.locator('.modal.in, #MRE, #requisitos, .modal.show, div.modal:visible');
  await modalLocator.first().waitFor({ state: 'visible', timeout: timeoutMs });

  const modal = modalLocator.first();

  let code = '';
  let name = '';

  // 1. Extract Subject Code from "Código:" label row in modal body
  const codeLabel = modal.locator('label:has-text("Código:"), label:has-text("Codigo:")').first();
  if (await codeLabel.count() > 0) {
    const codeValueDiv = codeLabel.locator('xpath=./ancestor::div[contains(@class, "row")][1]//div[contains(@class, "col-md-10")]');
    if (await codeValueDiv.count() > 0) {
      code = (await codeValueDiv.innerText()).trim();
    }
  }

  if (!code) {
    const modalText = await modal.innerText();
    const codeMatch = modalText.match(/([A-Z]{3,5}\d{3,5}|[A-Z]{2,4}-\d{3,4})/i);
    code = codeMatch ? codeMatch[1].toUpperCase() : '';
  }

  // 2. Extract Subject Name from "Materia:" label row in modal body
  const materiaLabel = modal.locator('label:has-text("Materia:")').first();
  if (await materiaLabel.count() > 0) {
    const nameValueDiv = materiaLabel.locator('xpath=./ancestor::div[contains(@class, "row")][1]//div[contains(@class, "col-md-10")]');
    if (await nameValueDiv.count() > 0) {
      name = (await nameValueDiv.innerText()).trim();
    }
  }

  // Fallback for name if "Materia:" label is absent
  if (!name) {
    const titleLocator = modal.locator('.modal-title, h3, h4, .materia-title');
    const titleCount = await titleLocator.count();
    for (let i = 0; i < titleCount; i++) {
      const text = (await titleLocator.nth(i).innerText()).trim();
      if (text && !text.toLowerCase().includes('requisito')) {
        name = text;
        break;
      }
    }
  }

  // 3. Locate Syllabus PDF Link (Silabo Español / ReporteSyllabus)
  const syllabusBtn = modal.locator('a[href*="ReporteSyllabus"], a:has-text("Silabo"), a:has-text("Sílabo")').first();
  let hasSyllabusLink = false;
  let syllabusUrl: string | undefined;

  if (await syllabusBtn.count() > 0) {
    hasSyllabusLink = true;
    const href = await syllabusBtn.getAttribute('href');
    if (href) {
      syllabusUrl = href.startsWith('http') ? href : new URL(href, page.url()).toString();
    }
  }

  // 4. Locate Contenido Curso PDF Link (Descargar contenido / Contenidocurso)
  const contenidoBtn = modal.locator('a[href*="Contenidocurso"], a[href*="solicitudaprobadacp"], a:has-text("Descargar contenido"), a:has-text("Contenido")').first();
  let hasContenidoLink = false;
  let contenidoUrl: string | undefined;

  if (await contenidoBtn.count() > 0) {
    hasContenidoLink = true;
    const href = await contenidoBtn.getAttribute('href');
    if (href) {
      contenidoUrl = href.startsWith('http') ? href : new URL(href, page.url()).toString();
    }
  }

  return {
    code: code || 'UNKNOWN',
    name: name || 'MATERIA',
    syllabusUrl,
    hasSyllabusLink,
    contenidoUrl,
    hasContenidoLink
  };
}

/**
 * Closes the subject detail modal dialog cleanly.
 */
export async function closeModal(page: Page): Promise<void> {
  try {
    const closeBtn = page.locator('.modal.in .close, #MRE .close, #requisitos .close, [data-dismiss="modal"]:visible').first();
    if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.locator('.modal.in, #MRE, #requisitos').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {});
  } catch (err) {
    await page.keyboard.press('Escape');
  }
}
