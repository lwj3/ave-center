/**
 * 上传文件 URL 处理
 *
 * 约定：数据库里只存相对路径 /uploads/...，展示时再拼上当前后端域名（VITE_API_BASE）。
 * 这样后端换域名时只需改环境变量，不用改数据。
 *
 * 历史数据里可能写死了旧域名（富文本里的图片等），展示时统一替换为当前域名。
 * 以后再换域名，把旧域名加到 LEGACY_API_ORIGINS 即可。
 *
 * 例：/uploads/images/xxx.png → https://api.ave-academy.org/uploads/images/xxx.png
 */
import { safeUrl } from './sanitize'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

// 曾经用过的后端域名（http / https 都会匹配）
const LEGACY_API_ORIGINS = [
  'ave-center-api.luweijun.com',
  'ave-center-end.luweijun.com',
]

// 所有需要识别为"本站上传文件"的域名：历史域名 + 当前域名
const KNOWN_HOSTS = [
  ...LEGACY_API_ORIGINS,
  API_BASE.replace(/^https?:\/\//, ''),
].filter(Boolean)

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 匹配 http(s)://<已知域名>/uploads/  →  /uploads/
const KNOWN_ORIGIN_UPLOADS_RE = KNOWN_HOSTS.length
  ? new RegExp(`https?://(?:${KNOWN_HOSTS.map(escapeRe).join('|')})(?=/uploads/)`, 'g')
  : null

/**
 * 去掉已知后端域名，只保留 /uploads/... 相对路径
 */
function stripKnownOrigins(str) {
  if (!str || !KNOWN_ORIGIN_UPLOADS_RE) return str
  return str.replace(KNOWN_ORIGIN_UPLOADS_RE, '')
}

/**
 * 处理单个 URL：已知域名 / 相对路径的上传文件，统一转为当前后端域名的绝对地址
 */
export function resolveUploadUrl(url) {
  url = safeUrl(url)
  if (!url) return url
  url = stripKnownOrigins(url)
  if (url.startsWith('/uploads/') || url.startsWith('/uploads\\')) {
    return API_BASE + url
  }
  return url
}

/**
 * 处理富文本 HTML：把上传文件的地址（含写死的旧域名）转为当前后端域名
 * 用于 v-html 渲染和加载到编辑器
 */
export function resolveHtmlUploadUrls(html) {
  if (!html) return html
  return stripKnownOrigins(html).replace(
    /(\s(?:src|poster|href|data-href))=["']\/(uploads\/[^"']+)["']/g,
    `$1="${API_BASE}/$2"`
  )
}

/**
 * 保存前调用：把富文本里的上传文件地址还原为相对路径 /uploads/...
 * 避免把域名写死进数据库
 */
export function toRelativeUploadUrls(html) {
  return stripKnownOrigins(html)
}
