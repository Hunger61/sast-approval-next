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

/** 评委账号的初始密码 / 重置密码最短长度 */
export const MIN_PASSWORD_LENGTH = 6

export const PASSWORD_MESSAGE = `密码至少 ${MIN_PASSWORD_LENGTH} 位`

export type JudgeFormValues = {
  code: string
  name: string
  contact: string
  password: string
}

/**
 * 新增 / 编辑评委表单的字段校验。
 * 纯函数，返回 `字段名 → 错误文案`，没有问题时返回空对象。
 *
 * 编辑时学号不可改、密码留空表示不重置，所以只在填了密码时才校验长度。
 */
export function validateJudgeForm(values: JudgeFormValues, isEdit: boolean) {
  const errors: Record<string, string> = {}

  if (!values.code.trim()) errors.code = "请输入学号"
  else if (!isStudentCode(values.code)) errors.code = STUDENT_CODE_MESSAGE

  if (!values.name.trim()) errors.name = "请输入姓名"

  if (!values.contact.trim()) errors.contact = "请输入联系方式"
  else if (!isPhone(values.contact)) errors.contact = PHONE_MESSAGE

  const passwordRequired = !isEdit || values.password !== ""
  if (passwordRequired && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = PASSWORD_MESSAGE
  }

  return errors
}
