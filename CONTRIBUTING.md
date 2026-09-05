# 贡献指南 / Contributing

Thank you for your interest in contributing to **SAST 通用比赛管理评审系统**. This document covers the setup, conventions and review process for this repository.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sast-approval-next.git
   cd sast-approval-next
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/NJUPT-SAST/sast-approval-next.git
   ```

## Development Setup

### Prerequisites

- **Node.js** 20.x or later (see `.nvmrc`)
- **pnpm** 10.x (`packageManager` pins pnpm 10.30.3)
- **Rust** 1.77.2+ (only for Tauri desktop builds)

### Installation

```bash
# Install dependencies (always from the repo root, it covers the docs workspace too)
pnpm install

# Start development server
pnpm dev

# For Tauri desktop development
pnpm tauri dev
```

### Verify Setup

```bash
# Run linting
pnpm lint

# Run tests
pnpm test

# Check Tauri environment
pnpm tauri info
```

## Making Changes

### Branch Naming

The default branch is `master`. Create a feature branch from it:

```bash
git checkout master
git pull upstream master
git checkout -b <type>/<description>
```

Branch types:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

Examples:

- `feat/add-dark-mode-toggle`
- `fix/navigation-scroll-issue`
- `docs/update-installation-guide`

### Keep Your Fork Updated

```bash
git fetch upstream
git checkout master
git merge upstream/master
```

## Commit Guidelines

Conventional Commits are **enforced** by commitlint on the `commit-msg` hook, a non-conforming message is rejected locally. See [the spec](https://www.conventionalcommits.org/).

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Code style (formatting, semicolons, etc.)               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests                                |
| `build`    | Build system or external dependencies                   |
| `ci`       | CI/CD configuration                                     |
| `chore`    | Other changes that don't modify src or test files       |
| `revert`   | Reverts a previous commit                               |

### Examples

```bash
feat(review): add score breakdown to the reviewer detail page
fix(auth): keep the captcha uuid across a failed login
docs(readme): document the desktop CSP allow-list
refactor(api): move the Excel import into the api layer
test(navigation): cover the judge route allow-list
```

## Pull Request Process

1. **Update your branch** with the latest upstream changes
2. **Run all checks locally**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
3. **Push your branch** to your fork
4. **Create a Pull Request** against `master`
5. **Fill out the PR template** completely
6. **Request review** from maintainers
7. **Address feedback** and make requested changes
8. **Squash commits** if requested

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Added/updated tests as needed
- [ ] Updated documentation as needed
- [ ] All CI checks pass
- [ ] Linked related issues

## Coding Standards

**Tooling enforcement** (auto-runs on commit):

- **Prettier** formats staged files via `lint-staged`
- **ESLint --fix** runs on staged TS/JS files
- **commitlint** validates commit messages against Conventional Commits

First-time setup: `pnpm install`. The `prepare` script installs the Husky hooks (`pre-commit` runs lint-staged, `commit-msg` runs commitlint). If hooks do not fire, run `pnpm exec husky` manually.

`lint-staged` is configured in `.lintstagedrc.json`.

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any`, prefer precise types from `lib/types/`
- Export types from dedicated type files when shared

### React

- Use functional components with hooks
- Follow React 19 best practices
- Keep components small and focused
- Use proper prop typing

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Use CSS variables for theming
- Avoid inline styles

### File Organization

```
components/
├── ui/            # vendored shadcn/ui components, do not add tests here
├── layout/        # AppShell, sidebar, header, footer, providers
├── auth/          # login view
├── common/        # page header, states, pagination, pickers, dropzone, steps
├── competition/   # competition card & form, uploader, reviewers, white list
└── schema-form/   # JSON-Schema form engine
```

There are no barrel `index.ts` files. Import from the concrete module path.

### Naming Conventions

| Type             | Convention                  | Example           |
| ---------------- | --------------------------- | ----------------- |
| Components       | PascalCase                  | `UserProfile.tsx` |
| Hooks            | camelCase with `use` prefix | `useAuth.ts`      |
| Utilities        | camelCase                   | `formatDate.ts`   |
| Types/Interfaces | PascalCase                  | `UserData`        |
| Constants        | SCREAMING_SNAKE_CASE        | `MAX_RETRIES`     |

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Writing Tests

- Put grouped domain tests in a `__tests__/` directory, or collocate a single `*.test.ts` next to its module. Both layouts are already in use.
- **Never add test files inside `components/ui/`**, those are vendored shadcn/ui files.
- Use React Testing Library plus `user-event` for component tests.
- Test behaviour, not implementation details.
- Coverage thresholds are enforced in CI: 60% branches and functions, 70% lines and statements.
- Touching `lib/api/` means updating `lib/api/__tests__/endpoints.test.ts` in the same commit. It is the contract baseline against the legacy backend.

Patterns and worked examples live in [TESTING.md](./TESTING.md).

## Documentation

### When to Update Docs

- Adding new features
- Changing existing behavior
- Updating dependencies
- Modifying configuration

### Documentation Files

- `README.md` / `README_zh.md` - project overview and quick start
- `CLAUDE.md` / `AGENTS.md` / `.github/copilot-instructions.md` - guidance for AI coding assistants
- `MIGRATION.md` - mapping from the legacy `approval-system`, keep it current when behaviour diverges
- `CONTRIBUTING.md` - this file
- `CI_CD.md` - CI/CD setup guide
- `TESTING.md` - testing guide
- `src-tauri/UPDATER.md` - desktop updater signing

### Code Comments

- Use JSDoc for public APIs
- Explain "why", not "what"
- Keep comments up to date

## Questions?

If you have questions, feel free to:

1. Check existing [Issues](https://github.com/NJUPT-SAST/sast-approval-next/issues)
2. Open a new issue for discussion
3. Reach out to maintainers

Thank you for contributing! 🎉
