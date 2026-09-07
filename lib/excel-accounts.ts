"use client"

import { toast } from "sonner"
import { saveBlob } from "@/lib/file"
import { REQUIRED_COLUMNS } from "@/lib/import-accounts"

/** 账号表格的账号 / 初始密码行，后端只在导入成功时返回一次 */
export type AccountRow = { code: string; password: string }

/** 账号表格接受的扩展名与 MIME */
export const ACCOUNT_FILE_TYPES = [
  ".xlsx",
  ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]

/** 单个表格大小上限 */
export const MAX_ACCOUNT_FILE_SIZE = 5 * 1024 * 1024

/** 问题列表最多展示多少条，避免几百行错误撑爆页面 */
export const MAX_VISIBLE_ISSUES = 50

/**
 * xlsx 有 1MB 上下，只有真正导出 / 解析表格时才需要，
 * 按需加载避免它进入页面首屏的 chunk。
 */
async function loadXlsx() {
  return import("xlsx")
}

/** 生成账号导入模板，表头与 checkAccountWorkbook 校验的列保持同一份定义 */
export async function downloadAccountTemplate() {
  const XLSX = await loadXlsx()
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([[...REQUIRED_COLUMNS]])
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
  const wbout = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
  saveBlob(new Blob([wbout], { type: "application/octet-stream" }), "template.xlsx")
}

/** 把返回的账号密码导出为 Excel */
export async function downloadAccountPasswords(data: AccountRow[]) {
  if (!data || data.length === 0) {
    toast.error("没有可导出的数据")
    return
  }
  const XLSX = await loadXlsx()
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
