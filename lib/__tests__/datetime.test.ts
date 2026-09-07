import { formatDateTime, isFuture, isPast, parseDateTime, toDateString } from "@/lib/datetime"

describe("时间工具", () => {
  it("格式化为后端约定的格式", () => {
    const date = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDateTime(date)).toBe("2026-01-02 03:04:05")
    expect(formatDateTime(date, false)).toBe("2026-01-02 03:04")
  })

  it("兼容 '.' 与 '-' 两种分隔符", () => {
    expect(parseDateTime("2026.01.02 03:04")?.getFullYear()).toBe(2026)
    expect(parseDateTime("2026-01-02 03:04")?.getMonth()).toBe(0)
    expect(parseDateTime("")).toBeUndefined()
    expect(parseDateTime("不是时间")).toBeUndefined()
  })

  it("截取日期部分", () => {
    expect(toDateString("2026-01-02 03:04:05")).toBe("2026-01-02")
    expect(toDateString(null)).toBe("—")
  })

  it("判断评审是否已截止", () => {
    expect(isPast("2000-01-01 00:00:00")).toBe(true)
    expect(isPast("2999-01-01 00:00:00")).toBe(false)
    expect(isFuture("2999-01-01 00:00:00")).toBe(true)
    expect(isFuture("2000-01-01 00:00:00")).toBe(false)
    expect(isPast(undefined)).toBe(false)
  })
})
