/**
 * 控制台彩蛋，沿用旧版 approval-system 的 SAST ASCII Logo 与项目地址。
 */
const BANNER = String.raw`
 ______     ______     ______     ______
/\  ___\   /\  __ \   /\  ___\   /\__  _\
\ \___  \  \ \  __ \  \ \___  \  \/_/\ \/
 \/\_____\  \ \_\ \_\  \/\_____\    \ \_\
  \/_____/   \/_/\/_/   \/_____/     \/_/
`

let printed = false

export function printConsoleBanner() {
  if (printed || typeof window === "undefined") return
  printed = true
  console.log(BANNER, "color:orange")
  console.log(
    "%c⭐️ 支持我们的项目： https://github.com/NJUPT-SAST/approval-system",
    "color:orange;font-size:20px"
  )
}
