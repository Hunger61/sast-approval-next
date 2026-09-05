# Copilot Instructions for sast-approval-next

## Project Architecture

**SAST 通用比赛管理评审系统**, the competition management and review platform of NJUPT SAST, built as a **Next.js 16 (App Router) + Tauri 2.11 hybrid application**:

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (56 components)
- **Desktop wrapper**: Tauri 2.11 (Rust) for the native build
- **State management**: Zustand (`lib/store/user.ts` for auth state, `lib/store/ui.ts` for the dynamic breadcrumb label)
- **HTTP**: axios, in `lib/api/`, kept byte-compatible with the legacy `approval-system` backend

This repo is a full rewrite of the legacy CRA app. `MIGRATION.md` is the authoritative record of what moved where and which behaviours changed on purpose.

### Dual Runtime Model

1. **Web mode** (`pnpm dev`): Next.js dev server at <http://localhost:3000>
2. **Desktop mode** (`pnpm tauri dev`): Tauri wraps the app in a native window

`next.config.ts` sets `output: "export"`, so `pnpm build` emits the static `out/` directory that `src-tauri/tauri.conf.json` loads through `frontendDist: "../out"`. Do not remove the static export, the desktop build depends on it.

Two consequences worth remembering:

- Unknown dynamic route segments cannot be pre-rendered, so legacy path params became query params (`/activity/detail?id=`, `/review/list?comId=&page=`). The full mapping is in `CLAUDE.md`.
- Any page calling `useSearchParams()` must be wrapped in `<Suspense>`, otherwise the export fails.

## Key File Locations & Conventions

### Routing & Layouts

- `app/layout.tsx`: metadata, Geist fonts, `Providers` (next-themes, tooltips, store hydration, Sentry, console banner), then `AppShell`.
- `components/layout/app-shell.tsx`: renders a skeleton until the store hydrates, the login page when signed out, and the sidebar layout otherwise. Routes outside the role allow-list render the in-app 404.
- `app/**/page.tsx`: 19 routes, every one a client component.
- Path alias: `@/*` maps to the repo root (for example `@/lib/utils`).

### Roles

The backend returns a numeric `role` mapped in `lib/store/user.ts`: 0 `user`, 1 `judge`, 2 `approver`, 3 `admin`. `lib/navigation.ts` derives the sidebar menu, the route allow-list, and breadcrumb labels from it.

### Styling System

- **Tailwind v4** via the PostCSS plugin (`@tailwindcss/postcss`)
- `app/globals.css` imports `tailwindcss` and `tw-animate-css`, defines oklch CSS variables, maps them with `@theme inline`, and declares `@custom-variant dark (&:is(.dark *))`
- Dark mode is class based and driven by `next-themes`

### Component Patterns

- **shadcn/ui components** live in `components/ui/` (new-york style, RSC mode, config in `components.json`). All 56 are vendored already, import them directly and never add tests there.
- Feature components: `components/layout/`, `components/auth/`, `components/common/`, `components/competition/`.
- `components/schema-form/` is an in-house JSON-Schema form engine that replaces form-render 1.x. `useSchemaForm()` mirrors the legacy `useForm` API, and `widgets` injects custom controls.

### API Layer

- `lib/api/client.ts` owns the axios instance, injects the `Token` header, and on `errCode` 1003 / 1005 clears the session and returns to the login page.
- Dev requests go through the `/api` rewrite in `next.config.ts`. Production and Tauri need an absolute `NEXT_PUBLIC_API_BASE_URL`, defaulting to `https://approve.sast.fun/api`.
- `lib/api/__tests__/endpoints.test.ts` asserts method, URL and body for all 48 endpoints. Update and run it whenever you touch `lib/api/`.

### Tauri Integration

- `src-tauri/src/lib.rs`: builder setup, updater plugin on desktop, debug logging in dev.
- `src-tauri/src/commands.rs`: only `greet` is registered today, kept as a reference for the IPC pattern.
- `lib/tauri.ts` is the sole caller of `invoke()`. Business code imports named wrappers and gates them with `isTauri()`.
- `src-tauri/tauri.conf.json`: `identifier` `fun.sast.approval`, `beforeDevCommand` `pnpm dev`, `beforeBuildCommand` `pnpm build`, and a CSP whose `connect-src` allow-lists `https://approve.sast.fun`. A new backend origin must be added there or desktop requests fail silently.

## Developer Workflows

### Package Management

**Always use pnpm** (single lockfile at the repo root, pnpm workspace with `docs/`):

- `pnpm install` from the repo root, which also installs the Husky hooks
- `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`
- `pnpm tauri dev`, `pnpm tauri build` (no `tauri` script exists, pnpm resolves `node_modules/.bin`)
- `pnpm docs:dev` for the Fumadocs site on port 3001

`pnpm start` is inherited from the starter template and unusable, a static export has no server.

### Code Quality

- **Type checking**: `pnpm typecheck` (strict mode)
- **Linting**: `pnpm lint` (ESLint flat config with `eslint-config-next`), single file with `pnpm exec eslint <file>`
- **Tests**: Jest 30 with jsdom and Testing Library, 11 suites and 68 tests. Config in `jest.config.ts`, guide in `TESTING.md`
- **Commits**: commitlint enforces Conventional Commits on `commit-msg`, `lint-staged` runs ESLint and Prettier on `pre-commit`

### Adding shadcn/ui Components

Only for a component that is genuinely missing: `pnpm dlx shadcn@latest add <component-name>`

## Project-Specific Patterns

### Import Paths

```typescript
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

### Component Composition

```tsx
<Button asChild>
  <Link href="/path">Click me</Link>
</Button>
```

### Loading State

Do not call `setState` synchronously inside an effect, the React Compiler rules flag it. Use `lib/hooks/use-load-state.ts` instead.

### Styling Utilities

Use `cn()` from `@/lib/utils` to merge Tailwind classes: `cn("base", condition && "conditional", className)`.

## Known Configuration Notes

- **ESLint**: flat config, Next.js core-web-vitals plus TypeScript rules
- **TypeScript**: strict mode, bundler module resolution, `react-jsx`
- **Next.js config**: static export, unoptimized images, dev-only `/api` rewrites, and the `next-intl` plugin
- **Rust toolchain**: v1.77.2 or later
- **Versions are aligned at `3.0.0`** across `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`

## Known Scaffolding

Left over from the starter template, with no runtime caller:

- `i18n/` and the `next-intl` plugin. Nothing calls `useTranslations`, no provider is mounted, and the message files still hold template copy. The UI is Chinese-only.
- `lib/env.ts` and `greet` in `lib/tauri.ts`, covered by tests only.
- `public/next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`.
