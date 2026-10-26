import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// 生产构建注入 CSP（GitHub Pages 无法设置响应头，只能用 meta）
// 开发环境不注入，避免影响 HMR
function cspPlugin(apiBase) {
  // 未配置 VITE_API_BASE 时放宽为 https:，避免拦截接口请求
  const apiOrigin = apiBase ? new URL(apiBase).origin : 'https:'
  if (!apiBase) console.warn('[csp] 未配置 VITE_API_BASE，connect-src 放宽为 https:')
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // Element Plus / 富文本使用内联样式
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`.trim(),
    'frame-src https:',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }]
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [vue(), cspPlugin(loadEnv(mode, process.cwd()).VITE_API_BASE)],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
}))
