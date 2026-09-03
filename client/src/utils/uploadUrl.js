/**
 * 将相对路径的上传文件 URL 转换为绝对路径
 * 解决 GitHub Pages 等静态托管无法代理 /uploads/ 的问题
 *
 * 例：/uploads/images/xxx.png → https://ave-center-end.luweijun.com/uploads/images/xxx.png
 */
const API_BASE = import.meta.env.VITE_API_BASE || ''
const OLD_DOMAIN = 'https://ave-center-api.luweijun.com'

/**
 * 处理单个 URL：如果是 /uploads/ 开头，拼接后端域名；如果包含旧域名，替换为新域名
 */
export function resolveUploadUrl(url) {
  if (!url) return url
  if (url.startsWith(OLD_DOMAIN)) {
    return url.replace(OLD_DOMAIN, API_BASE)
  }
  if (url.startsWith('/uploads/') || url.startsWith('/uploads\\')) {
    return API_BASE + url
  }
  return url
}

/**
 * 处理富文本 HTML 内容：替换所有 /uploads/ 开头的资源路径
 * 用于 v-html 渲染的文章内容
 */
export function resolveHtmlUploadUrls(html) {
  if (!html) return html
  // 替换旧域名
  let result = html.replaceAll(OLD_DOMAIN, API_BASE)
  // 替换 src="/uploads/..." 和 src='/uploads/...'
  result = result.replace(
    /src=["']\/(uploads\/[^"]+)["']/g,
    `src="${API_BASE}/$1"`
  )
  // 替换 poster="/uploads/..." (视频封面)
  result = result.replace(
    /poster=["']\/(uploads\/[^"]+)["']/g,
    `poster="${API_BASE}/$1"`
  )
  return result
}
