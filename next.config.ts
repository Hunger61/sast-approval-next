import createNextIntlPlugin from "next-intl/plugin"
import type { NextConfig } from "next"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const isProd = process.env.NODE_ENV === "production"
const isDev = process.env.NODE_ENV === "development"

const internalHost = process.env.TAURI_DEV_HOST || "localhost"
// 开发服务器端口可能被占用而自动切换，assetPrefix 必须跟随实际端口
const devPort = process.env.PORT || "3000"

/** 后端地址，开发时通过 rewrites 代理，规避浏览器跨域 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || "https://approve.sast.fun/api"

// Enable static export for Tauri production builds.
// This makes `pnpm build` generate the `out/` directory that Tauri loads from `src-tauri/tauri.conf.json` (frontendDist: "../out").
const nextConfig: NextConfig = {
  output: "export",
  // Note: This feature is required to use the Next.js Image component in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix or else the server won't properly resolve your assets.
  assetPrefix: isProd ? undefined : `http://${internalHost}:${devPort}`,
  // 静态导出不支持 rewrites，仅在 `next dev` 下启用接口代理。
  ...(isDev
    ? {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${API_ORIGIN}/:path*`,
            },
          ]
        },
      }
    : {}),
}

export default withNextIntl(nextConfig)
