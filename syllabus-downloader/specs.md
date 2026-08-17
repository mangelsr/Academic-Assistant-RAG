# ESPOL Syllabus Downloader Specification

## 1. Executive Summary

**Syllabus Downloader** is an automated web crawler built with **TypeScript** and **Playwright (`@playwright/test` / `playwright`)** to systematically extract and download syllabus PDFs (*sílabos*) and course content PDFs (*contenido de curso*) for every degree program (*malla curricular*) hosted on ESPOL's academic portal ([mallacurricular.espol.edu.ec](https://mallacurricular.espol.edu.ec/)).

---

## 2. Technology Stack & Dependencies

- **Package Manager**: `pnpm`
- **Language**: TypeScript (`^5.0.0`)
- **Browser Automation**: Playwright Node.js API (`playwright^1.40.0`)
- **Runtime**: Node.js (`>=18.0.0`)
- **CLI Parsing**: `commander`
- **Core Dependencies**:
  - `playwright`: Web scraping and browser control.
  - `typescript`: Strong typing for DOM elements, configurations, and crawler state.
  - `tsx`: TypeScript execution engine.
  - `@types/node`: Type definitions for filesystem and path modules.

---

## 3. Target Platform Architecture

- **Base Program URL**: `https://mallacurricular.espol.edu.ec/Malla/Imagen?codCarrera={codCarrera}`
  - Example: `https://mallacurricular.espol.edu.ec/Malla/Imagen?codCarrera=CI013` (Computación)
  - Example: `https://mallacurricular.espol.edu.ec/Malla/Imagen?codCarrera=LI004` (Diseño Industrial)
- **DOM Layout**:
  - **Main Grid**: Subjects are rendered as interactive tiles (`.casilla` elements or SVG nodes).
  - **Electives & Complementaries**: Rendered in DataTables (`#tbl_materias_optativas`, `#tbl_materias_complementarias`).
  - **Subject Detail Modal**: Clicking a subject tile or table link opens a Bootstrap modal (`#requisitos` / `#MRE`) containing:
    1. **Syllabus Link** (`Silabo Español` / `ReporteSyllabus`).
    2. **Course Content Link** (`Descargar contenido` / `Contenidocurso`).

---

## 4. Playwright TypeScript Crawler Workflow

```mermaid
flowchart TD
    A[Start Crawler (pnpm)] --> B[Launch Playwright Chromium Browser]
    B --> C[Navigate Page to codCarrera]
    C --> D[Extract Degree Program Name]
    D --> E[Locate Subject Tiles & DataTables]
    E --> F[Select Next Subject Element]
    F --> G[Click Subject Element]
    G --> H[Wait for Modal Locator .modal:visible]
    H --> I[Create Folder downloads/degree_name/subjectcode_subjectname/]
    I --> J{Syllabus Link Present?}
    J -- Yes --> K[Download & Save syllabus.pdf]
    J -- No --> L[Check Contenido Link]
    K --> L
    L --> M{Contenido Link Present?}
    M -- Yes --> N[Download & Save contenidocurso.pdf]
    M -- No --> O[Close Modal]
    N --> O
    O --> P{More Subjects?}
    P -- Yes --> F
    P -- No --> Q[Save Manifest JSON & Close Browser]
```

---

## 5. Storage & Manifest Architecture

### Directory Hierarchy

Each subject receives a dedicated directory inside the degree program folder:

```
downloads/
├── CI013_CIENCIAS_DE_LA_COMPUTACION/
│   ├── CCPG1043_FUNDAMENTOS_DE_PROGRAMACION/
│   │   ├── syllabus.pdf
│   │   └── contenidocurso.pdf
│   ├── FISG1005_FISICA_MECANICA/
│   │   ├── syllabus.pdf
│   │   └── contenidocurso.pdf
│   └── manifest.json
└── LI004_DISENO_INDUSTRIAL/
    ├── DING2023_DISENO_DE_PRODUCTOS_I/
    │   ├── syllabus.pdf
    │   └── contenidocurso.pdf
    └── manifest.json
```

### TypeScript Type Definitions & Manifest Schema (`src/types.ts`)

```typescript
export interface SubjectRecord {
  code: string;
  name: string;
  status: 'SUCCESS' | 'PARTIAL' | 'NO_FILES' | 'DOWNLOAD_ERROR' | 'SKIPPED';
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
```

---

## 6. Non-Functional Requirements & Resilience

1. **Dual PDF Extraction**: Automatically extracts both `syllabus.pdf` and `contenidocurso.pdf` when available in the subject detail modal.
2. **Dynamic Degree Folder**: Automatically names the root career directory using the degree program title (e.g. `LI004_DISENO_INDUSTRIAL`).
3. **Throttling & Delays**: Configurable pause between subject clicks.
4. **Idempotency**: Skips existing `syllabus.pdf` and `contenidocurso.pdf` files unless `--overwrite` is specified.

---

## 7. Command Line Interface (CLI) Specification

| Flag / Option | Description | Default |
| :--- | :--- | :--- |
| `--carrera <code>` | Specific degree program code (e.g., `CI013`, `LI004`) | Required (or `--all`) |
| `--all` | Crawl all known ESPOL degree program codes | `false` |
| `--output <dir>` | Base directory for saved PDFs and manifest | `./downloads` |
| `--headless` | Run Playwright browser in headless mode | `true` |
| `--delay <ms>` | Wait duration between subject clicks in milliseconds | `800` |
| `--overwrite` | Force re-downloading PDFs if they already exist | `false` |

---

## 8. Project File Structure

```
syllabus-downloader/
├── specs.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── src/
│   ├── index.ts          # CLI entrypoint (Commander parsing)
│   ├── crawler.ts        # Playwright browser controller & dual-PDF workflow
│   ├── extractor.ts      # DOM locators & modal scanner (Syllabus + Contenido)
│   ├── storage.ts        # Subject folder creator & sanitizer
│   ├── types.ts          # TypeScript interfaces & type definitions
│   └── config.ts         # Options & default settings
└── downloads/            # Output root folder
```
