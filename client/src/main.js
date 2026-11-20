import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Element Plus 组件由 unplugin-vue-components 按需引入（见 vite.config.js）
// ElMessage / ElMessageBox 是在 script 里手动 import 的，插件不会处理，需单独引入样式
import 'element-plus/theme-chalk/base.css' // CSS 变量（App.vue 等全局样式依赖 --el-*）
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
// 只注册实际用到的图标（Login.vue 里 prefix-icon="User" 这种字符串写法依赖全局注册）
import {
  ArrowLeft,
  Document,
  FolderOpened,
  Lock,
  Picture,
  Plus,
  PriceTag,
  Refresh,
  Search,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
import './style.css'

// 检测 URL 参数 mode=dark，启用暗色主题
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('mode') === 'dark') {
  document.documentElement.classList.add('dark')
}

const app = createApp(App)

const icons = { ArrowLeft, Document, FolderOpened, Lock, Picture, Plus, PriceTag, Refresh, Search, SwitchButton, User }
for (const [name, component] of Object.entries(icons)) {
  app.component(name, component)
}

app.use(createPinia())
app.use(router)

app.mount('#app')
