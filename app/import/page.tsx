"use client"

import * as React from "react"
import {
  CircleCheckIcon,
  DownloadIcon,
  FileDownIcon,
  Loader2Icon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageContainer, PageHeader } from "@/components/common/page-header"
import { Section, SectionList } from "@/components/common/section"
import { TableSurface } from "@/components/common/data-list"
import { EmptyState } from "@/components/common/states"
import { FileDropzone } from "@/components/common/file-dropzone"
import { importAccountsFromExcel } from "@/lib/api/judge"
import { notifyRequestError } from "@/lib/api/errors"
import { saveBlob } from "@/lib/file"
import {
  MAX_IMPORT_ROWS,
  REQUIRED_COLUMNS,
  type ImportCheckResult,
  checkAccountWorkbook,
  formatIssue,
} from "@/lib/import-accounts"

type AccountRow = { code: string; password: string }

const FILE_TYPES = [
  ".xlsx",
  ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]

/** 单个表格大小上限 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/** 问题列表最多展示多少条，避免几百行错误撑爆页面 */
const MAX_VISIBLE_ISSUES = 50

/** 生成账号导入模板 */
function generateExcelFile() {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([["学号", "姓名", "联系方式"]])
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
  const wbout = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
  saveBlob(new Blob([wbout], { type: "application/octet-stream" }), "template.xlsx")
}

/** 把返回的账号密码导出为 Excel */
function downloadExcelFile(data: AccountRow[]) {
  if (!data || data.length === 0) {
    toast.error("没有可导出的数据")
    return
  }
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([["账号", "密码"]])
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
  data.forEach((row, index) => {
    XLSX.utils.sheet_add_aoa(worksheet, [[row.code, row.password]], {
      origin: `A${index + 2}`,
    })
  })
  const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
  saveBlob(new Blob([excelBuffer], { type: "application/octet-stream" }), "password.xlsx")
}

export default function ImportPage() {
  const [fileList, setFileList] = React.useState<File[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [check, setCheck] = React.useState<ImportCheckResult | null>(null)
  const [data, setData] = React.useState<AccountRow[]>([])

  const blocked = check === null || check.issues.length > 0 || check.rows.length === 0

  /** 选完文件立刻在本地解析并逐行校验，不合格就不让提交 */
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
          description: "请按下方提示修改后重新上传",
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
    if (check.issues.length > 0) {
      toast.error(`表格还有 ${check.issues.length} 处问题未修正`, {
        description: "修好后重新上传即可导入",
      })
      return
    }
    if (check.rows.length === 0) {
      toast.error("表格里没有可导入的数据")
      return
    }
    setUploading(true)
    try {
      const res = await importAccountsFromExcel(fileList[0])
      if (res.data?.success === true) {
        const rows: AccountRow[] = res.data.data ?? []
        setData(rows)
        downloadExcelFile(rows)
        setFileList([])
        setCheck(null)
        toast.success("😸 导入成功", { description: `共生成 ${rows.length} 个账号` })
      } else {
        toast.error("😭 导入失败", { description: res.data?.errMsg ?? "后端没有返回具体原因" })
      }
    } catch (error) {
      notifyRequestError(error, "😭 导入失败", { description: "请稍后重试" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        title="一键导入"
        description="从 Excel 表格批量创建评委账号，导入完成后自动导出账号与初始密码。"
        actions={
          <Button variant="outline" onClick={generateExcelFile}>
            <FileDownIcon className="size-4" />
            下载模板
          </Button>
        }
      />

      <SectionList className="mt-8">
        <Section
          title="1. 上传账号表格"
          description={`表格第一行需为「${REQUIRED_COLUMNS.join("」「")}」，单次最多 ${MAX_IMPORT_ROWS} 条，可先下载模板后填写。`}
        >
          <div className="space-y-4">
            <FileDropzone
              value={fileList}
              onChange={handleFileChange}
              accept={FILE_TYPES.join(",")}
              maxSize={MAX_FILE_SIZE}
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
                  <div className="space-y-2">
                    <p>
                      共检查 {check.total} 行，其中 {check.rows.length} 行没有问题
                      {check.blankRows > 0 ? `，另跳过 ${check.blankRows} 行空白` : ""}。
                    </p>
                    <ul className="max-h-64 list-disc space-y-1 overflow-y-auto pl-4">
                      {check.issues.slice(0, MAX_VISIBLE_ISSUES).map((issue, index) => (
                        <li key={`${issue.row ?? "file"}-${issue.column ?? ""}-${index}`}>
                          {formatIssue(issue)}
                        </li>
                      ))}
                    </ul>
                    {check.issues.length > MAX_VISIBLE_ISSUES ? (
                      <p>还有 {check.issues.length - MAX_VISIBLE_ISSUES} 处问题未列出。</p>
                    ) : null}
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              onClick={handleUpload}
              disabled={uploading || checking || fileList.length === 0 || blocked}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <UploadIcon className="size-4" />
              )}
              开始导入
            </Button>
          </div>
        </Section>

        <Section
          title="2. 生成的账号"
          description="导入成功后会自动下载密码表，也可以在这里重新导出。"
          actions={
            data.length > 0 ? (
              <Button variant="outline" size="sm" onClick={() => downloadExcelFile(data)}>
                <DownloadIcon className="size-4" />
                导出 Excel
              </Button>
            ) : null
          }
        >
          <div className="space-y-4">
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>请及时保存账号数据</AlertTitle>
              <AlertDescription>
                页面关闭后将无法再次下载历史数据，请务必妥善保管导出的密码表格。
              </AlertDescription>
            </Alert>

            {data.length === 0 ? (
              <EmptyState
                title="还没有导入记录"
                description="上传表格并导入后，生成的账号会显示在这里。"
                className="min-h-40 rounded-xl border border-dashed"
              />
            ) : (
              <TableSurface>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>账号</TableHead>
                      <TableHead>密码</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={`${row.code}-${index}`}>
                        <TableCell className="font-mono">{row.code}</TableCell>
                        <TableCell className="font-mono">{row.password}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableSurface>
            )}
          </div>
        </Section>
      </SectionList>
    </PageContainer>
  )
}
