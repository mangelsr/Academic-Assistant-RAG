# Workspace Agent Rules (.agents/agents.md)

Workspace rules and instructions for AI coding assistants working in the `syllabus-downloader` project.

---

## 🎯 Codebase Objectives & Architecture

This project automates syllabus and course content extraction from ESPOL Malla Curricular using Playwright and TypeScript.

### Rules & Best Practices

1. **Build Verification**: Run `pnpm run build` (`tsc`) after editing any code in `src/`. Ensure there are zero TypeScript compiler errors.
2. **Error Recovery**: Handle modal rendering timeouts gracefully. If a subject modal fails to load within `timeoutMs`, log the error in `SubjectRecord` and proceed to the next subject without crashing the crawler script.
3. **Storage Sanitization**: Always route folder creation and file naming through `src/storage.ts` functions (`sanitizeFolderName`, `ensureSubjectFolder`) to sanitize Spanish accented characters and illegal path symbols.
4. **Manifest Schema Integrity**: Maintain structure defined in `src/types.ts`:
   - `SubjectRecord` status values: `'SUCCESS' | 'PARTIAL' | 'NO_FILES' | 'DOWNLOAD_ERROR' | 'SKIPPED'`
   - Write updated `manifest.json` at the conclusion of each degree crawl.
5. **No Destructive Overwrites**: Do not delete existing downloaded files in `downloads/` directory unless explicitly requested by the user or triggered via `--overwrite`.
