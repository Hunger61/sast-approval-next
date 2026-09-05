"use client"

import * as React from "react"
import {
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
import { saveBlob } from "@/lib/file"

type AccountRow = { code: string; password: string }

const FILE_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]

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
  const [data, setData] = React.useState<AccountRow[]>([])

  const handleUpload = async () => {
    if (fileList.length === 0) {
      toast.error("请先选择要导入的 Excel 文件")
      return
    }
    setUploading(true)
    try {
      const res = await importAccountsFromExcel(fileList[0])
      if (res.data?.success === true) {
        const rows: AccountRow[] = res.data.data ?? []
        setData(rows)
        downloadExcelFile(rows)
        toast.success("😸 导入成功", { description: `共生成 ${rows.length} 个账号` })
      } else {
        toast.error("😭 导入失败", { description: res.data?.errMsg ?? "" })
      }
    } catch {
      toast.error("😭 导入失败", { description: "请检查网络与文件格式后重试" })
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
          description="表格需包含「学号」「姓名」「联系方式」三列，可先下载模板后填写。"
        >
          <div className="space-y-4">
            <FileDropzone
              value={fileList}
              onChange={setFileList}
              accept={FILE_TYPES.join(",")}
              maxCount={1}
              title="点击或拖拽上传账号表格"
              hint="仅支持 xlsx、xls 格式的单个文件"
              disabled={uploading}
            />
            <Button
              onClick={handleUpload}
              disabled={uploading || fileList.length === 0}
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
