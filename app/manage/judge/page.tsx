"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  UserCogIcon,
} from "lucide-react"
import { toast } from "sonner"
import { notifyRequestError } from "@/lib/api/errors"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageContainer, PageHeader } from "@/components/common/page-header"
import { DataPagination } from "@/components/common/data-pagination"
import { IndexBadge, MobileList, MobileListItem, TableSurface } from "@/components/common/data-list"
import { EmptyState } from "@/components/common/states"
import { useLoadState } from "@/lib/hooks/use-load-state"
import {
  createJudgeAccount,
  deleteJudgeAccount,
  editJudgeAccount,
  getJudgeAccountList,
} from "@/lib/api/admin"
import { validateJudgeForm } from "@/lib/validation"
import type { JudgeAccount } from "@/lib/types/api"

/**
 * 导入弹窗会把 xlsx（约 1MB）与表格校验一起拉进来，而评委列表本身用不到，
 * 按需加载，避免它进入 /manage/judge 的首屏 chunk。
 */
const JudgeImportDialog = dynamic(
  () => import("@/components/competition/judge-import-dialog").then((mod) => mod.JudgeImportDialog),
  { ssr: false }
)

/** 新增 / 编辑评委的表单弹窗，用 key 强制重挂载来重置表单，避免在 effect 里同步 setState */
function JudgeFormDialog({
  open,
  editing,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  editing: JudgeAccount | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const isEdit = editing !== null
  const [values, setValues] = React.useState({
    code: editing?.code ?? "",
    name: editing?.name ?? "",
    contact: editing?.contact ?? "",
    password: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)

  const setField = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validateJudgeForm(values, isEdit)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const res = isEdit
        ? await editJudgeAccount({
            code: values.code,
            name: values.name.trim(),
            contact: values.contact.trim(),
            ...(values.password ? { password: values.password } : {}),
          })
        : await createJudgeAccount({
            code: values.code.trim(),
            name: values.name.trim(),
            contact: values.contact.trim(),
            password: values.password,
          })
      if (res.data.success) {
        toast.success(isEdit ? "😸 已更新" : "😸 已新增")
        onSaved()
        onOpenChange(false)
      } else {
        toast.error("😭 保存失败", { description: res.data.errMsg ?? "请检查填写信息后重试" })
      }
    } catch (error) {
      notifyRequestError(error, "😭 保存失败", { description: "请稍后重试" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑评委" : "新增评委"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改姓名与联系方式，学号不可改，密码留空则不重置。"
              : "直接录入单个评委账号，无需导入 Excel。"}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="judge-code">学号</Label>
            <Input
              id="judge-code"
              value={values.code}
              disabled={isEdit}
              placeholder="如 B21021021"
              aria-invalid={Boolean(errors.code)}
              onChange={setField("code")}
            />
            {errors.code ? <p className="text-destructive text-xs">{errors.code}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge-name">姓名</Label>
            <Input
              id="judge-name"
              value={values.name}
              placeholder="请输入姓名"
              aria-invalid={Boolean(errors.name)}
              onChange={setField("name")}
            />
            {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge-contact">联系方式</Label>
            <Input
              id="judge-contact"
              value={values.contact}
              inputMode="tel"
              placeholder="请输入手机号"
              aria-invalid={Boolean(errors.contact)}
              onChange={setField("contact")}
            />
            {errors.contact ? <p className="text-destructive text-xs">{errors.contact}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge-password">{isEdit ? "重置密码（选填）" : "初始密码"}</Label>
            <Input
              id="judge-password"
              type="password"
              value={values.password}
              autoComplete="new-password"
              placeholder={isEdit ? "留空则不修改" : "至少 6 位"}
              aria-invalid={Boolean(errors.password)}
              onChange={setField("password")}
            />
            {errors.password ? <p className="text-destructive text-xs">{errors.password}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2Icon className="size-4 animate-spin" /> : null}
              {isEdit ? "保存" : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RowMenu({
  account,
  onEdit,
  onDelete,
}: {
  account: JudgeAccount
  onEdit: (account: JudgeAccount) => void
  onDelete: (account: JudgeAccount) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="更多操作">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onSelect={() => requestAnimationFrame(() => onEdit(account))}>
          <PencilIcon className="size-4" />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => requestAnimationFrame(() => onDelete(account))}
        >
          <Trash2Icon className="size-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ManageJudgePage() {
  const [pageState, setPageState] = React.useState({ pageNumber: 1, pageSize: 10, total: 0 })
  const [records, setRecords] = React.useState<JudgeAccount[]>([])
  const [dialog, setDialog] = React.useState<{
    open: boolean
    editing: JudgeAccount | null
    nonce: number
  }>({ open: false, editing: null, nonce: 0 })
  const [deleteTarget, setDeleteTarget] = React.useState<JudgeAccount | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [importDialog, setImportDialog] = React.useState({ open: false, nonce: 0 })

  const {
    requestKey,
    loading: isLoading,
    markLoaded,
    reload,
  } = useLoadState(`${pageState.pageNumber}|${pageState.pageSize}`)

  React.useEffect(() => {
    let cancelled = false
    getJudgeAccountList(pageState.pageNumber, pageState.pageSize)
      .then((res) => {
        if (cancelled) return
        setRecords(res.data.data?.records ?? [])
        setPageState((prev) => ({ ...prev, total: res.data.data?.total ?? 0 }))
      })
      .catch((error) => {
        if (!cancelled) {
          setRecords([])
          notifyRequestError(error, "😭 请求失败", { description: "评委列表加载失败，请稍后重试" })
        }
      })
      .finally(() => {
        if (!cancelled) markLoaded(requestKey)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const openCreate = () =>
    setDialog((prev) => ({ open: true, editing: null, nonce: prev.nonce + 1 }))
  const openEdit = (account: JudgeAccount) =>
    setDialog((prev) => ({ open: true, editing: account, nonce: prev.nonce + 1 }))
  const openImport = () => setImportDialog((prev) => ({ open: true, nonce: prev.nonce + 1 }))

  const submitDelete = async (event: React.MouseEvent) => {
    // AlertDialogAction 默认点击即关闭，会让下面的 loading 态永远渲染不出来
    event.preventDefault()
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteJudgeAccount(deleteTarget.code)
      if (res.data.success) {
        toast.success("😸 已删除", { description: `${deleteTarget.name} 的账号已删除` })
        setDeleteTarget(null)
        reload()
      } else {
        toast.error("😭 删除失败", { description: res.data.errMsg ?? "请稍后重试" })
      }
    } catch (error) {
      notifyRequestError(error, "😭 删除失败", { description: "请稍后重试" })
    } finally {
      setDeleting(false)
    }
  }

  const empty = (
    <EmptyState
      icon={UserCogIcon}
      title="暂无评委账号"
      description="现在还没有评委账号，点右上角「新增评委」直接录入一个吧！"
      action={
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          新增评委
        </Button>
      }
    />
  )

  return (
    <PageContainer size="wide">
      <PageHeader
        title="评委管理"
        description="管理评委账号，直接在网页上新增、编辑、删除，无需导入 Excel。"
        actions={
          <>
            <Button variant="outline" onClick={openImport}>
              <UploadIcon className="size-4" />
              导入评委
            </Button>
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              新增评委
            </Button>
          </>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : records.length === 0 ? (
          empty
        ) : (
          <>
            {/* 桌面表格 */}
            <TableSurface className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead className="min-w-40">学号</TableHead>
                    <TableHead className="min-w-28">姓名</TableHead>
                    <TableHead className="min-w-40">联系方式</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((item, index) => (
                    <TableRow key={item.code}>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {(pageState.pageNumber - 1) * pageState.pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.contact || "—"}</TableCell>
                      <TableCell className="text-right">
                        <RowMenu account={item} onEdit={openEdit} onDelete={setDeleteTarget} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableSurface>

            {/* 手机列表 */}
            <MobileList className="md:hidden">
              {records.map((item, index) => (
                <MobileListItem
                  key={item.code}
                  leading={
                    <IndexBadge>
                      {(pageState.pageNumber - 1) * pageState.pageSize + index + 1}
                    </IndexBadge>
                  }
                  title={
                    <span className="flex items-center gap-2">
                      {item.name}
                      <span className="text-muted-foreground font-mono text-xs">{item.code}</span>
                    </span>
                  }
                  meta={<span className="font-mono">{item.contact || "—"}</span>}
                  trailing={<RowMenu account={item} onEdit={openEdit} onDelete={setDeleteTarget} />}
                />
              ))}
            </MobileList>
          </>
        )}
      </div>

      <DataPagination
        className="mt-6"
        current={pageState.pageNumber}
        pageSize={pageState.pageSize}
        total={pageState.total}
        onChange={(page) => setPageState((prev) => ({ ...prev, pageNumber: page }))}
      />

      <JudgeFormDialog
        key={dialog.nonce}
        open={dialog.open}
        editing={dialog.editing}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        onSaved={reload}
      />

      {/* 只在打开时挂载，导入相关的 chunk 才会真正开始下载 */}
      {importDialog.open ? (
        <JudgeImportDialog
          key={importDialog.nonce}
          open
          onOpenChange={(open) => setImportDialog((prev) => ({ ...prev, open }))}
          onImported={reload}
        />
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该评委？</AlertDialogTitle>
            <AlertDialogDescription>
              删除「{deleteTarget?.name}（{deleteTarget?.code}
              ）」后，该账号将无法登录系统，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={submitDelete} disabled={deleting}>
              {deleting ? <Loader2Icon className="size-4 animate-spin" /> : null}确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
