export type PublicEnv = {
  appName: string
  apiBaseUrl: string | undefined
  sentryDsn: string | undefined
  appVersion: string | undefined
}

const REQUIRED = ["NEXT_PUBLIC_APP_NAME"] as const

/**
 * 读取并校验 NEXT_PUBLIC_* 环境变量，缺少必填项时抛错。变量清单见 .env.example。
 *
 * 说明：业务代码目前直接读取 `process.env.NEXT_PUBLIC_*`
 * （见 lib/api/client.ts、lib/monitoring.ts），本函数是集中校验入口。
 */
export function getPublicEnv(): PublicEnv {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required public env vars: ${missing.join(", ")}. See .env.example.`)
  }
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME as string,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
  }
}
