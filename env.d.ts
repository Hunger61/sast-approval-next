declare namespace NodeJS {
  interface ProcessEnv {
    /** Display name for the app. Required. */
    NEXT_PUBLIC_APP_NAME?: string
    /** 后端接口基地址，静态导出 / Tauri 下必填 */
    NEXT_PUBLIC_API_BASE_URL?: string
    /** 开发代理的后端源站 */
    NEXT_PUBLIC_API_ORIGIN?: string
    /** Sentry DSN，留空则不启用异常上报 */
    NEXT_PUBLIC_SENTRY_DSN?: string
    /** 上报中携带的版本号 */
    NEXT_PUBLIC_APP_VERSION?: string
  }
}
