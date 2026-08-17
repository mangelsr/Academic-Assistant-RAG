import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { CrawlOptions, CrawlManifest, SubjectRecord, SubjectStatus } from './types';
import { getDegreeProgramName, getGridSubjectLocators, extractModalContent, closeModal } from './extractor';
import { buildSubjectFolderPath, isFileDownloaded, saveManifest } from './storage';

export async function runCrawler(options: CrawlOptions): Promise<CrawlManifest> {
  console.log(`\n🚀 Starting Syllabus Crawler for Program [${options.carrera}]...`);
  console.log(`   - Headless Mode: ${options.headless}`);
  console.log(`   - Output Directory: ${options.outputDir}`);
  console.log(`   - Delay between subjects: ${options.delayMs}ms\n`);

  const browser: Browser = await chromium.launch({
    headless: options.headless,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 900 }
  });

  const page: Page = await context.newPage();
  const records: SubjectRecord[] = [];

  try {
    const targetUrl = `https://mallacurricular.espol.edu.ec/Malla/Imagen?codCarrera=${options.carrera}`;
    console.log(`🌐 Navigating to: ${targetUrl}`);
    
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Hydration wait

    const degreeName = await getDegreeProgramName(page, options.carrera);
    console.log(`🎓 Program Degree Name: "${degreeName}"`);

    const subjectLocators = await getGridSubjectLocators(page);
    console.log(`📌 Discovered ${subjectLocators.length} interactive subject tiles on grid.`);

    let downloadedSyllabiCount = 0;
    let downloadedContenidosCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subjectLocators.length; i++) {
      const locator = subjectLocators[i];

      try {
        if (!(await locator.isVisible())) {
          await locator.scrollIntoViewIfNeeded().catch(() => {});
        }

        console.log(`\n[${i + 1}/${subjectLocators.length}] Clicking subject tile...`);
        await locator.click({ force: true });

        // Extract subject details and modal download links
        const modalData = await extractModalContent(page, options.timeoutMs);
        const subjectCode = modalData.code || `SUBJ_${i + 1}`;
        const subjectName = modalData.name || `Materia_${i + 1}`;

        // Build target folder: downloads/<degreeName>/<subjectCode_subjectName>/
        const subjectFolder = buildSubjectFolderPath(options.outputDir, degreeName, subjectCode, subjectName);
        const syllabusPath = path.join(subjectFolder, 'syllabus.pdf');
        const contenidoPath = path.join(subjectFolder, 'contenidocurso.pdf');

        console.log(`   Subject: [${subjectCode}] ${subjectName}`);
        console.log(`   Folder: ${subjectFolder}`);

        let syllabusDownloaded = false;
        let contenidoDownloaded = false;

        const modalLocator = page.locator('.modal.in, #MRE, #requisitos, .modal.show, div.modal:visible').first();

        // 1. Process Syllabus PDF
        if (modalData.hasSyllabusLink) {
          if (!options.overwrite && isFileDownloaded(syllabusPath)) {
            console.log(`   ⏩ syllabus.pdf already exists. Skipping.`);
            syllabusDownloaded = true;
          } else {
            console.log(`   📄 Downloading syllabus.pdf...`);
            const syllabusBtn = modalLocator.locator('a[href*="ReporteSyllabus"], a:has-text("Silabo"), a:has-text("Sílabo")').first();
            
            try {
              if (await syllabusBtn.count() > 0) {
                const [download] = await Promise.all([
                  page.waitForEvent('download', { timeout: options.timeoutMs }),
                  syllabusBtn.click()
                ]);
                await download.saveAs(syllabusPath);
                console.log(`   ✅ Saved: syllabus.pdf`);
                syllabusDownloaded = true;
                downloadedSyllabiCount++;
              }
            } catch (err: any) {
              // Fallback to direct HTTP fetch if popup didn't trigger browser download event
              if (modalData.syllabusUrl) {
                const res = await page.request.get(modalData.syllabusUrl);
                if (res.ok()) {
                  fs.writeFileSync(syllabusPath, await res.body());
                  console.log(`   ✅ Saved (via direct fetch): syllabus.pdf`);
                  syllabusDownloaded = true;
                  downloadedSyllabiCount++;
                }
              }
            }
          }
        } else {
          console.log(`   ℹ️ No syllabus PDF link found.`);
        }

        // 2. Process Contenido Curso PDF
        if (modalData.hasContenidoLink) {
          if (!options.overwrite && isFileDownloaded(contenidoPath)) {
            console.log(`   ⏩ contenidocurso.pdf already exists. Skipping.`);
            contenidoDownloaded = true;
          } else {
            console.log(`   📘 Downloading contenidocurso.pdf...`);
            const contenidoBtn = modalLocator.locator('a[href*="Contenidocurso"], a[href*="solicitudaprobadacp"], a:has-text("Descargar contenido"), a:has-text("Contenido")').first();

            try {
              if (modalData.contenidoUrl) {
                const res = await page.request.get(modalData.contenidoUrl);
                if (res.ok()) {
                  fs.writeFileSync(contenidoPath, await res.body());
                  console.log(`   ✅ Saved: contenidocurso.pdf`);
                  contenidoDownloaded = true;
                  downloadedContenidosCount++;
                }
              }
              if (!contenidoDownloaded && await contenidoBtn.count() > 0) {
                const [download] = await Promise.all([
                  page.waitForEvent('download', { timeout: options.timeoutMs }),
                  contenidoBtn.click()
                ]);
                await download.saveAs(contenidoPath);
                console.log(`   ✅ Saved: contenidocurso.pdf`);
                contenidoDownloaded = true;
                downloadedContenidosCount++;
              }
            } catch (err: any) {
              console.log(`   ⚠️ Failed to download contenidocurso.pdf: ${err.message || err}`);
            }
          }
        } else {
          console.log(`   ℹ️ No contenido curso PDF link found.`);
        }

        // Calculate record status
        let status: SubjectStatus = 'NO_FILES';
        if (syllabusDownloaded && contenidoDownloaded) {
          status = 'SUCCESS';
        } else if (syllabusDownloaded || contenidoDownloaded) {
          status = 'PARTIAL';
        }

        if (syllabusDownloaded && contenidoDownloaded && !options.overwrite && isFileDownloaded(syllabusPath) && isFileDownloaded(contenidoPath)) {
          skippedCount++;
        }

        records.push({
          code: subjectCode,
          name: subjectName,
          status,
          folderPath: subjectFolder,
          syllabusPath: syllabusDownloaded ? syllabusPath : undefined,
          contenidoPath: contenidoDownloaded ? contenidoPath : undefined,
          syllabusUrl: modalData.syllabusUrl,
          contenidoUrl: modalData.contenidoUrl
        });

        await closeModal(page);

      } catch (err: any) {
        console.error(`   ❌ Error processing subject [${i + 1}]: ${err.message || err}`);
        failedCount++;
        records.push({
          code: `ERR_${i + 1}`,
          name: `Subject ${i + 1}`,
          status: 'DOWNLOAD_ERROR',
          error: err.message || String(err)
        });
        await closeModal(page).catch(() => {});
      }

      if (options.delayMs > 0) {
        await page.waitForTimeout(options.delayMs);
      }
    }

    const manifest: CrawlManifest = {
      timestamp: new Date().toISOString(),
      programCode: options.carrera,
      degreeName,
      totalSubjects: subjectLocators.length,
      downloadedSyllabi: downloadedSyllabiCount,
      downloadedContenidos: downloadedContenidosCount,
      skipped: skippedCount,
      failed: failedCount,
      details: records
    };

    const manifestPath = saveManifest(options.outputDir, degreeName, manifest);
    console.log(`\n🎉 Scraping run finished for [${degreeName}]!`);
    console.log(`📊 Summary: Syllabi: ${downloadedSyllabiCount} | Contenidos: ${downloadedContenidosCount} | Skipped: ${skippedCount} | Failed: ${failedCount}`);
    console.log(`📝 Manifest saved to: ${manifestPath}\n`);

    return manifest;

  } finally {
    await browser.close();
  }
}
