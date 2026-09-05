/**
 * 浏览器 localStorage 的安全封装（SSR / 静态导出阶段没有 window）。
 * key 与旧版 approval-system 完全一致，保证已登录用户无感迁移。
 */
export const STORAGE_KEYS = {
  token: "approval-system-token",
  code: "approval-system-code",
  name: "approval-system-name",
  major: "approval-system-major",
  college: "approval-system-college",
  contact: "approval-system-contact",
  userState: "userState",
  inboxPoint: "inboxPoint",
  allRead: "allRead",
  allReadState: "allReadState",
  allFoldState: "allFoldState",
  everyInboxMessageState: "everyInboxMessageState",
  listTotal: "listTotal",
  reviewEnd: "reviewEnd",
} as const

export const isBrowser = () => typeof window !== "undefined"

export function readStorage(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* 隐私模式下写入可能抛错，忽略 */
  }
}

export function removeStorage(key: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

export function clearStorage(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.clear()
  } catch {
    /* noop */
  }
}
