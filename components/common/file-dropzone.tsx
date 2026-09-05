"use client"

import * as React from "react"
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/file"
import { cn } from "@/lib/utils"

type FileDropzoneProps = {
  value: File[]
  onChange: (files: File[]) => void
  accept?: string
  /** 单个文件大小上限，字节 */
  maxSize?: number
  maxCount?: number
  hint?: string
  title?: string
  disabled?: boolean
  className?: string
}

/**
 * accept 同时支持扩展名（.xlsx）与 MIME（application/vnd...），
 * 拖拽进来的文件浏览器不会自动过滤，只能在这里挡。
 */
function matchesAccept(file: File, accept?: string) {
  if (accept === undefined || accept.trim() === "") return true
  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== "")
  if (tokens.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token)
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1))
    return type !== "" && type === token
  })
}

/** 把 accept 转成给用户看的格式说明 */
function describeAccept(accept?: string) {
  if (accept === undefined) return "指定格式"
  const extensions = accept
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.startsWith("."))
  return extensions.length > 0 ? extensions.join("、") : "指定格式"
}

/** 支持点击与拖拽的文件选择区，替代旧版 antd Upload.Dragger */
export function FileDropzone({
  value,
  onChange,
  accept,
  maxSize,
  maxCount = 1,
  hint,
  title = "点击或将文件拖入此处上传",
  disabled,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const accepted: File[] = []
    const rejected: string[] = []
    for (const file of Array.from(files)) {
      if (!matchesAccept(file, accept)) {
        rejected.push(`${file.name}：格式不支持，仅接受 ${describeAccept(accept)}`)
        continue
      }
      if (maxSize !== undefined && file.size > maxSize) {
        rejected.push(
          `${file.name}：${formatFileSize(file.size)} 超过上限 ${formatFileSize(maxSize)}`
        )
        continue
      }
      accepted.push(file)
    }
    if (rejected.length > 0) {
      toast.error("以下文件没有被添加", { description: rejected.join("；") })
    }
    if (accepted.length === 0) return
    onChange([...value, ...accepted].slice(-maxCount))
  }

  return (
    <div className={cn("space-y-3", className)}>
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
          if (!disabled) addFiles(event.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-accent/40",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <UploadCloudIcon className="text-primary size-8" />
        <p className="text-sm font-medium">{title}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        multiple={maxCount > 1}
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ""
        }}
      />

      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="bg-muted/50 flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <FileIcon className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="移除文件"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <XIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
