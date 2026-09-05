"use client"

import * as React from "react"
import { ImagePlusIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type CoverUploaderProps = {
  /** 已有封面 url 或本地预览的 base64 */
  preview?: string
  onChange: (file: File, dataUrl: string) => void
  disabled?: boolean
  className?: string
}

const ACCEPT = ".jpg,.jpeg,.png,.gif"

/** 校验规则与旧版一致：仅 jpg/png/gif，且小于 5MB */
function validate(file: File) {
  const isJpgOrPng =
    file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/gif"
  if (!isJpgOrPng) {
    toast.error("封面仅支持 jpg、png 和 gif！")
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    toast.error("图片大小必须小于 5MB！")
    return false
  }
  return true
}

export function CoverUploader({ preview, onChange, disabled, className }: CoverUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [loading, setLoading] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)

  const handleFile = (file?: File | null) => {
    if (!file || !validate(file)) return
    setLoading(true)
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      onChange(file, String(reader.result))
      setLoading(false)
    })
    reader.addEventListener("error", () => {
      toast.error("封面读取失败，请重试")
      setLoading(false)
    })
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!disabled) handleFile(event.dataTransfer.files?.[0])
        }}
        className={cn(
          "bg-muted/40 relative flex aspect-16/9 w-full max-w-md cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:border-primary/50",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="比赛封面预览" className="size-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity hover:opacity-100">
              点击更换封面
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            {loading ? (
              <Loader2Icon className="size-7 animate-spin" />
            ) : (
              <ImagePlusIcon className="size-7" />
            )}
            <span className="text-sm">点击或拖拽上传封面</span>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs">仅支持 JPG、GIF、PNG 格式，文件小于 5M</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          event.target.value = ""
        }}
      />
    </div>
  )
}
