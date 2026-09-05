import { STUDENT_CODE_PATTERN, isPhone, isStudentCode } from "@/lib/validation"

describe("学号规则", () => {
  it("接受字母学号与 10 ~ 11 位纯数字", () => {
    expect(isStudentCode("B21031234")).toBe(true)
    expect(isStudentCode("Q20120199")).toBe(true)
    expect(isStudentCode("1234567890")).toBe(true)
    expect(isStudentCode("12345678901")).toBe(true)
  })

  it("整条规则必须完整匹配，不是包含匹配", () => {
    // 旧版正则的锚点只覆盖了部分分支，下面两个都能通过，这里必须拦住
    expect(isStudentCode("B21031234xxxxx")).toBe(false)
    expect(isStudentCode("乱写1234567890")).toBe(false)
    expect(isStudentCode("1234567890abc")).toBe(false)
  })

  it("拒绝长度与前缀不对的学号", () => {
    expect(isStudentCode("B99999999")).toBe(false)
    expect(isStudentCode("A21031234")).toBe(false)
    expect(isStudentCode("123456789")).toBe(false)
    expect(isStudentCode("")).toBe(false)
  })

  it("正则不带 g 标志，重复调用结果稳定", () => {
    expect(STUDENT_CODE_PATTERN.flags).not.toContain("g")
    expect(STUDENT_CODE_PATTERN.test("B21031234")).toBe(true)
    expect(STUDENT_CODE_PATTERN.test("B21031234")).toBe(true)
  })
})

describe("手机号规则", () => {
  it("11 位、1 开头才算合法", () => {
    expect(isPhone("13800138000")).toBe(true)
    expect(isPhone("12345678901")).toBe(false)
    expect(isPhone("1380013800")).toBe(false)
    expect(isPhone("13800138000 ")).toBe(true)
  })
})
