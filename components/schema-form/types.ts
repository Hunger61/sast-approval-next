/**
 * 轻量 JSON-Schema 表单引擎的类型定义。
 * 字段语义与旧版 form-render@1.x 保持一致，因此后端下发的 schema 无需任何改动。
 */

export type SchemaRule = {
  pattern?: RegExp | string
  message?: string
  required?: boolean
  min?: number
  max?: number
}

export type SchemaNode = {
  type?: "object" | "string" | "number" | "boolean" | "array"
  title?: string
  description?: string
  /** column：标签在上；row：标签在左 */
  displayType?: "row" | "column"
  labelWidth?: number
  properties?: Record<string, SchemaNode>
  /** 自定义/内置控件名：select | radio | slider | customUpload | ... */
  widget?: string
  /** textarea 等格式化提示 */
  format?: string
  required?: boolean
  readOnly?: boolean
  disabled?: boolean
  hidden?: boolean
  enum?: (string | number)[]
  enumNames?: string[]
  props?: Record<string, unknown>
  min?: number
  max?: number
  maxLength?: number
  default?: unknown
  order?: number
  placeholder?: string
  rules?: SchemaRule[]
}

export type FormError = {
  name: string
  error: string[]
}

export type SchemaFormValues = Record<string, unknown>

export type SchemaFormInstance = {
  /** 取得完整表单值（嵌套结构） */
  getValues: () => SchemaFormValues
  /** 覆盖式设置全部表单值 */
  setValues: (values: SchemaFormValues) => void
  /** 按路径读取，路径用 "." 分隔，例如 listOfParti.leader.name */
  getValueByPath: (path: string) => unknown
  /** 按路径写入，支持写入对象 */
  setValueByPath: (path: string, value: unknown) => void
  /** 触发校验并调用 onFinish */
  submit: () => void
  /** 清空所有值与错误 */
  resetFields: () => void
  /** 当前校验错误 */
  getErrors: () => FormError[]
  /** 内部：订阅变更 */
  subscribe: (listener: () => void) => () => void
  /** 内部：快照版本号 */
  getVersion: () => number
  /** 内部：由 SchemaForm 注册提交处理器 */
  registerSubmitHandler: (handler: () => void) => void
  /** 内部：设置错误 */
  setErrors: (errors: FormError[]) => void
}

/** 自定义控件收到的 props */
export type WidgetProps = {
  value: unknown
  onChange: (value: unknown) => void
  schema: SchemaNode
  path: string
  disabled?: boolean
  readOnly?: boolean
  error?: string
} & Record<string, unknown>

export type WidgetComponent = React.ComponentType<WidgetProps>
