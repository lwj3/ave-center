<template>
  <div class="admin-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="220px" class="admin-aside">
        <div class="aside-header">
          <h2 class="aside-title">
            <img src="https://ave.ai/_nuxt/avedex_mobile_logo.DN0XNEWA.webp"/> &nbsp;
            AVE学院
          </h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          class="admin-menu"
        >
          <el-menu-item index="/admin/articles">
            <el-icon><Document /></el-icon>
            <span>文章管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/categories">
            <el-icon><FolderOpened /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/tags">
            <el-icon><PriceTag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/carousels">
            <el-icon><Picture /></el-icon>
            <span>轮播管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/files">
            <el-icon><FolderOpened /></el-icon>
            <span>文件管理</span>
          </el-menu-item>
        </el-menu>
        <div class="aside-footer">
          <router-link to="/" class="back-link">← 返回前台</router-link>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header class="admin-header">
          <span class="header-breadcrumb">{{ pageTitle }}</span>
          <div class="header-right">
            <span class="admin-name">{{ adminStore.adminInfo?.nickname || '管理员' }}</span>
            <el-button link type="danger" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>
        </el-header>
        <el-main class="admin-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAdminStore } from '../../store/admin'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const activeMenu = computed(() => {
  const path = route.path
  if (path.includes('/admin/articles') || path.includes('/admin/article/edit')) {
    return '/admin/articles'
  }
  return path
})

const pageTitle = computed(() => {
  const map = {
    '/admin/articles': '文章管理',
    '/admin/categories': '分类管理',
    '/admin/tags': '标签管理',
    '/admin/carousels': '轮播管理',
    '/admin/files': '文件管理',
  }
  if (route.path.includes('/admin/article/edit')) {
    return route.params.id ? '编辑文章' : '新建文章'
  }
  return map[route.path] || '管理后台'
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    adminStore.logout()
    router.push('/login')
  } catch (err) {
    // 用户取消
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.admin-layout :deep(.el-container) {
  height: 100%;
}

.admin-aside {
  background: linear-gradient(135deg, #0f3460 0%, #409EFF  100%);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.aside-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.aside-title {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.aside-title img{
  width: 30px;
  height: 30px;
}

.admin-menu {
  flex: 1;
  border-right: none;
  background: transparent;
}

.admin-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
}

.admin-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: #409EFF !important;
  color: #fff;
}

.aside-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #fff;
}

.admin-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
}

.header-breadcrumb {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.admin-name {
  font-size: 14px;
  color: #606266;
}

.admin-main {
  background: #f5f7fa;
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}
</style>
