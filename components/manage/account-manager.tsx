"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import {
  CircleCheckIcon,
  FileDownIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { FileDropzone } from "@/components/common/file-dropzone"
import { EmptyState } from "@/components/common/states"
import { useLoadState } from "@/lib/hooks/use-load-state"
import { saveBlob } from "@/lib/file"
import {
  MAX_IMPORT_ROWS,
  REQUIRED_COLUMNS,
  checkAccountWorkbook,
  formatIssue,
  type ImportCheckResult,
} from "@/lib/import-accounts"
import { isPhone, isStudentCode, PHONE_MESSAGE, STUDENT_CODE_MESSAGE } from "@/lib/validation"

export type AccountRecord = {
  code: string
  name: string
  contact: string
}

export type AccountRow = {
  code: string
  password: string
}

type ApiResult<T = unknown> = {
  data: {
    success: boolean
    data?: T
    errMsg?: string
  }
}

export type AccountManagerProps = {
  title: string
  description: string
  entity: string
  emptyIcon: React.ComponentType<{ className?: string }>
  listAccounts: (pageNum: number, pageSize: number) => Promise<ApiResult<{ records: AccountRecord[]; total: number }>>
  createAccount: (data: AccountRecord & { password: string }) => Promise<ApiResult>
  editAccount: (data: AccountRecord & { password?: string }) => Promise<ApiResult>
  deleteAccount: (code: string) => Promise<ApiResult>
  importAccount: (file: File) => Promise<ApiResult<AccountRow[]>>
}

/** 共用的新增 / 编辑账号表单弹窗 */
function AccountFormDialog({
  entity,
  open,
  editing,
  onOpenChange,
  onSaved,
  createAccount,
  editAccount,
}: {
  entity: string
  open: boolean
  editing: AccountRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  createAccount: (data: AccountRecord & { password: string }) => Promise<ApiResult>
  editAccount: (data: AccountRecord & { password?: string }) => Promise<ApiResult>
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
    const nextErrors: Record<string, string> = {}
    if (!values.code.trim()) nextErrors.code = "请输入学号"
    else if (!isStudentCode(values.code)) nextErrors.code = STUDENT_CODE_MESSAGE
    if (!values.name.trim()) nextErrors.name = "请输入姓名"
    if (!values.contact.trim()) nextErrors.contact = "请输入联系方式"
    else if (!isPhone(values.contact)) nextErrors.contact = PHONE_MESSAGE
    if (!isEdit && values.password.length < 6) nextErrors.password = "密码至少 6 位"
    if (isEdit && values.password && values.password.length < 6) nextErrors.password = "密码至少 6 位"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const res = isEdit
        ? await editAccount({
            code: values.code,
            name: values.name.trim(),
            contact: values.contact.trim(),
            ...(values.password ? { password: values.password } : {}),
          })
        : await createAccount({
            code: values.code.trim(),
            name: values.name.trim(),
            contact: values.contact.trim(),
            password: values.password,
          })
      if (res.data.success) {
        toast.success(`😸 已${isEdit ? "更新" : "新增"}`)
        onSaved()
        onOpenChange(false)
      } else {
        toast.error("😭 保存失败", { description: res.data.errMsg ?? "请检查填写信息后重试" })
      }
    } catch {
      toast.error("😭 保存失败", { description: "网络异常，请稍后重试" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `编辑${entity}` : `新增${entity}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `修改姓名与联系方式，学号不可改，密码留空则不重置。`
              : `直接录入单个${entity}账号，无需导入 Excel。`}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor={`form-${entity}-code`}>学号</Label>
            <Input
              id={`form-${entity}-code`}
              value={values.code}
              disabled={isEdit}
              placeholder="如 B21021021"
              aria-invalid={Boolean(errors.code)}
              onChange={setField("code")}
            />
            {errors.code ? <p className="text-destructive text-xs">{errors.code}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`form-${entity}-name`}>姓名</Label>
            <Input
              id={`form-${entity}-name`}
              value={values.name}
              placeholder="请输入姓名"
              aria-invalid={Boolean(errors.name)}
              onChange={setField("name")}
            />
            {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`form-${entity}-contact`}>联系方式</Label>
            <Input
              id={`form-${entity}-contact`}
              value={values.contact}
              inputMode="tel"
              placeholder="请输入手机号"
              aria-invalid={Boolean(errors.contact)}
              onChange={setField("contact")}
            />
            {errors.contact ? <p className="text-destructive text-xs">{errors.contact}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`form-${entity}-password`}>
              {isEdit ? "重置密码（选填）" : "初始密码"}
            </Label>
            <Input
              id={`form-${entity}-password`}
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

/** 共用的表格行操作菜单 */
function RowMenu({
  account,
  onEdit,
  onDelete,
}: {
  account: AccountRecord
  onEdit: (account: AccountRecord) => void
  onDelete: (account: AccountRecord) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="更多操作">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => onEdit(account)}>
          <PencilIcon className="size-4" />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(account)}>
          <Trash2Icon className="size-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** 生成账号导入模板 */
function generateExcelFile(entity: string) {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([[REQUIRED_COLUMNS[0], REQUIRED_COLUMNS[1], REQUIRED_COLUMNS[2]]])
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
  const wbout = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
  saveBlob(new Blob([wbout], { type: "application/octet-stream" }), `${entity}导入模板.xlsx`)
}

/** 把返回的账号密码导出为 Excel */
function downloadExcelFile(data: AccountRow[], entity: string) {
  if (!data || data.length === 0) {
    toast.error("没有可导出的数据")
    return
  }
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([[entity, "密码"]])
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
  data.forEach((row, index) => {
    XLSX.utils.sheet_add_aoa(worksheet, [[row.code, row.password]], {
      origin: `A${index + 2}`,
    })
  })
  const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
  saveBlob(new Blob([excelBuffer], { type: "application/octet-stream" }), `${entity}账号密码.xlsx`)
}

/** 共用的账号导入弹窗 */
function AccountImportDialog({
  entity,
  open,
  onOpenChange,
  onImported,
  importAccount,
}: {
  entity: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
  importAccount: (file: File) => Promise<unknown>
}) {
  const [fileList, setFileList] = React.useState<File[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [check, setCheck] = React.useState<ImportCheckResult | null>(null)

  const blocked = check === null || check.issues.length > 0 || check.rows.length === 0

  const handleFileChange = async (files: File[]) => {
    setFileList(files)
    setCheck(null)
    if (files.length === 0) return
    setChecking(true)
    try {
      const result = checkAccountWorkbook(await files[0].arrayBuffer())
      setCheck(result)
      if (result.issues.length > 0) {
        toast.error(`表格有 ${result.issues.length} 处问题`, {
          description: "请按提示修改后重新上传",
        })
      } else {
        toast.success(`校验通过，共 ${result.rows.length} 条记录`)
      }
    } catch {
      setCheck({
        rows: [],
        issues: [{ message: "文件读取失败，请确认文件没有损坏后重试" }],
        blankRows: 0,
        total: 0,
      })
    } finally {
      setChecking(false)
    }
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      toast.error("请先选择要导入的 Excel 文件")
      return
    }
    if (check === null) {
      toast.error("表格还在校验中，请稍候")
      return
    }
    if (check.issues.length > 0 || check.rows.length === 0) {
      toast.error("表格校验未通过，请修正后重新上传")
      return
    }
    setUploading(true)
    try {
      const res = await importAccount(fileList[0])
      const result = res as ApiResult<AccountRow[]>
      if (result.data?.success === true) {
        const rows: AccountRow[] = result.data.data ?? []
        downloadExcelFile(rows, entity)
        toast.success("😸 导入成功", { description: `共生成 ${rows.length} 个账号` })
        onImported()
        onOpenChange(false)
      } else {
        toast.error("😭 导入失败", { description: result.data?.errMsg ?? "后端没有返回具体原因" })
      }
    } catch (error) {
      notifyRequestError(error, "😭 导入失败", { description: "请稍后重试" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导入{entity}</DialogTitle>
          <DialogDescription>
            从 Excel 批量创建{entity}账号，第一行需为「{REQUIRED_COLUMNS.join("」「")}」，单次最多{" "}
            {MAX_IMPORT_ROWS} 条。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FileDropzone
            value={fileList}
            onChange={handleFileChange}
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            maxSize={5 * 1024 * 1024}
            maxCount={1}
            title="点击或拖拽上传账号表格"
            hint="仅支持 xlsx、xls 格式的单个文件，选完会先在本地校验"
            disabled={uploading || checking}
          />

          {checking ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              正在校验表格内容…
            </p>
          ) : null}

          {check !== null && check.issues.length === 0 ? (
            <Alert>
              <CircleCheckIcon />
              <AlertTitle>校验通过，可以导入</AlertTitle>
              <AlertDescription>
                共 {check.rows.length} 条记录
                {check.blankRows > 0 ? `，已跳过 ${check.blankRows} 行空白` : ""}。
              </AlertDescription>
            </Alert>
          ) : null}

          {check !== null && check.issues.length > 0 ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>表格有 {check.issues.length} 处问题，修正后重新上传</AlertTitle>
              <AlertDescription>
                <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-4">
                  {check.issues.slice(0, 50).map((issue, index) => (
                    <li key={`${issue.row ?? "file"}-${issue.column ?? ""}-${index}`}>
                      {formatIssue(issue)}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => generateExcelFile(entity)}>
              <FileDownIcon className="size-4" />
              下载模板
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading || checking || fileList.length === 0 || blocked}
            >
              {uploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <UploadIcon className="size-4" />
              )}
              开始导入
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** 共用的账号管理主组件 */
export default function AccountManager({
  title,
  description,
  entity,
  emptyIcon,
  listAccounts,
  createAccount,
  editAccount,
  deleteAccount,
  importAccount,
}: AccountManagerProps) {
  const [pageState, setPageState] = React.useState({ pageNumber: 1, pageSize: 10, total: 0 })
  const [records, setRecords] = React.useState<AccountRecord[]>([])
  const [dialog, setDialog] = React.useState<{
    open: boolean
    editing: AccountRecord | null
    nonce: number
  }>({ open: false, editing: null, nonce: 0 })
  const [deleteTarget, setDeleteTarget] = React.useState<AccountRecord | null>(null)
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
    listAccounts(pageState.pageNumber, pageState.pageSize)
      .then((res) => {
        if (cancelled) return
        setRecords(res.data.data?.records ?? [])
        setPageState((prev) => ({ ...prev, total: res.data.data?.total ?? 0 }))
      })
      .catch((error) => {
        if (!cancelled) {
          setRecords([])
          notifyRequestError(error, "😭 请求失败", { description: `${entity}列表加载失败，请稍后重试` })
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
  const openEdit = (account: AccountRecord) =>
    setDialog((prev) => ({ open: true, editing: account, nonce: prev.nonce + 1 }))
  const openImport = () => setImportDialog((prev) => ({ open: true, nonce: prev.nonce + 1 }))

  const submitDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteAccount(deleteTarget.code)
      if (res.data.success) {
        toast.success("😸 已删除", { description: `${deleteTarget.name} 的账号已删除` })
        setDeleteTarget(null)
        reload()
      } else {
        toast.error("😭 删除失败", { description: res.data.errMsg ?? "请稍后重试" })
      }
    } catch {
      toast.error("😭 删除失败", { description: "网络异常，请稍后重试" })
    } finally {
      setDeleting(false)
    }
  }

  const empty = (
    <EmptyState
      icon={emptyIcon}
      title={`暂无${entity}账号`}
      description={`现在还没有${entity}账号，点右上角「新增${entity}」直接录入一个吧！`}
      action={
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          新增{entity}
        </Button>
      }
    />
  )

  return (
    <PageContainer size="wide">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" onClick={openImport}>
              <UploadIcon className="size-4" />
              导入{entity}
            </Button>
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              新增{entity}
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
                  {records.map((item) => (
                    <TableRow key={item.code}>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {(pageState.pageNumber - 1) * pageState.pageSize +
                          records.indexOf(item) +
                          1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.contact || "—"}</TableCell>
                      <TableCell className="text-right">
                        <RowMenu
                          account={item}
                          onEdit={openEdit}
                          onDelete={setDeleteTarget}
                        />
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
                  trailing={
                    <RowMenu
                      account={item}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                    />
                  }
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

      <AccountFormDialog
        key={dialog.nonce}
        entity={entity}
        open={dialog.open}
        editing={dialog.editing}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        onSaved={reload}
        createAccount={createAccount}
        editAccount={editAccount}
      />

      <AccountImportDialog
        key={importDialog.nonce}
        entity={entity}
        open={importDialog.open}
        onOpenChange={(open) => setImportDialog((prev) => ({ ...prev, open }))}
        onImported={reload}
        importAccount={importAccount}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该{entity}？</AlertDialogTitle>
            <AlertDialogDescription>
              删除「{deleteTarget?.name}（{deleteTarget?.code}）」后，该账号将无法登录系统，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? <Loader2Icon className="size-4 animate-spin" /> : null}确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}