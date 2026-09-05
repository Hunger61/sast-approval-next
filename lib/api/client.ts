"use client"

import axios, { type AxiosResponse } from "axios"
import { toast } from "sonner"
import { STORAGE_KEYS, clearStorage, readStorage, writeStorage } from "@/lib/storage"

/**
 * 接口基地址。
 * - 开发环境走 next.config.ts 中的 rewrites 代理到 https://approve.sast.fun/api
 * - 生产 / Tauri 桌面端为静态导出，没有 Node 服务器，必须使用绝对地址
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "/api" : "https://approve.sast.fun/api")

export const apis = axios.create({
  baseURL: API_BASE_URL,
})

apis.interceptors.request.use((config) => {
  const token = readStorage(STORAGE_KEYS.token)
  if (token !== null) {
    config.headers.set("Token", token)
  }
  return config
})

/** 登录失效：清空本地状态并回到登录页 */
function handleUnauthorized() {
  toast.loading("⚠️ 登录已过期，正在重定向到登录页", { id: "unlogin" })
  clearStorage()
  writeStorage(STORAGE_KEYS.userState, "offline")
  if (typeof window !== "undefined") {
    window.location.href = "/"
  }
}

apis.interceptors.response.use((res: AxiosResponse) => {
  const payload = res.data
  // blob 响应没有 success 字段，跳过
  if (payload && typeof payload === "object" && "success" in payload && !payload.success) {
    switch (payload.errCode) {
      case 1003:
      case 1005:
        handleUnauthorized()
        break
      default:
        break
    }
  }
  return res
})
