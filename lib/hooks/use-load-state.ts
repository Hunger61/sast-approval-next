"use client"

import * as React from "react"

/**
 * 请求键驱动的加载状态。
 *
 * 只有当「已完成的键」与「当前请求键」一致时才视为加载完成，
 * 因此不需要在 effect 里同步调用 setLoading(true)（那会触发级联渲染，
 * 也会被 react-hooks/set-state-in-effect 规则拦截）。
 *
 * @param key 由请求参数拼成的键，参数变化即视为重新加载
 */
export function useLoadState(key: string) {
  const [loadedKey, setLoadedKey] = React.useState<string | null>(null)
  const [nonce, setNonce] = React.useState(0)

  const requestKey = `${key}#${nonce}`

  return {
    /** 放进 effect 依赖数组，并在完成时回传给 markLoaded */
    requestKey,
    loading: loadedKey !== requestKey,
    markLoaded: React.useCallback((finished: string) => setLoadedKey(finished), []),
    /** 手动触发一次重新加载 */
    reload: React.useCallback(() => setNonce((value) => value + 1), []),
  }
}
