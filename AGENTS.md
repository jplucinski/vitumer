# AGENTS.md

Guidance for AI coding agents working on **Vitumer**.

## Project

Vitumer is a **frontend-only SPA** — a hybrid AI timer for structured time sessions (Pomodoro, HIIT, rituals, focus blocks). There is **no backend**, no server API, and no database.

- **Live demo:** https://vitumer.jplucinski.dev/

## Stack

- React 19 + Vite 8
- Tailwind CSS 4
- TypeScript (mix of `.ts`/`.tsx` and a few `.jsx` files)
- PWA via `vite-plugin-pwa`
- Optional AI via OpenRouter (OAuth PKCE, BYOK in browser storage)

## Architecture

```
src/
├── App.tsx                 # Main shell, settings, share/export
├── components/
│   ├── FocusView.tsx       # Timer engine + localStorage persistence
│   ├── CommandBar.tsx      # DSL input + AI session thread
│   └── ...
├── utils/
│   ├── dslParser.ts        # DSL parser (source of truth for syntax)
│   ├── dslSchema.ts        # Block normalization / stringify
│   ├── openrouterAuth.ts   # OAuth PKCE, API key storage, chat API
│   └── aiService.ts        # AI block generation
├── constants/
│   ├── dslReference.ts     # DSL examples (must match parser)
│   ├── aiPrompts.ts        # System prompts for AI features
│   └── storageKeys.ts      # localStorage key names
└── hooks/
    ├── usePathname.ts      # Lightweight client routing
    └── ...
public/
├── llms.txt                # LLM-readable DSL + share-link docs
└── docs/dsl/index.html     # Static DSL reference
```

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run lint     # ESLint
npm run preview  # preview production build
```

## Conventions

- Keep diffs minimal — change only what's needed.
- Functional React components and hooks; no class components.
- Match existing naming, file layout, and Tailwind patterns.
- No obvious/redundant comments.
- No over-engineering or premature abstractions.

## Do Not

- Add a backend, server routes, or env-based secrets for API keys.
- Hardcode OpenRouter API keys or OAuth client secrets.
- Invent API endpoints — Vitumer has none.
- Commit `dist/`, `node_modules/`, or `.env` files.
- Change DSL syntax without updating **all** of: `dslParser.ts`, `dslReference.ts`, `public/llms.txt`, `public/docs/dsl/`.

## AI Features

- System prompts live in `src/constants/aiPrompts.ts`.
- OpenRouter integration: `src/utils/openrouterAuth.ts`, `src/utils/aiService.ts`.
- API keys are stored in `localStorage` or `sessionStorage` after explicit user consent.
- OAuth callback is handled at `/` (static hosting friendly).

## Deploy

- **Production** — copy [`.github/workflows/deploy.yml.example`](.github/workflows/deploy.yml.example) → `deploy.yml`, configure FTP secrets, tag `v*.*.*` or manual dispatch.
- **Live:** https://vitumer.jplucinski.dev/
- **Alternative** — Vercel via `vercel.json` (SPA rewrites).
- Build command: `npm run build`, output: `dist/`. No runtime env vars required.

## Testing Changes

1. `npm run lint`
2. `npm run build`
3. Manually verify timer, DSL parsing, and share URL (`?flow=`) in the browser.
