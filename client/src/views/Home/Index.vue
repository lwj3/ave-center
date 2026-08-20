<template>
  <div class="home-page">
    <!-- 顶部导航 -->
    <header class="site-header">
      <div class="container header-inner">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-icon"></span>
          <span class="logo-text">
            <img style="width: 30px;" src="https://ave.ai/_nuxt/avedex_mobile_logo.DN0XNEWA.webp"/>
            AVE学院
          </span>
        </div>
        <nav class="header-nav">
          <router-link to="/">首页</router-link>
          <router-link to="/admin">后台管理</router-link>
        </nav>
      </div>
    </header>

    <!-- 轮播图 -->
    <section class="carousel-section" v-if="carousels.length">
      <el-carousel :interval="5000" arrow="always" height="400px">
        <el-carousel-item v-for="item in carousels" :key="item.id">
          <div class="carousel-card" :style="{ backgroundImage: item.image ? `url(${item.image})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }"
               @click="goArticle(item.article_id)">
            <div class="carousel-overlay">
              <div class="carousel-badge">精选课程</div>
              <h2 class="carousel-title">{{ item.title }}</h2>
              <p class="carousel-subtitle">{{ item.subtitle }}</p>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </section>

    <div class="container">
      <!-- 分类导航 -->
      <section class="category-section">
        <div class="category-grid">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="category-card"
            @click="goCategory(cat)"
          >
            <span class="category-icon">{{ cat.icon || '📁' }}</span>
            <span class="category-name">{{ cat.name }}</span>
          </div>
        </div>
      </section>

      <!-- 精选文章（推荐到首页的） -->
      <section class="featured-section" v-if="featured.length">
        <h2 class="section-title">课程精选</h2>
        <div class="featured-grid">
          <div
            v-for="article in featured"
            :key="article.id"
            class="featured-card"
            @click="goArticle(article.id)"
          >
            <div class="featured-image" :style="article.featured_image ? { backgroundImage: `url(${article.featured_image})` } : article.cover_image ? { backgroundImage: `url(${article.cover_image})` } : {}">
              <div class="featured-image-overlay">
                <div v-if="article.video_url" class="play-icon">▶</div>
              </div>
            </div>
            <div class="featured-info">
              <h3 class="featured-title">{{ article.featured_title || article.title }}</h3>
              <p class="featured-subtitle">{{ article.featured_subtitle || article.summary }}</p>
              <div class="featured-tags">
                <span v-for="tag in article.tags" :key="tag.id" class="tag" :style="{ color: tag.color, borderColor: tag.color }" @click.stop="goTag(tag)">
                  {{ tag.name }}
                </span>
              </div>
              <div class="featured-meta">
                <span class="author-avatar">👤</span>
                <span>{{ article.view_count >= 1000 ? (article.view_count / 1000).toFixed(1) + 'K' : article.view_count }} 人已学习</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 热门内容 -->
      <section class="hot-section">
        <h2 class="section-title">
          热门内容
          <span class="more-link" @click="loadMore">更多 ›</span>
        </h2>
        <div class="article-list">
          <div
            v-for="article in hotArticles"
            :key="article.id"
            class="article-card"
            @click="goArticle(article.id)"
          >
            <div class="article-thumb" :style="article.cover_image ? { backgroundImage: `url(${article.cover_image})` } : {}">
              <div v-if="article.video_url" class="play-btn">▶</div>
            </div>
            <div class="article-info">
              <h3 class="article-title">{{ article.title }}</h3>
              <div class="article-meta">
                <span v-if="article.tags.length" class="article-tag" :style="{ color: article.tags[0].color, borderColor: article.tags[0].color }" @click.stop="goTag(article.tags[0])">
                  {{ article.tags[0].name }}
                </span>
                <span class="article-author">{{ article.author }}</span>
                <span class="article-views">👁 {{ formatCount(article.view_count) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeData, getArticles } from '../../api'

const router = useRouter()
const carousels = ref([])
const categories = ref([])
const featured = ref([])
const hotArticles = ref([])

const loadHomeData = async () => {
  try {
    const res = await getHomeData()
    if (res.code === 0) {
      carousels.value = res.data.carousels || []
      categories.value = res.data.categories || []
      featured.value = res.data.featured || []
      hotArticles.value = res.data.hotArticles || []
    }
  } catch (err) {
    console.error('加载首页数据失败:', err)
  }
}

const goArticle = (id) => {
  if (id) router.push(`/article/${id}`)
}

const goCategory = (cat) => {
  router.push({
    path: '/articles',
    query: { category_id: cat.id, category_name: cat.name }
  })
}

const goTag = (tag) => {
  router.push({
    path: '/articles',
    query: { tag_id: tag.id, tag_name: tag.name }
  })
}

const formatCount = (count) => {
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count
}

const loadMore = () => {
  router.push('/articles')
}

onMounted(() => {
  loadHomeData()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* 顶部导航 */
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
  display: flex;
  align-items: center;
  gap: 8px;
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

.header-nav a:hover,
.header-nav a.router-link-active {
  color: #409EFF;
}

/* 轮播 */
.carousel-section {
  margin-bottom: 30px;
}

.carousel-card {
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
}

.carousel-overlay {
  padding: 40px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  width: 100%;
  color: #fff;
}

.carousel-badge {
  display: inline-block;
  background: #409EFF;
  color: #fff;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 12px;
}

.carousel-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.carousel-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

/* 分类 */
.category-section {
  margin-bottom: 30px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.category-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
}

.category-card.active {
  border-color: #409EFF;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.category-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* 精选 */
.featured-section {
  margin-bottom: 40px;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.featured-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.featured-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.featured-image {
  height: 200px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  background-size: cover;
  background-position: center;
  position: relative;
}

.featured-image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
}

.play-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #333;
}

.featured-info {
  padding: 16px;
}

.featured-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.featured-subtitle {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.featured-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  padding: 2px 10px;
  border: 1px solid;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.tag:hover {
  opacity: 0.7;
}

.featured-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

.author-avatar {
  font-size: 16px;
}

/* 热门文章列表 */
.hot-section {
  margin-bottom: 40px;
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
  min-height: 130px;
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
}

.article-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 10px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.article-tag {
  font-size: 12px;
  padding: 2px 10px;
  border: 1px solid;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.article-tag:hover {
  opacity: 0.7;
}

/* 页脚 */
.site-footer {
  background: #1a1a2e;
  color: #909399;
  text-align: center;
  padding: 24px 0;
  margin-top: 40px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    flex-direction: column;
  }

  .article-thumb {
    width: 100%;
    height: 160px;
  }

  .carousel-title {
    font-size: 22px;
  }
}
</style>
