// 深色模式初始化（独立文件，避免 CSP 需要放开内联脚本）
if (new URLSearchParams(window.location.search).get('mode') === 'dark') {
  document.documentElement.classList.add('dark')
  if (/android/i.test(navigator.userAgent)) {
    document.documentElement.classList.add('android')
  }
}
