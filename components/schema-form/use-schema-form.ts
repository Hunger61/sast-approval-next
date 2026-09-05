"use client"

import { useState } from "react"
import type { FormError, SchemaFormInstance, SchemaFormValues } from "./types"

function clone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(clone) as unknown as T
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = clone(v)
  }
  return out as T
}

function getIn(source: SchemaFormValues, path: string): unknown {
  const segments = path.split(".").filter(Boolean)
  let cursor: unknown = source
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== "object") return undefined
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return cursor
}

function setIn(source: SchemaFormValues, path: string, value: unknown): SchemaFormValues {
  const segments = path.split(".").filter(Boolean)
  if (segments.length === 0) return source
  const next = { ...source }
  let cursor: Record<string, unknown> = next
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]
    const child = cursor[key]
    cursor[key] = child && typeof child === "object" ? { ...(child as object) } : {}
    cursor = cursor[key] as Record<string, unknown>
  }
  cursor[segments[segments.length - 1]] = value
  return next
}

/** 创建一个与 React 解耦的表单实例，由外部订阅其变更 */
function createFormInstance(): SchemaFormInstance {
  let values: SchemaFormValues = {}
  let errors: FormError[] = []
  let version = 0
  const listeners = new Set<() => void>()
  let submitHandler: () => void = () => {}

  const emit = () => {
    version += 1
    listeners.forEach((listener) => listener())
  }

  return {
    getValues: () => clone(values),
    setValues: (next) => {
      values = clone(next)
      emit()
    },
    getValueByPath: (path) => getIn(values, path),
    setValueByPath: (path, value) => {
      values = setIn(values, path, value)
      emit()
    },
    submit: () => submitHandler(),
    resetFields: () => {
      values = {}
      errors = []
      emit()
    },
    getErrors: () => errors,
    setErrors: (next) => {
      errors = next
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getVersion: () => version,
    registerSubmitHandler: (handler) => {
      submitHandler = handler
    },
  }
}

/**
 * 创建一个表单实例。API 与旧版 form-render 的 useForm 对齐：
 * form.setValueByPath / form.submit / form.getValues。
 */
export function useSchemaForm(): SchemaFormInstance {
  const [instance] = useState(createFormInstance)
  return instance
}

export { getIn, setIn }
