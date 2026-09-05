import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-primary font-mono text-6xl font-bold">404</p>
      <h1 className="text-2xl font-semibold">页面不存在</h1>
      <p className="text-muted-foreground max-w-md text-sm">抱歉，你访问的页面不存在或已被移除。</p>
      <Button asChild>
        <Link href="/account">返回主页</Link>
      </Button>
    </div>
  )
}
