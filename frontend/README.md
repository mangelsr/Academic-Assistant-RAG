# Academic Assistant SPA (Angular Frontend)

Single-Page Application (SPA) for the **University Academic Assistant** RAG system, built using **Angular 19+**, **Angular Signals**, **Tailwind CSS**, and **`pnpm`**.

---

## ⚡ Key Features & Technologies

- **Reactive State via Angular Signals**: Uses `signal()`, `computed()`, and `input()` primitives for instantaneous, lightweight state management without redundant re-renders.
- **Package Manager**: **`pnpm`** (configured via `packageManager: pnpm@10.4.0`).
- **Interactive RAG Chat**:
  - Model selection toggle (Claude 3 Haiku vs Claude 3.5 Sonnet).
  - Top-K retrieval parameter slider (1-15 chunks).
  - Quick prompt suggestion chips for student queries.
  - Execution latency tracking (`⚡ 348ms`).
- **Syllabus Citation Cards**: Interactive source attribution badges showing vector similarity scores (%), course codes, course names, expandable snippets, and copyable S3 URIs.
- **XSS-Safe DOM Sanitization**: `MarkdownSanitizePipe` wrapping Angular `DomSanitizer` to render formatted markdown response text safely.
- **Design System**: Dark-mode glassmorphism theme, Google Fonts (*Plus Jakarta Sans* & *Inter*), custom scrollbars, and Lucide icons.

---

## 📂 Component Structure

```
src/app/
├── components/
│   ├── rag-chat/          # Main conversation view & LLM controls
│   ├── program-selector/  # Degree program dropdown & career search
│   └── citation-cards/    # Source attribution cards with score badges
├── services/
│   ├── api.service.ts     # HttpClient REST wrapper for FastAPI backend
│   └── program-state.ts   # Angular Signals global state manager
├── models/
│   └── academic.models.ts # TypeScript interfaces (Query, Citation, Career)
├── pipes/
│   └── markdown.pipe.ts   # Safe Markdown rendering pipe
├── environments/          # Local dev and production API base URLs
└── styles.scss            # Tailwind CSS styling tokens
```

---

## 🛠️ Getting Started & Commands

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload when source files change.

### 3. Build for Production

```bash
pnpm build
```

Build artifacts will be stored in `dist/frontend` ready for deployment to Amazon S3 & CloudFront.

---

## ⚙️ Environment Configuration

API base URLs are managed in `src/environments/`:

- **`environment.ts`** (Development): `apiBaseUrl: 'http://localhost:8000/api/v1'`
- **`environment.prod.ts`** (Production): `apiBaseUrl: '/api/v1'`
