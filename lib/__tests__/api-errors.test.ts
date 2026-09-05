import { AxiosError, AxiosHeaders } from "axios"
import { toast } from "sonner"
import {
  NETWORK_ERROR_TITLE,
  TIMEOUT_ERROR_TITLE,
  isNetworkError,
  markNetworkErrorNotified,
  notifyRequestError,
} from "@/lib/api/errors"

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), dismiss: jest.fn() },
}))

const config = { headers: new AxiosHeaders() }

/** DNS 解析失败：浏览器里表现为没有 response 的 ERR_NETWORK */
function dnsError() {
  return new AxiosError("Network Error", "ERR_NETWORK", config)
}

describe("请求错误分类", () => {
  it("把没有响应的请求判定为网络层错误", () => {
    expect(isNetworkError(dnsError())).toBe(true)
    expect(isNetworkError(new AxiosError("timeout", "ECONNABORTED", config))).toBe(true)
    // 原生 fetch 在 DNS 解析失败时抛 TypeError
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true)
  })

  it("拿到响应的业务错误与主动取消不算网络层错误", () => {
    const serverError = new AxiosError("Bad Request", "ERR_BAD_REQUEST", config, undefined, {
      status: 400,
      statusText: "Bad Request",
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    expect(isNetworkError(serverError)).toBe(false)
    expect(isNetworkError(new AxiosError("canceled", "ERR_CANCELED", config))).toBe(false)
  })
})

describe("请求失败提示", () => {
  it("网络层错误提示更换网络环境，而不是联系管理员", () => {
    notifyRequestError(dnsError(), "😞 下载发生了错误，请联系管理员", { id: "downloading" })
    expect(toast.error).toHaveBeenCalledWith(
      NETWORK_ERROR_TITLE,
      expect.objectContaining({ description: expect.stringContaining("更换网络环境") })
    )
  })

  it("超时使用单独的文案", () => {
    notifyRequestError(new AxiosError("timeout", "ECONNABORTED", config), "😭 请求失败")
    expect(toast.error).toHaveBeenCalledWith(TIMEOUT_ERROR_TITLE, expect.anything())
  })

  it("业务错误沿用调用方文案", () => {
    notifyRequestError(new Error("boom"), "😭 请求失败", { id: "download" })
    expect(toast.error).toHaveBeenCalledWith("😭 请求失败", {
      id: "download",
      description: undefined,
    })
  })

  it("拦截器已提示过时不再重复弹窗，只收掉 loading", () => {
    const error = dnsError()
    markNetworkErrorNotified(error)
    notifyRequestError(error, "😭 请求失败", { id: "download" })
    expect(toast.error).not.toHaveBeenCalled()
    expect(toast.dismiss).toHaveBeenCalledWith("download")
  })
})
