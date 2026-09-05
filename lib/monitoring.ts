"use client"

import * as Sentry from "@sentry/react"
import { STORAGE_KEYS, readStorage } from "@/lib/storage"

/**
 * 前端异常上报。迁移自旧版 approval-system 的 Sentry 配置（含中文报错反馈弹窗）。
 *
 * 与旧版的唯一区别：DSN 改为通过 NEXT_PUBLIC_SENTRY_DSN 注入。
 * 未配置该环境变量时完全不初始化，也不会产生任何外部请求。
 */
let initialized = false

export function initMonitoring() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (initialized || !dsn || typeof window === "undefined") return
  initialized = true

  const name = readStorage(STORAGE_KEYS.name) ?? ""
  const code = readStorage(STORAGE_KEYS.code) ?? ""

  Sentry.setContext("用户信息", { 姓名: name, 学号: code })
  Sentry.setUser({ id: code, username: name })

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        networkDetailAllowUrls: [window.location.origin],
      }),
    ],
    beforeSend(event) {
      if (event.exception) {
        Sentry.showReportDialog({
          eventId: event.event_id,
          user: { name: readStorage(STORAGE_KEYS.name) ?? "" },
          title: "🤕 抱歉，我们似乎遇到了一些问题",
          subtitle: "别担心，我们的开发团队已经收到了相关提醒",
          subtitle2: "为了未来提供更好的体验，请告诉我们错误发生的详细信息",
          labelName: "名称",
          labelEmail: "联系方式",
          labelComments: "发生了什么？",
          labelSubmit: "提交",
          errorGeneric:
            "oh，🤯，又发生了个未知的错误，我们已经了解了，麻烦你可以再提交一次试试吗？",
          errorFormEntry: "提交的表单似乎还没写完，把错误信息都消除后再试一次吧！",
          successMessage: "👌🏻 感谢你的反馈，我们会尽快修复问题",
        })
      }
      return event
    },
    tracesSampleRate: 1.0,
    release: process.env.NEXT_PUBLIC_APP_VERSION
      ? `approve-system@${process.env.NEXT_PUBLIC_APP_VERSION}`
      : undefined,
    tracePropagationTargets: ["localhost", /^https:\/\/approve\.sast\.fun\/api/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

/** 登录成功后刷新上报用户身份 */
export function identifyUser(code: string, name: string) {
  if (!initialized) return
  Sentry.setContext("用户信息", { 姓名: name, 学号: code })
  Sentry.setUser({ id: code, username: name })
}
