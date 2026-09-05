"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoadingState } from "@/components/common/states"
import { useUserStore } from "@/lib/store/user"

/**
 * 根路由。登录后按旧版行为进入「我的账号」；未登录时 AppShell 会直接渲染登录页。
 */
export default function RootPage() {
  const router = useRouter()
  const hydrated = useUserStore((state) => state.hydrated)
  const role = useUserStore((state) => state.role)

  React.useEffect(() => {
    if (hydrated && role !== "offline") {
      router.replace("/account")
    }
  }, [hydrated, role, router])

  return <LoadingState label="正在进入系统……" className="min-h-[60vh]" />
}
