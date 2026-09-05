"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUserStore } from "@/lib/store/user"

/** 退出登录：清空本地登录态并回到登录页 */
export function useLogout() {
  const router = useRouter()
  const logout = useUserStore((state) => state.logout)

  return React.useCallback(() => {
    logout()
    toast.info("👋 已退出登录", { description: "期待与你下次相见" })
    router.replace("/")
  }, [logout, router])
}
