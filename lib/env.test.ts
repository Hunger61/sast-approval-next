import { getPublicEnv } from "./env"

describe("getPublicEnv", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    delete process.env.NEXT_PUBLIC_APP_VERSION
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns appName when NEXT_PUBLIC_APP_NAME is set", () => {
    process.env.NEXT_PUBLIC_APP_NAME = "My App"
    expect(getPublicEnv()).toEqual({
      appName: "My App",
      apiBaseUrl: undefined,
      sentryDsn: undefined,
      appVersion: undefined,
    })
  })

  it("includes the optional vars when they are set", () => {
    process.env.NEXT_PUBLIC_APP_NAME = "My App"
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.test"
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://dsn.test"
    process.env.NEXT_PUBLIC_APP_VERSION = "3.0.0"
    expect(getPublicEnv()).toEqual({
      appName: "My App",
      apiBaseUrl: "https://api.test",
      sentryDsn: "https://dsn.test",
      appVersion: "3.0.0",
    })
  })

  it("throws when NEXT_PUBLIC_APP_NAME is missing", () => {
    delete process.env.NEXT_PUBLIC_APP_NAME
    expect(() => getPublicEnv()).toThrow(/NEXT_PUBLIC_APP_NAME/)
  })
})
