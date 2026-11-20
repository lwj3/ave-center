// 深色模式初始化（独立文件，避免 CSP 需要放开内联脚本）
if (new URLSearchParams(window.location.search).get('mode') === 'dark') {
  document.documentElement.classList.add('dark')
  if (/android/i.test(navigator.userAgent)) {
    document.documentElement.classList.add('android')
  }
  // 页面默认声明 color-scheme: light only（阻止浏览器自动变暗），暗色模式下改回 dark
  var meta = document.querySelector('meta[name="color-scheme"]')
  if (meta) meta.setAttribute('content', 'dark')
}
