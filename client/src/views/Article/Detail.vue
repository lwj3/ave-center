<template>
  <div class="article-detail-page">
    <!-- 顶部导航 -->
    <header class="site-header">
      <div class="container header-inner">
        <div class="logo" @click="$router.push('/')">
          <img style="width: 30px;" src="https://ave.ai/_nuxt/avedex_mobile_logo.DN0XNEWA.webp"/>
          <span class="logo-text">AVE学习中心</span>
        </div>
        <nav class="header-nav">
          <router-link to="/">首页</router-link>
          <router-link to="/admin">后台管理</router-link>
        </nav>
      </div>
    </header>

    <div class="container detail-container">
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="10" animated />
      </div>

      <template v-else-if="article">
        <!-- 文章头部 -->
        <article class="article-main">
          <div class="back-to-list">
            <el-button link @click="$router.back()" class="back-btn">
              <el-icon><ArrowLeft /></el-icon>
              返回列表
            </el-button>
          </div>
          <div class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="meta-author">{{ article.author }}</span>
              <span class="meta-category" v-if="article.category" @click="$router.push(`/articles?category_id=${article.category.id}&category_name=${encodeURIComponent(article.category.name)}`)" style="cursor:pointer">{{ article.category.name }}</span>
              <span class="meta-views">👁 {{ article.view_count }} 次阅读</span>
              <span class="meta-date">{{ formatDate(article.created_at) }}</span>
            </div>
            <div class="article-tags" v-if="article.tags && article.tags.length">
              <span
                v-for="tag in article.tags"
                :key="tag.id"
                class="tag-chip"
                :style="{ color: tag.color, borderColor: tag.color }"
                @click="$router.push(`/articles?tag_id=${tag.id}&tag_name=${encodeURIComponent(tag.name)}`)"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
          <!-- 视频 -->
          <div v-if="article.video_url" class="article-video">
            <video :src="resolveUploadUrl(article.video_url)" autoplay controls preload="metadata" class="video-player">
              您的浏览器不支持视频播放
            </video>
          </div>

          <!-- 文章内容 -->
          <div class="article-content" v-html="articleContent"></div>
        </article>

        <!-- 侧边栏 -->
        <aside class="article-sidebar">
          <!-- 推荐文章 -->
          <div class="sidebar-card" v-if="recommended.length">
            <h3 class="sidebar-title">推荐阅读</h3>
            <div class="recommend-list">
              <div
                v-for="item in recommended"
                :key="item.id"
                class="recommend-item"
                @click="$router.push(`/article/${item.id}`)"
              >
                <div class="recommend-thumb" :style="item.cover_image ? { backgroundImage: `url(${resolveUploadUrl(item.cover_image)})` } : {}"></div>
                <div class="recommend-info">
                  <h4 class="recommend-title">{{ item.title }}</h4>
                  <span class="recommend-views">👁 {{ item.view_count }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </template>

      <div v-else class="empty-wrapper">
        <el-empty description="文章不存在" />
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="site-footer">
      <div class="container">
        <p>© 2026 AVE学习中心. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticleDetail } from '../../api'
import { resolveUploadUrl, resolveHtmlUploadUrls } from '../../utils/uploadUrl'

const route = useRoute()
const article = ref(null)
const recommended = ref([])
const loading = ref(true)

// 处理富文本中的上传文件路径（GitHub Pages 兼容）
const articleContent = computed(() => {
  return article.value ? resolveHtmlUploadUrls(article.value.content) : ''
})

const loadArticle = async () => {
  loading.value = true
  try {
    const res = await getArticleDetail(route.params.id)
    if (res.code === 0) {
      article.value = res.data.article
      recommended.value = res.data.recommended || []
    }
  } catch (err) {
    console.error('加载文章失败:', err)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => {
  loadArticle()
})

// 监听路由参数变化（点击侧边栏推荐文章时重新加载）
watch(() => route.params.id, () => {
  loadArticle()
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.article-detail-page {
  min-height: 100vh;
}

.site-header {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.header-nav {
  display: flex;
  gap: 24px;
}

.header-nav a {
  font-size: 15px;
  color: #606266;
  transition: color 0.3s;
}

.header-nav a:hover {
  color: #409EFF;
}

.detail-container {
  display: flex;
  gap: 30px;
  padding-top: 30px;
  padding-bottom: 40px;
}

.loading-wrapper,
.empty-wrapper {
  flex: 1;
  padding: 40px 0;
}

.article-main {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  min-width: 0;
}

.back-to-list {
  margin-bottom: 16px;
}

.back-btn {
  font-size: 14px;
  color: #606266;
}

.back-btn:hover {
  color: #409EFF;
}

.article-header {
  margin-bottom: 24px;
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.4;
  margin-bottom: 16px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-author {
  font-weight: 600;
  color: #606266;
}

.meta-category {
  background: #ecf5ff;
  color: #409EFF;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.article-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-chip {
  display: inline-block;
  font-size: 13px;
  padding: 3px 14px;
  border: 1px solid;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
}

.tag-chip:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.article-cover {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: auto;
  display: block;
}

.article-video {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  max-height: 500px;
  background: #000;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin: 24px 0 12px;
  color: #1a1a2e;
}

.article-content :deep(h2) {
  font-size: 22px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.article-content :deep(h3) {
  font-size: 18px;
}

.article-content :deep(p) {
  margin-bottom: 16px;
}

.article-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #409EFF;
  padding: 12px 16px;
  margin: 16px 0;
  background: #f5f7fa;
  color: #606266;
}

.article-content :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.article-content :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.article-content :deep(pre code) {
  background: none;
  padding: 0;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 24px;
  margin-bottom: 16px;
}

.article-content :deep(li) {
  margin-bottom: 8px;
}

/* 侧边栏 */
.article-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.sidebar-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  position: sticky;
  top: 90px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommend-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.3s;
}

.recommend-item:hover {
  background: #f5f7fa;
}

.recommend-thumb {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.recommend-info {
  flex: 1;
  min-width: 0;
}

.recommend-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommend-views {
  font-size: 12px;
  color: #909399;
}

.site-footer {
  background: #1a1a2e;
  color: #909399;
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
}

@media (max-width: 900px) {
  .detail-container {
    flex-direction: column;
  }

  .article-sidebar {
    width: 100%;
  }

  .sidebar-card {
    position: static;
  }

  .article-main {
    padding: 20px;
  }

  .article-title {
    font-size: 22px;
  }
}
</style>
