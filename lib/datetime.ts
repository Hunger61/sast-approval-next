/**
 * 时间工具。后端使用 "YYYY-MM-DD HH:mm:ss" 与 "YYYY.MM.DD HH:mm" 两种格式，
 * 这里统一处理，避免引入 moment。
 */

const pad = (value: number) => String(value).padStart(2, "0")

export function formatDateTime(date: Date, withSeconds = true) {
  const base = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
  return withSeconds ? `${base}:${pad(date.getSeconds())}` : base
}

/** 解析后端返回的时间字符串，兼容 "." 与 "-" 分隔 */
export function parseDateTime(value?: string | null): Date | undefined {
  if (!value) return undefined
  const normalized = value.replace(/\./g, "/").replace(/-/g, "/")
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/** 仅取日期部分 */
export function toDateString(value?: string | null) {
  if (!value) return "—"
  return value.substring(0, 10)
}

/** 判断当前时间是否晚于给定时间 */
export function isPast(value?: string | null) {
  const parsed = parseDateTime(value)
  if (!parsed) return false
  return Date.now() > parsed.getTime()
}

/** 判断当前时间是否早于给定时间 */
export function isFuture(value?: string | null) {
  const parsed = parseDateTime(value)
  if (!parsed) return false
  return Date.now() < parsed.getTime()
}
