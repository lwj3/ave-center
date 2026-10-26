import DOMPurify from 'dompurify'

/**
 * 富文本 XSS 过滤
 * 后台被入侵或接口被滥用时，文章内容可能被写入恶意脚本，渲染前必须过滤
 */

// 富文本中的 iframe（视频嵌入）只允许 https
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    const src = node.getAttribute('src') || ''
    if (!/^https:\/\//i.test(src)) node.remove()
  }
})

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // 新窗口打开的链接防止 opener 劫持
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
  if (node.tagName === 'IFRAME') {
    node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation')
  }
})

export function sanitizeHtml(html) {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allowfullscreen', 'frameborder'],
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
  })
}

/**
 * URL 协议白名单：只允许 http(s)、站内相对路径、图片 data/blob
 * 拦截 javascript:、vbscript: 等协议
 */
export function safeUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const value = url.trim()
  if (/^(https?:)?\/\//i.test(value)) return value
  if (/^\/(?!\/)/.test(value)) return value
  if (/^(data:image\/(png|jpe?g|gif|webp);|blob:)/i.test(value)) return value
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return value // 无协议的相对路径
  return ''
}
