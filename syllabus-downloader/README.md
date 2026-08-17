# ESPOL Syllabus Downloader

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.42-green.svg)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

An automated TypeScript and Playwright crawler for systematically scraping and downloading course syllabus PDFs (*sílabos*) and course content PDFs (*contenido de curso*) from ESPOL's academic portal ([mallacurricular.espol.edu.ec](https://mallacurricular.espol.edu.ec/)).

---

## 📌 Features

- ⚙️ **Automated Browser Scraping**: Powered by Playwright Chromium for reliable SPA navigation and DOM interaction.
- 📄 **Dual PDF Extraction**: Automatically extracts both Spanish Syllabi (`syllabus.pdf`) and Course Contents (`contenidocurso.pdf`) per subject.
- 🎓 **Full Curriculum Coverage**: Scrapes main curriculum grid tiles as well as elective and complementary subjects listed in DataTables.
- 📁 **Organized Directory Structure**: Creates clear, sanitized folder structures per degree program and subject (e.g. `downloads/CI013_CIENCIAS_DE_LA_COMPUTACION/CCPG1043_FUNDAMENTOS_DE_PROGRAMACION/`).
- ⚡ **Idempotent Execution**: Automatically skips already downloaded files unless the `--overwrite` flag is supplied.
- 📊 **Crawl Manifest Generation**: Outputs a comprehensive `manifest.json` report containing execution metadata, summary statistics, and individual subject statuses.
- 🎛️ **Flexible CLI**: Configurable degree program code, delays, timeouts, output directory, and headless mode.

---

## 🛠️ Technology Stack

- **Runtime**: [Node.js](https://nodejs.org/) (`>= 18.0.0`)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Browser Automation**: [Playwright](https://playwright.dev/)
- **CLI Parser**: [Commander.js](https://github.com/tj/commander.js)
- **TypeScript Runner**: [tsx](https://github.com/privatenumber/tsx)

---

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have **Node.js** (v18+) and **pnpm** installed:

```bash
node -v
pnpm -v
```

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/syllabus-downloader.git
cd syllabus-downloader
pnpm install
```

Install Playwright browsers (if not already installed):

```bash
pnpm exec playwright install chromium
```

---

## 📖 Usage

### Running the Crawler

Use `pnpm start` or `pnpm run scrape` to run the crawler:

```bash
# Download syllabus & content for Computer Science (CI013)
pnpm start --carrera CI013

# Or with custom output directory and delay
pnpm start -c LI004 -o ./my_downloads -d 1000
```

### Command Line Interface (CLI) Options

```text
Usage: espol-syllabus-downloader [options]

Automated Playwright crawler to download syllabus PDFs for ESPOL degree programs

Options:
  -V, --version           output the version number
  -c, --carrera <code>    ESPOL degree program code (e.g., CI013) (default: "CI013")
  -o, --output <dir>      Directory to save downloaded syllabus PDFs (default: "./downloads")
  --headful               Run browser in visible headful mode for debugging (default: false)
  -d, --delay <ms>        Delay between clicking subjects in milliseconds (default: 800)
  -t, --timeout <ms>      Timeout for modal rendering and download events in ms (default: 15000)
  --overwrite             Force re-downloading PDFs if they already exist (default: false)
  -h, --help              display help for command
```

### Common Command Examples

| Objective | Command |
| :--- | :--- |
| **Default Crawl** (CI013, Headless) | `pnpm start` |
| **Crawl Specific Program** (e.g. Industrial Design) | `pnpm start --carrera LI004` |
| **Visible Debugging Mode** | `pnpm start -c CI013 --headful` |
| **Force Overwrite Existing PDFs** | `pnpm start -c CI013 --overwrite` |
| **Custom Output & Slower Pace** | `pnpm start -c CI013 -o ./output -d 1500` |

---

## 📂 Directory & Output Architecture

### Downloaded Directory Hierarchy

The crawler creates a structured hierarchy inside the output folder:

```text
downloads/
└── CI013_CIENCIAS_DE_LA_COMPUTACION/
    ├── manifest.json
    ├── CCPG1043_FUNDAMENTOS_DE_PROGRAMACION/
    │   ├── syllabus.pdf
    │   └── contenidocurso.pdf
    ├── FISG1005_FISICA_MECANICA/
    │   ├── syllabus.pdf
    │   └── contenidocurso.pdf
    └── MATG1045_ALGEBRA_LINEAL/
        ├── syllabus.pdf
        └── contenidocurso.pdf
```

### Manifest Schema (`manifest.json`)

Upon completing a crawl, a `manifest.json` report is generated in the program folder:

```json
{
  "timestamp": "2026-08-16T00:00:00.000Z",
  "programCode": "CI013",
  "degreeName": "CIENCIAS DE LA COMPUTACION",
  "totalSubjects": 45,
  "downloadedSyllabi": 42,
  "downloadedContenidos": 40,
  "skipped": 0,
  "failed": 3,
  "details": [
    {
      "code": "CCPG1043",
      "name": "FUNDAMENTOS DE PROGRAMACION",
      "status": "SUCCESS",
      "folderPath": "downloads/CI013_CIENCIAS_DE_LA_COMPUTACION/CCPG1043_FUNDAMENTOS_DE_PROGRAMACION",
      "syllabusPath": "downloads/CI013_CIENCIAS_DE_LA_COMPUTACION/CCPG1043_FUNDAMENTOS_DE_PROGRAMACION/syllabus.pdf",
      "contenidoPath": "downloads/CI013_CIENCIAS_DE_LA_COMPUTACION/CCPG1043_FUNDAMENTOS_DE_PROGRAMACION/contenidocurso.pdf"
    }
  ]
}
```

---

## 🛠️ Development & Building

### Build TypeScript & Run Unit Tests

Compile TypeScript to JavaScript in `dist/` and execute unit test suites:

```bash
# Run unit tests
pnpm test

# Build TypeScript
pnpm run build
```

### Project File Layout

```text
syllabus-downloader/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── specs.md
├── README.md
├── src/
│   ├── index.ts          # CLI entrypoint & Commander definition
│   ├── crawler.ts        # Playwright browser controller & page navigation
│   ├── extractor.ts      # DOM locators & subject detail modal parsing
│   ├── storage.ts        # Directory sanitizer & manifest logger
│   ├── config.ts         # Default configurations
│   └── types.ts          # TypeScript interfaces & manifest types
└── downloads/            # Default downloads directory
```

---

## 📜 License

This project is licensed under the **ISC License**.
