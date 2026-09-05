# Repository Guidelines

## What this project is

**SAST 通用比赛管理评审系统**, the competition management and review platform of NJUPT SAST. It is a full rewrite of the legacy `approval-system` (CRA + antd 4 + Recoil + react-router 6) on Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Zustand, wrapped by Tauri 2.11 for the desktop build.

The backend HTTP API is unchanged from the legacy app. `MIGRATION.md` records the page-by-page mapping, API deltas, and every intentional behaviour change.

## Project Structure & Module Organization

This is a **pnpm monorepo** (`pnpm-workspace.yaml`) with two packages:

| Package  | Root    | Port | Build output                                   |
| -------- | ------- | ---- | ---------------------------------------------- |
| Main app | `/`     | 3000 | `out/` (static export for Tauri)               |
| Docs     | `docs/` | 3001 | `docs/.next/` (server mode, deploy separately) |

Run `pnpm install` from repo root. A single `pnpm-lock.yaml` covers all packages.

### Main app (`/`)

- `app/` Next.js App Router. 19 routes, all client components, all statically exported. See the route table in `CLAUDE.md`.
- `components/layout/` AppShell, sidebar, mobile tab bar, shared nav icons, header, footer, theme toggle, Providers.
- `components/auth/`, `components/common/`, `components/competition/` feature components.
- `components/schema-form/` in-house JSON-Schema form engine that replaces form-render 1.x.
- `components/ui/` shadcn/ui components. **Do not add test files here.** All 56 components are pre-installed (list below).
- `lib/api/` the HTTP layer, split into `client` / `admin` / `judge` / `public` / `user` (48 endpoints).
- `lib/store/` Zustand stores, `lib/constants/`, `lib/types/`, `lib/hooks/`.
- `lib/navigation.ts` role to menu, route allow-list, and breadcrumb mapping.
- `hooks/use-mobile.ts` breakpoint hook consumed by `components/ui/sidebar`.
- `i18n/` next-intl scaffolding, currently not wired into the UI (see "Known scaffolding").
- `public/assets/` product images, `src-tauri/` the Rust desktop wrapper.
- Root configs: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `jest.config.ts`, `components.json`.

### Docs site (`docs/`)

- `docs/app/` Next.js App Router for Fumadocs.
- `docs/lib/source.ts` Fumadocs content loader, import as `@/lib/source`.
- `docs/source.config.ts` content collection config, points at `content/docs/`.
- `docs/content/docs/` MDX files plus `meta.json` sidebar config.
- `docs/superpowers/` historical design docs and implementation plans from the starter-template phase. They describe an older state of the repo, so do not treat them as a description of the current code.
- `docs/.source/` **auto-generated** at dev/build time (gitignored). Contains the `collections/server` module.
- `docs/postcss.config.mjs` plus Tailwind v4 CSS in `docs/app/global.css`.

**Critical docs import rules:**

- Always `import { source } from "@/lib/source"`, never `@/app/source`.
- Always `import { RootProvider } from "fumadocs-ui/provider/next"`, not `fumadocs-ui/provider`.
- `collections/server` resolves via tsconfig path alias to `docs/.source/server`. TypeScript errors here mean `.source/` has not been generated yet, so run `pnpm docs:dev` once.

### Installed shadcn/ui Components

All 56 components are pre-installed in `components/ui/`. Import directly, do **not** run `shadcn add` for these:

`accordion` · `alert` · `alert-dialog` · `aspect-ratio` · `avatar` · `badge` · `breadcrumb` · `button` · `button-group` · `calendar` · `card` · `carousel` · `chart` · `checkbox` · `collapsible` · `combobox` · `command` · `context-menu` · `dialog` · `direction` · `drawer` · `dropdown-menu` · `empty` · `field` · `form` · `hover-card` · `input` · `input-group` · `input-otp` · `item` · `kbd` · `label` · `menubar` · `native-select` · `navigation-menu` · `pagination` · `popover` · `progress` · `radio-group` · `resizable` · `scroll-area` · `select` · `separator` · `sheet` · `sidebar` · `skeleton` · `slider` · `sonner` · `spinner` · `switch` · `table` · `tabs` · `textarea` · `toggle` · `toggle-group` · `tooltip`

`TooltipProvider` is already mounted in `app/layout.tsx`, no extra wrapper needed.

## Build, Test, and Development Commands

```bash
# Main app (port 3000)
pnpm dev              # Start Next.js dev server, /api proxy enabled
pnpm build            # Build for production (outputs to out/)
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting without writing
pnpm typecheck        # TypeScript --noEmit

# Testing
pnpm test             # Run Jest tests (11 suites / 68 tests)
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report

# Desktop (Tauri). There is no `tauri` script, pnpm resolves node_modules/.bin
pnpm tauri dev        # Dev mode with hot reload
pnpm tauri build      # Build desktop installer
pnpm tauri info       # Check Tauri environment

# Docs site (port 3001), pnpm workspace package at docs/
pnpm docs:dev         # Start Fumadocs dev server (also generates docs/.source/)
pnpm docs:build       # Build docs for production
pnpm docs:start       # Start docs production server

# Add shadcn/ui components (main app only)
pnpm dlx shadcn@latest add <component-name>
```

`pnpm start` is inherited from the starter template and cannot be used, because `output: "export"` produces a static site with no server.

## Coding Style & Naming Conventions

- Language: TypeScript with React 19 and Next.js 16.
- Linting: `eslint.config.mjs` is the source of truth, keep code warning-free.
- Styling: Tailwind CSS v4 (utility-first). Use `cn()` from `@/lib/utils` for conditional classes.
- Components: PascalCase names/exports, files in `components/ui/` mirror export names.
- Routes: Next app files are lowercase (`page.tsx`, `layout.tsx`).
- Code: camelCase variables/functions, hooks start with `use*`.
- Every page is a client component. Auth state lives in localStorage and is hydrated by `Providers`, so `AppShell` renders a skeleton until hydration completes.
- Do not call `setState` synchronously inside an effect. The React Compiler rules in `eslint-config-next` flag it, use `lib/hooks/use-load-state.ts` for request loading state instead.
- Any page using `useSearchParams()` must be wrapped in `<Suspense>`, otherwise the static export fails.

## Testing Guidelines

- Runner: **Jest 30** with `next/jest`, jsdom environment, Testing Library. Config in `jest.config.ts`, setup in `jest.setup.ts`.
- Current state: 11 suites, 68 tests, all passing.
- Both layouts are in use: `__tests__/` directories (`lib/__tests__/`, `lib/api/__tests__/`, `components/schema-form/__tests__/`) and collocated `*.test.ts` next to the source (`lib/utils.test.ts`, `lib/env.test.ts`, `lib/tauri.test.ts`).
- Coverage thresholds are enforced: 60% branches/functions, 70% lines/statements. `components/ui/**` and layouts are excluded from collection.
- **Never add test files inside `components/ui/`**, those are vendored shadcn/ui files.
- When you touch `lib/api/`, update and run `lib/api/__tests__/endpoints.test.ts` first. It asserts method, URL and body for every endpoint and is the regression baseline for backend compatibility.
- Full guide: `TESTING.md`.

## Commit & Pull Request Guidelines

- Conventional Commits are **enforced** by commitlint on the `commit-msg` hook: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `ci:`, and so on.
- `lint-staged` runs ESLint `--fix` plus Prettier on staged files via the `pre-commit` hook. Both hooks are installed by `pnpm install` through the `prepare` script.
- Link issues in the footer: `Closes #123`.
- PRs should include brief scope/intent, screenshots for UI changes, validation steps, and must pass `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Keep changes focused, avoid unrelated refactors.

## Security & Configuration Tips

- Use `.env.local` for local values, do not commit `.env*` files other than `.env.example`.
- Every variable in this app is `NEXT_PUBLIC_*` and therefore public. Never put a secret in one.
- Tauri: keep capabilities in `src-tauri/capabilities/` minimal and avoid broad filesystem access.
- The Tauri CSP in `src-tauri/tauri.conf.json` allow-lists `https://approve.sast.fun` under `connect-src`. Any new backend origin must be added there, or desktop requests fail silently.

## Known scaffolding

Left over from the starter template, with no runtime caller today. Check whether deleting is better than extending before you build on them:

- `i18n/` plus the `next-intl` plugin in `next.config.ts`. Nothing calls `useTranslations`, no `NextIntlClientProvider` is mounted, and `i18n/messages/*.json` still holds template copy. The UI is Chinese-only.
- `lib/env.ts` and `greet` in `lib/tauri.ts`, covered by tests but not called by app code.
- `public/next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`.
