"use client"

import * as React from "react"
import { getValidateCode } from "@/lib/api/public"
import { notifyRequestError } from "@/lib/api/errors"

/**
 * 拉取登录验证码图片。
 * 返回 objectURL（图片地址）、验证码 uuid（存于响应头 `captcha`）与刷新方法。
 */
export function useValidateCode() {
  const [imageUrl, setImageUrl] = React.useState<string>()
  const [captchaId, setCaptchaId] = React.useState("")
  const [nonce, setNonce] = React.useState(0)
  const [loadedNonce, setLoadedNonce] = React.useState(-1)
  const loading = loadedNonce !== nonce

  React.useEffect(() => {
    let revoked: string | undefined
    let cancelled = false
    getValidateCode()
      .then((res) => {
        if (cancelled) return
        const url = window.URL.createObjectURL(res.data as Blob)
        revoked = url
        setImageUrl(url)
        setCaptchaId(String(res.headers["captcha"] ?? ""))
      })
      .catch((error) => {
        if (!cancelled) notifyRequestError(error, "验证码加载失败，请点击图片重试")
      })
      .finally(() => {
        if (!cancelled) setLoadedNonce(nonce)
      })
    return () => {
      cancelled = true
      if (revoked) window.URL.revokeObjectURL(revoked)
    }
  }, [nonce])

  return {
    imageUrl,
    captchaId,
    loading,
    refresh: () => setNonce((value) => value + 1),
  }
}
