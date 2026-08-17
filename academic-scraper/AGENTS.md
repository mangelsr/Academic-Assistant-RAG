# Agent Guidelines for ESPOL Syllabus Downloader

This repository contains an automated TypeScript & Playwright web crawler that systematically extracts syllabus PDFs (`syllabus.pdf`) and course content PDFs (`contenidocurso.pdf`) from ESPOL's academic portal ([mallacurricular.espol.edu.ec](https://mallacurricular.espol.edu.ec/)).

---

## 🛠️ Tech Stack & Prerequisites

- **Language**: TypeScript 5.x (`tsconfig.json` target: ES2022, CommonJS module resolution).
- **Automation**: Playwright (Chromium browser).
- **CLI Framework**: Commander.js.
- **Execution**: Node.js >= 18 with `pnpm` and `tsx`.

---

## ⚙️ Key Verification Commands

Always run build verification after modifying TypeScript source files:

```bash
# Run unit test suite
pnpm test

# Check TypeScript compilation
pnpm run build

# Test CLI execution with help output
pnpm start --help

# Test execution on a specific program code (headless mode)
pnpm start --carrera CI013
```

---

## 📂 Source Architecture & Scoping

- **`src/index.ts`**: CLI parser (Commander options & default handling).
- **`src/crawler.ts`**: Main Playwright browser lifecycle, page navigation, and loop management.
- **`src/extractor.ts`**: DOM locators, modal handling (`#requisitos` / `#MRE`), and PDF link detection.
- **`src/storage.ts`**: Folder creation, path sanitization, download stream saving, and `manifest.json` generation.
- **`src/types.ts`**: Core TypeScript interfaces (`CrawlOptions`, `SubjectRecord`, `CrawlManifest`).
- **`src/config.ts`**: Default configuration values (carrera code, delay, timeout).

---

## 📜 Agent Guidelines & Rules

1. **Strict Typing**: Maintain TypeScript interfaces in `src/types.ts`. Do not use `any` types.
2. **Resilient Playwright Selectors**: Use flexible locators for subject tiles (`.casilla`) and DataTables (`#tbl_materias_optativas`, `#tbl_materias_complementarias`).
3. **Dual PDF Extraction**: Ensure any DOM scanner logic attempts to capture both syllabus (`Silabo Español`) and course content (`Descargar contenido`) links.
4. **Idempotency**: Respect `overwrite: false` by default; skip downloading files if they already exist in the target subject directory.
5. **Manifest Consistency**: Ensure all crawl status updates (`SUCCESS`, `PARTIAL`, `NO_FILES`, `DOWNLOAD_ERROR`) properly populate `manifest.json`.
