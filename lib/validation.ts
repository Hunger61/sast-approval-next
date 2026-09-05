/**
 * 学号 / 手机号校验规则。
 *
 * 旧版的学号正则是 `/^(A|B)|(C)$/` 的形状，`^` 只约束了第一个分支、`$` 只约束了最后一个，
 * 整条规则退化成「包含」而不是「等于」，"B21031234xxxxx"、"乱写1234567890" 都能通过。
 * 这里把交替整体包进 (?:...) 里重新锚定，行为才符合原本的意图。
 */

/** 学号：字母学号（如 B21031234）或 10 ~ 11 位纯数字 */
export const STUDENT_CODE_PATTERN =
  /^(?:[BPQF](?:1[89]|2[0-6])(?:0\d|1\d)(?:[0-2]\d|3[01])\d{2}|\d{10,11})$/

export const STUDENT_CODE_MESSAGE = "学号格式不正确，应为 B21031234 这样的字母学号或 10 ~ 11 位数字"

/** 手机号：11 位，1 开头 */
export const PHONE_PATTERN = /^1[3-9]\d{9}$/

export const PHONE_MESSAGE = "手机号格式不正确，应为 1 开头的 11 位数字"

export function isStudentCode(value: string) {
  return STUDENT_CODE_PATTERN.test(value.trim())
}

export function isPhone(value: string) {
  return PHONE_PATTERN.test(value.trim())
}
