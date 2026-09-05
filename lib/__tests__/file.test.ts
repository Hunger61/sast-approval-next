import { formatFileSize, getFileNameFromUrl, getOriginalFileName } from "@/lib/file"

describe("文件工具", () => {
  it("从对象存储 url 还原用户上传的原始文件名", () => {
    // 旧版规则：去掉 "时间戳-随机数-" 前缀，并丢弃查询串
    expect(getOriginalFileName("https://cdn.example.com/1712-8899-申报书.pdf?sign=abc")).toBe(
      "申报书.pdf"
    )
    expect(getOriginalFileName("https://cdn.example.com/1712-8899-my-report-v2.pdf")).toBe(
      "my-report-v2.pdf"
    )
  })

  it("从 url 截取文件名并解码", () => {
    expect(getFileNameFromUrl("https://cdn.example.com/a/b/%E9%99%84%E4%BB%B6.zip?x=1")).toBe(
      "附件.zip"
    )
  })

  it("格式化文件大小", () => {
    expect(formatFileSize(512)).toBe("512 B")
    expect(formatFileSize(2048)).toBe("2.0 KB")
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB")
  })
})
