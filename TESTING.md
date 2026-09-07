# Testing Guide

How tests are set up and run in `sast-approval-next`.

## Testing Stack

- **Test Runner**: Jest 30.x, wired through `next/jest`
- **Testing Library**: @testing-library/react 16.x plus user-event 14.x
- **Test Environment**: jsdom
- **Coverage Provider**: V8
- **CI**: GitHub Actions (`.github/workflows/test.yml`, called by `ci.yml` and `release.yml`)

## Current state

14 suites, 95 tests, all passing.

| Suite                                                   | Tests | Covers                                       |
| ------------------------------------------------------- | ----- | -------------------------------------------- |
| `lib/api/__tests__/endpoints.test.ts`                   | 20    | Method, URL and request body per endpoint    |
| `lib/__tests__/navigation.test.ts`                      | 10    | Sidebar menus, route allow-list, breadcrumbs |
| `components/schema-form/__tests__/schema-form.test.tsx` | 8     | Schema form engine                           |
| `lib/__tests__/register-schema.test.ts`                 | 6     | Sign-up schema                               |
| `lib/__tests__/form-templates.test.ts`                  | 5     | Form templates                               |
| `lib/__tests__/user-store.test.ts`                      | 5     | Auth store and role mapping                  |
| `lib/__tests__/datetime.test.ts`                        | 4     | Date and time formatting                     |
| `lib/tauri.test.ts`                                     | 4     | Tauri IPC wrappers                           |
| `lib/__tests__/file.test.ts`                            | 3     | Download and filename helpers                |
| `lib/env.test.ts`                                       | 3     | Public env validation                        |
| `lib/utils.test.ts`                                     | 2     | `cn()`                                       |
| `lib/__tests__/import-accounts.test.ts`                 | 9     | Excel 账号导入逐行校验                       |
| `lib/__tests__/api-errors.test.ts`                      | 6     | 网络层错误码 → 提示映射                      |
| `lib/__tests__/validation.test.ts`                      | 10    | 表单字段校验、评委表单校验                   |

## Running Tests

```bash
pnpm test                                   # all tests
pnpm test:watch                             # watch mode
pnpm test:coverage                          # with coverage into coverage/
pnpm test lib/api                           # a path pattern
pnpm test --testNamePattern="navigation"    # a name pattern
```

## Test file organization

Two layouts are in use, both discovered by the `testMatch` patterns in `jest.config.ts`
(`**/__tests__/**/*.?([mc])[jt]s?(x)` and `**/?(*.)+(spec|test).?([mc])[jt]s?(x)`):

```
lib/
  __tests__/                 grouped domain tests
    datetime.test.ts
    file.test.ts
    form-templates.test.ts
    navigation.test.ts
    register-schema.test.ts
    user-store.test.ts
  api/
    __tests__/
      endpoints.test.ts      the backend-compatibility baseline
  env.ts
  env.test.ts                collocated, next to its source
  tauri.ts
  tauri.test.ts
  utils.ts
  utils.test.ts
components/
  schema-form/
    __tests__/
      schema-form.test.tsx
```

Rules of thumb:

- A `lib/` module with a single obvious counterpart can keep its test collocated.
- Anything that grows past one file, or tests a directory rather than a module, goes into a `__tests__/` folder.
- **Never add test files inside `components/ui/`.** Those are vendored shadcn/ui files, and `jest.config.ts` excludes them from coverage collection on purpose.
- `src-tauri/` is excluded from Jest. Rust unit tests live in `src-tauri/src/commands.rs` and run with `cargo test`.

## The endpoints baseline

`lib/api/__tests__/endpoints.test.ts` asserts the HTTP method, URL and request body of every endpoint against the legacy `approval-system` backend contract. It is the regression baseline that keeps the rewrite drop-in compatible.

Whenever you add or change anything in `lib/api/`, update that suite in the same commit and run it first.

## Writing Tests

### Component test

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataPagination } from "@/components/common/data-pagination"

describe("DataPagination", () => {
  it("emits the next page when the user clicks forward", async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()

    render(<DataPagination current={1} pageSize={10} total={50} onChange={onChange} />)
    await user.click(screen.getByRole("button", { name: "下一页" }))

    expect(onChange).toHaveBeenCalledWith(2, 10)
  })
})
```

### API test

`lib/api/` calls the axios instance as a function, so the suite mocks `apis` itself and
inspects the config object of the last call:

```ts
jest.mock("@/lib/api/client", () => ({
  apis: jest.fn(() => Promise.resolve({ data: {} })),
  API_BASE_URL: "/api",
}))

import { apis } from "@/lib/api/client"
import * as admin from "@/lib/api/admin"

const mockedApis = apis as unknown as jest.Mock
const lastCall = () => mockedApis.mock.calls[mockedApis.mock.calls.length - 1][0]

it("requests the paginated competition list", () => {
  admin.getCompetitionList(1, 10)
  const config = lastCall()
  expect(config.method).toBe("get")
  expect(config.url).toBe("/admin/com/competitionList?pageNum=1&pageSize=10")
})
```

Look at the existing suites before inventing a new pattern, they already cover mocking `apis`, the Zustand stores, and localStorage.

### Utility test

```ts
import { cn } from "./utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2")
  })
})
```

## Jest Configuration

`jest.config.ts` is created through `next/jest`, so it picks up `next.config.ts` and `.env` files automatically. Notable settings:

- `testEnvironment: "jsdom"`
- `setupFilesAfterEnv`: `jest.setup.ts`
- `moduleNameMapper`: the `@/*` alias, CSS and image mocks from `__mocks__/`, and `@tauri-apps/api/core` mapped to `__mocks__/tauri-api.js`
- `testPathIgnorePatterns`: `node_modules`, `.next`, `out`, `src-tauri`
- `collectCoverageFrom`: `lib/` and `components/schema-form/` only — the tested surface. UI pages and other components are excluded so the threshold measures business-logic coverage instead of being diluted to ~20% by untested views
- `coverageThreshold`: 60% branches and functions, 70% lines and statements
- `reporters`: default console reporter plus `jest-junit` writing `coverage/junit.xml`

## Environment shims

`jest.setup.ts` provides what jsdom lacks and what Next.js needs:

- `ResizeObserver`, `matchMedia`, `hasPointerCapture` / `setPointerCapture` / `releasePointerCapture`, and `scrollIntoView`, all required by the Radix primitives behind Select, Slider and friends
- `next/image` mocked to a plain `<img>`
- `next/navigation` mocked with `useRouter`, `usePathname` and `useSearchParams`

If a component test fails with a missing browser API, add the shim here rather than in the test file.

## Coverage Reports

`pnpm test:coverage` writes to `coverage/`:

- `coverage/index.html` interactive HTML report
- `coverage/lcov.info` for CI integrations
- `coverage/junit.xml` JUnit results
- `coverage/clover.xml` and `coverage/cobertura-coverage.xml`

```bash
open coverage/index.html        # macOS
xdg-open coverage/index.html    # Linux
start coverage/index.html       # Windows
```

## CI Integration

Tests run automatically on:

- Pushes to `master` or `develop`, via `.github/workflows/ci.yml`
- Pull requests targeting `master` or `develop`, via `.github/workflows/ci.yml`
- Version tags, via `.github/workflows/release.yml`

`test.yml` is a reusable workflow called by `ci.yml` and `release.yml`. It also accepts `workflow_dispatch` so you can debug the test and build steps in isolation.

The pipeline installs dependencies, lints, runs tests with coverage, uploads coverage to Codecov when `CODECOV_TOKEN` is configured, publishes test results and coverage as artifacts, then builds the Next.js app and checks bundle size.

## Best Practices

### Test behaviour, not implementation

```ts
// avoid
expect(component.state.count).toBe(1)

// prefer
expect(screen.getByText("Count: 1")).toBeInTheDocument()
```

### Use accessible queries

`getByRole` first, then `getByLabelText`, `getByPlaceholderText`, `getByText`, and `getByTestId` only as a last resort.

### Use user-event over fireEvent

```ts
const user = userEvent.setup()
await user.click(button)
```

### Keep mocks honest

`clearMocks` is on, so mock call history resets between tests automatically. Mock at the module boundary (`lib/api/client`) rather than stubbing axios internals.

## Troubleshooting

**Tests are slow.** Use `test.only` while developing, or `pnpm test:watch` to run only what changed.

**Module not found.** Check that the alias in `jest.config.ts` matches `tsconfig.json`, and that Next.js-specific modules are mocked.

**"Not wrapped in act(...)" warnings.** Usually a store update outside `await`. Wrap the interaction in `await user.click(...)` or `await waitFor(...)`.

**Coverage not collected.** Verify the file is under `lib/` or `components/schema-form/`.

## Resources

- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
