"use client"

import axios from "axios"
import { toast } from "sonner"

/**
 * 请求失败的两类情况：
 * - 网络层：请求根本没拿到响应（DNS 解析失败、连接被拒、超时、断网），这类问题多半出在
 *   用户侧的网络环境，提示「联系管理员」是误导，应该建议换网络重试。
 * - 业务层：拿到了响应但 success 为 false 或状态码非 2xx，沿用调用方自己的文案。
 */

export const NETWORK_ERROR_TITLE = "🌐 网络连接失败"
export const NETWORK_ERROR_DESCRIPTION = "无法解析服务器地址，请检查网络连接或更换网络环境后重试"

export const TIMEOUT_ERROR_TITLE = "🌐 网络超时"
export const TIMEOUT_ERROR_DESCRIPTION = "服务器响应超时，请检查网络连接或更换网络环境后重试"

/** 已经提示过的错误对象，避免拦截器与调用方各弹一次 */
const notified = new WeakSet<object>()

function isTimeout(error: unknown) {
  return axios.isAxiosError(error) && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
}

/** 是否是网络层错误。DNS 解析失败（ERR_NAME_NOT_RESOLVED）属于这一类 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    // 主动取消不算失败
    if (error.code === "ERR_CANCELED") return false
    // 拿到响应就是业务 / 服务端错误
    return error.response === undefined
  }
  // 原生 fetch 在 DNS 解析失败时抛 TypeError: Failed to fetch
  return error instanceof TypeError && /fetch|network/i.test(error.message)
}

/** 网络层错误对应的提示文案 */
export function getNetworkErrorNotice(error: unknown) {
  return isTimeout(error)
    ? { title: TIMEOUT_ERROR_TITLE, description: TIMEOUT_ERROR_DESCRIPTION }
    : { title: NETWORK_ERROR_TITLE, description: NETWORK_ERROR_DESCRIPTION }
}

export function markNetworkErrorNotified(error: unknown) {
  if (error !== null && typeof error === "object") notified.add(error)
}

export function wasNetworkErrorNotified(error: unknown) {
  return error !== null && typeof error === "object" && notified.has(error)
}

/**
 * 统一展示请求失败提示。
 * 网络层错误提示更换网络环境，其余沿用调用方传入的 fallback 文案。
 */
export function notifyRequestError(
  error: unknown,
  fallback: string,
  options?: { id?: string; description?: string }
) {
  if (isNetworkError(error)) {
    // 拦截器已经弹过网络提示，这里只负责收掉调用方的 loading toast
    if (wasNetworkErrorNotified(error)) {
      if (options?.id !== undefined) toast.dismiss(options.id)
      return
    }
    markNetworkErrorNotified(error)
    const notice = getNetworkErrorNotice(error)
    toast.error(notice.title, { id: options?.id ?? "network", description: notice.description })
    return
  }
  toast.error(fallback, { id: options?.id, description: options?.description })
}
