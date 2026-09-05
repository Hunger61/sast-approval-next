# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Full rewrite of the legacy `approval-system` (CRA 5 + antd 4 + Recoil + react-router 6 + form-render 1.x) onto Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui and Zustand. All 20 legacy pages are migrated with no feature removed, see `MIGRATION.md`.
- Role-driven shell: sidebar menu, route allow-list and breadcrumbs derived from the backend `role` (`lib/navigation.ts`), with an in-app 404 for routes outside a role's allow-list.
- API layer in `lib/api/` (48 endpoints across `admin` / `judge` / `public` / `user`), byte-compatible with the legacy backend, plus a 19-case contract suite in `lib/api/__tests__/endpoints.test.ts`.
- In-house JSON-Schema form engine in `components/schema-form/`, API-compatible with the legacy form-render usage, including direct-to-object-storage upload on the submission page.
- `importAccountsFromExcel` wrapper for `POST /review/import`, which the legacy app hard-coded inside an antd `Upload` action.
- Tauri 2.11 desktop wrapper with a static-export frontend, a typed IPC bridge in `lib/tauri.ts`, and Rust unit tests in `src-tauri/src/commands.rs`.
- Jest 30 + Testing Library setup with 11 suites and 68 tests, enforced coverage thresholds, and JUnit output for CI.
- GitHub Actions pipeline: quality (ESLint, tsc, audit), tests with coverage, cross-platform Tauri builds, optional deploys, and tag-triggered draft releases.
- Fumadocs documentation site as a pnpm workspace package in `docs/`.
- Prettier, ESLint flat config, Husky hooks, lint-staged and commitlint.

### Changed

- Path parameters became query parameters (`/activity/detail?id=`, `/review/list?comId=&page=`) because `output: "export"` cannot pre-render unknown dynamic segments.
- `deleteCompetitionInfo` now sends `URLSearchParams` instead of a `qs`-stringified body, so the request carries `application/x-www-form-urlencoded` rather than `text/plain`. The body itself is unchanged.
- Dropped the ineffective `FormData` body the legacy app attached to GET requests. URLs are unchanged.
- Sentry is opt-in, initialised only when `NEXT_PUBLIC_SENTRY_DSN` is set.
- Notice editing refetches through `getCompetitionNoticeList` instead of relying on router state, so a refresh no longer loses data.
- Login no longer triggers `window.location.reload()`, it navigates to `/account` on the client.
- Review and screening entry points now agree on the same `/review/list` URL shape.
- Project identity aligned to this project: package name `sast-approval-next`, Tauri identifier `fun.sast.approval`, version `3.0.0` across `package.json`, `tauri.conf.json` and `Cargo.toml`.
- Tauri CSP `connect-src` allow-lists `https://approve.sast.fun`, without which the packaged desktop app could not reach its own backend.

### Fixed

- Creating a competition no longer forces `max_team_members = 15`, which had made the team-size selector inert.
- Individual-track sign-up no longer throws on a missing `listOfParti.select_numOfParti`.
- Competition name and introduction are validated before submission, where the legacy app submitted unchecked.

### Compatibility

- `localStorage` keys are identical to the legacy app (`approval-system-token`, `userState`, `inboxPoint`, `allReadState`, `allFoldState`, `everyInboxMessageState`, `listTotal`, `reviewEnd`), so an existing session carries over.

[Unreleased]: https://github.com/NJUPT-SAST/sast-approval-next/commits/master
