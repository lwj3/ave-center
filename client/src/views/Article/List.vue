<template>
  <div class="article-list-page">
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

    <div class="container list-container">
      <!-- 筛选标题 -->
      <div class="filter-bar">
        <div class="filter-left">
          <el-button link @click="$router.push('/')" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <h2 class="filter-title">
            <span v-if="categoryName">分类：{{ categoryName }}</span>
            <span v-else-if="tagName">标签：{{ tagName }}</span>
            <span v-else>全部文章</span>
          </h2>
        </div>
        <span class="article-count">共 {{ total }} 篇</span>
      </div>

      <!-- 文章列表 -->
      <div v-loading="loading" class="article-list">
        <div
          v-for="article in articles"
          :key="article.id"
          class="article-card"
          @click="$router.push(`/article/${article.id}`)"
        >
          <div class="article-thumb" :style="article.cover_image ? { backgroundImage: `url(${article.cover_image})` } : {}">
            <div v-if="article.video_url" class="play-btn">▶</div>
          </div>
          <div class="article-info">
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary }}</p>
            <div class="article-meta">
              <span v-if="article.category" class="meta-cat" @click.stop="$router.push(`/articles?category_id=${article.category.id}&category_name=${encodeURIComponent(article.category.name)}`)">
                {{ article.category.name }}
              </span>
              <span v-for="tag in (article.tags || []).slice(0, 3)" :key="tag.id"
                class="meta-tag"
                :style="{ color: tag.color, borderColor: tag.color }"
                @click.stop="$router.push(`/articles?tag_id=${tag.id}&tag_name=${encodeURIComponent(tag.name)}`)"
              >
                {{ tag.name }}
              </span>
              <span class="meta-author">{{ article.author }}</span>
              <span class="meta-views">👁 {{ formatCount(article.view_count) }}</span>
            </div>
          </div>
        </div>

        <el-empty v-if="!loading && articles.length === 0" description="暂无文章" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadArticles"
          @current-change="loadArticles"
        />
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
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticles } from '../../api'

const route = useRoute()
const articles = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const categoryName = ref(route.query.category_name || '')
const tagName = ref(route.query.tag_name || '')

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (route.query.category_id) params.category_id = route.query.category_id
    if (route.query.tag_id) params.tag_id = route.query.tag_id

    const res = await getArticles(params)
    if (res.code === 0) {
      articles.value = res.data.list
      total.value = res.data.total
    }
  } catch (err) {
    console.error('加载文章失败:', err)
  } finally {
    loading.value = false
  }
}

const formatCount = (count) => {
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count
}

// 监听路由变化（分类/标签切换）
watch(() => route.query, (newQuery) => {
  categoryName.value = newQuery.category_name || ''
  tagName.value = newQuery.tag_name || ''
  page.value = 1
  loadArticles()
})

onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.article-list-page {
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
.logo{
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  cursor: pointer;
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

.list-container {
  padding-top: 24px;
  padding-bottom: 40px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 14px;
  color: #606266;
}

.back-btn:hover {
  color: #409EFF;
}

.filter-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  padding-left: 12px;
  border-left: 4px solid #409EFF;
}

.article-count {
  font-size: 14px;
  color: #909399;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.article-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.article-thumb {
  width: 200px;
  min-height: 140px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  background-size: cover;
  background-position: center;
  position: relative;
  flex-shrink: 0;
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #333;
}

.article-info {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 6px;
  line-height: 1.4;
}

.article-summary {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #909399;
  flex-wrap: wrap;
}

.meta-cat {
  background: #ecf5ff;
  color: #409EFF;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

.meta-cat:hover {
  background: #409EFF;
  color: #fff;
}

.meta-tag {
  font-size: 12px;
  padding: 2px 10px;
  border: 1px solid;
  border-radius: 12px;
  cursor: pointer;
}

.meta-tag:hover {
  opacity: 0.7;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.site-footer {
  background: #1a1a2e;
  color: #909399;
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .article-card {
    flex-direction: column;
  }

  .article-thumb {
    width: 100%;
    height: 160px;
  }
}
</style>
