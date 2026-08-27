<template>
  <div class="article-detail-page">
    <div class="nav">
      <el-button link @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <div class="text">正文</div>
    </div>
    <div class="container detail-container">
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="10" animated />
      </div>

      <template v-else-if="article">
        <!-- 文章头部 -->
        <article class="article-main">
          <div class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="meta-category" v-if="article.category" @click="$router.push(`/articles?category_id=${article.category.id}&category_name=${encodeURIComponent(article.category.name)}`)" style="cursor:pointer">{{ article.category.name }}</span>
              <span class="meta-views">
                <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.43701 2.37513C7.48623 2.48549 8.33445 3.40056 8.33484 4.47367L8.32409 4.68604C8.22117 5.66558 7.41652 6.47007 6.43701 6.57311L6.22465 6.58386C5.15127 6.58366 4.23628 5.73548 4.12611 4.68604L4.11536 4.47367C4.11577 3.32907 5.07997 2.36459 6.22465 2.36438L6.43701 2.37513Z" fill="#BAC2CD"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.22461 0C7.94877 0 9.50115 0.485949 10.625 1.28711C11.7489 2.08839 12.4492 3.20964 12.4492 4.47461C12.4491 5.73951 11.7489 6.86082 10.625 7.66211C9.50116 8.46328 7.94873 8.94922 6.22461 8.94922C4.50049 8.94922 2.94806 8.46328 1.82422 7.66211C0.700321 6.86082 6.97775e-05 5.73951 0 4.47461C0 3.20964 0.700291 2.08839 1.82422 1.28711C2.94807 0.485949 4.50045 0 6.22461 0ZM6.22461 0.986328C4.79807 0.986328 3.50537 1.37596 2.57227 1.99805C1.63834 2.6207 1.0743 3.46838 1.07422 4.38672C1.07422 5.30512 1.6383 6.15274 2.57227 6.77539C3.50538 7.39746 4.79802 7.78711 6.22461 7.78711C7.6512 7.78711 8.94384 7.39746 9.87695 6.77539C10.8109 6.15274 11.375 5.30512 11.375 4.38672C11.3749 3.46838 10.8109 2.6207 9.87695 1.99805C8.94385 1.37596 7.65115 0.986328 6.22461 0.986328Z" fill="#838A94"/>
                </svg>
                {{ article.view_count }}
              </span>
            </div>
            <div class="article-tags" v-if="article.tags && article.tags.length">
              <span
                v-for="tag in article.tags"
                :key="tag.id"
                class="tag-chip"
                :style="{ color: tag.color, borderColor: tag.color }"
                @click="$router.push(`/articles?tag_id=${tag.id}&tag_name=${encodeURIComponent(tag.name)}`)"
              >
                #{{ tag.name }}
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
            <h3 class="sidebar-title">精选文章</h3>
            <div class="recommend-list">
              <div
                v-for="item in recommended"
                :key="item.id"
                class="recommend-item"
                @click="$router.push(`/article/${item.id}`)"
              >
                <div class="recommend-thumb" :style="{ backgroundImage: `url(${item.cover_image ? resolveUploadUrl(item.cover_image) : defaultImg})` }"></div>
                <div class="recommend-info">
                  <h4 class="recommend-title">{{ item.title }}</h4>
                  <span class="recommend-views">
                    <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.43701 2.37513C7.48623 2.48549 8.33445 3.40056 8.33484 4.47367L8.32409 4.68604C8.22117 5.66558 7.41652 6.47007 6.43701 6.57311L6.22465 6.58386C5.15127 6.58366 4.23628 5.73548 4.12611 4.68604L4.11536 4.47367C4.11577 3.32907 5.07997 2.36459 6.22465 2.36438L6.43701 2.37513Z" fill="#BAC2CD"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.22461 0C7.94877 0 9.50115 0.485949 10.625 1.28711C11.7489 2.08839 12.4492 3.20964 12.4492 4.47461C12.4491 5.73951 11.7489 6.86082 10.625 7.66211C9.50116 8.46328 7.94873 8.94922 6.22461 8.94922C4.50049 8.94922 2.94806 8.46328 1.82422 7.66211C0.700321 6.86082 6.97775e-05 5.73951 0 4.47461C0 3.20964 0.700291 2.08839 1.82422 1.28711C2.94807 0.485949 4.50045 0 6.22461 0ZM6.22461 0.986328C4.79807 0.986328 3.50537 1.37596 2.57227 1.99805C1.63834 2.6207 1.0743 3.46838 1.07422 4.38672C1.07422 5.30512 1.6383 6.15274 2.57227 6.77539C3.50538 7.39746 4.79802 7.78711 6.22461 7.78711C7.6512 7.78711 8.94384 7.39746 9.87695 6.77539C10.8109 6.15274 11.375 5.30512 11.375 4.38672C11.3749 3.46838 10.8109 2.6207 9.87695 1.99805C8.94385 1.37596 7.65115 0.986328 6.22461 0.986328Z" fill="#838A94"/>
                    </svg>
                    {{ item.view_count }}
                  </span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticleDetail } from '../../api'
import { resolveUploadUrl, resolveHtmlUploadUrls } from '../../utils/uploadUrl'
import defaultImg from '../../assets/default.png'

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

.nav{
  display: flex;
  align-items: center;
  padding: 20px 20px;
  border-bottom: 1px solid #ebeef5;
}
.nav .text{
  text-align: center;
  width: 100%;
  font-size: 18px;
  font-weight: 600;
}
.detail-container {
  display: flex;
  gap: 30px;
  padding-top: 20px;
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
  justify-content: space-between;
  flex-wrap: wrap;
}

.meta-author {
  font-weight: 600;
  color: #606266;
}

.meta-category {
  background: #ecf5ff;
  color: #3F80F7;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 14px;
}

.article-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-chip {
  display: inline-block;
  font-size: 13px;
  padding: 5px 14px;
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
  padding: 10px;
  position: sticky;
  top: 90px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
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
    padding: 0px 0;
  }

  .article-title {
    font-size: 22px;
  }
}
</style>
