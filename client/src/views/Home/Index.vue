<template>
  <div class="home-page">
    <!-- 分类导航 -->
    <section class="container category-section">
      <div v-if="loading" class="category-grid">
        <div v-for="i in 5" :key="'sk-cat-' + i" class="category-card skeleton-card">
          <el-skeleton animated>
            <template #template>
              <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
                <el-skeleton-item variant="circle" style="width:60px;height:60px;" />
                <el-skeleton-item variant="text" style="width:50px;height:14px;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>
      <div v-else class="category-grid">
        <div
          v-for="cat in categories.filter(c => !c.parent_id)"
          :key="cat.id"
          class="category-card"
          @click="goCategory(cat)"
        >
          <span class="category-icon">
            <img :src="resolveUploadUrl(cat.icon)"/>
          </span>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
    </section>
    <!-- 轮播图 -->
    <section class="carousel-section container" v-if="!loading && carousels.length">
      <el-carousel ref="carouselRef" :interval="5000" :height="carouselHeight" indicator-position="none">
        <el-carousel-item v-for="item in carousels" :key="item.id" style="border-radius: 16px;"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd">
          <div class="carousel-card" :style="{ backgroundImage: item.image ? `url(${resolveUploadUrl(item.image)})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }"
               @click="goArticle(item.article_id)">
            <div class="carousel-overlay">
              <div class="carousel-content">
                <h2 class="carousel-title">{{ item.title }}</h2>
                <p class="carousel-subtitle">{{ item.subtitle }}</p>
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </section>
    <section v-else-if="loading" class="carousel-section container">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" style="width:100%;height:480px;border-radius:16px;" />
        </template>
      </el-skeleton>
    </section>

    <div class="container">
      <!-- 精选文章（推荐到首页的） -->
      <section class="featured-section" v-if="!loading && featured.length">
        <h2 class="section-title">课程精选</h2>
        <div class="featured-list">
          <div
            v-for="article in featured"
            :key="article.id"
            class="featured-card"
            @click="goArticle(article.id)"
          >
            <div class="featured-thumb" :style="{ backgroundImage: `url(${article.featured_image ? resolveUploadUrl(article.featured_image) : article.cover_image ? resolveUploadUrl(article.cover_image) : defaultImg})` }">
              <div v-if="article.video_url" class="play-icon">▶</div>
            </div>
            <div class="featured-info">
              <h3 class="featured-title">{{ article.featured_title || article.title }}</h3>
              <div class="featured-meta">
                <div>
                  <span v-if="article.tags.length" class="tag-pill" 
                  :style="{ color: article.tags[0].color, border: '1px solid ' + article.tags[0].color }" 

                  @click.stop="goTag(article.tags[0])">
                    #{{ article.tags[0].name }}
                  </span>
                </div>
                <span class="featured-views">
                  <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.43701 2.37513C7.48623 2.48549 8.33445 3.40056 8.33484 4.47367L8.32409 4.68604C8.22117 5.66558 7.41652 6.47007 6.43701 6.57311L6.22465 6.58386C5.15127 6.58366 4.23628 5.73548 4.12611 4.68604L4.11536 4.47367C4.11577 3.32907 5.07997 2.36459 6.22465 2.36438L6.43701 2.37513Z" fill="#BAC2CD"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.22461 0C7.94877 0 9.50115 0.485949 10.625 1.28711C11.7489 2.08839 12.4492 3.20964 12.4492 4.47461C12.4491 5.73951 11.7489 6.86082 10.625 7.66211C9.50116 8.46328 7.94873 8.94922 6.22461 8.94922C4.50049 8.94922 2.94806 8.46328 1.82422 7.66211C0.700321 6.86082 6.97775e-05 5.73951 0 4.47461C0 3.20964 0.700291 2.08839 1.82422 1.28711C2.94807 0.485949 4.50045 0 6.22461 0ZM6.22461 0.986328C4.79807 0.986328 3.50537 1.37596 2.57227 1.99805C1.63834 2.6207 1.0743 3.46838 1.07422 4.38672C1.07422 5.30512 1.6383 6.15274 2.57227 6.77539C3.50538 7.39746 4.79802 7.78711 6.22461 7.78711C7.6512 7.78711 8.94384 7.39746 9.87695 6.77539C10.8109 6.15274 11.375 5.30512 11.375 4.38672C11.3749 3.46838 10.8109 2.6207 9.87695 1.99805C8.94385 1.37596 7.65115 0.986328 6.22461 0.986328Z" fill="#838A94"/>
                  </svg>
                  {{ formatCount(article.view_count) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section v-else-if="loading" class="featured-section">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="text" style="width:120px;height:22px;margin-bottom:15px;" />
            <div class="featured-list">
              <div v-for="i in 4" :key="'sk-f-' + i" class="featured-card skeleton-card">
                <div style="display:flex;gap:12px;width:100%;">
                  <el-skeleton-item variant="image" style="width:140px;height:80px;border-radius:12px;flex-shrink:0;" />
                  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;">
                    <el-skeleton-item variant="text" style="width:70%;height:18px;" />
                    <el-skeleton-item variant="text" style="width:40%;height:14px;" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </section>

      <!-- 热门内容 -->
      <section class="hot-section" v-if="!loading">
        <h2 class="section-title">
          热门内容
          <span class="more-link" @click="loadMore">更多 ›</span>
        </h2>
        <div class="featured-list">
          <div
            v-for="article in hotArticles.slice(0, 4)"
            :key="article.id"
            class="featured-card"
            @click="goArticle(article.id)"
          >
            <div class="featured-thumb" :style="{ backgroundImage: `url(${article.cover_image ? resolveUploadUrl(article.cover_image) : defaultImg})` }">
              <div v-if="article.video_url" class="play-icon">▶</div>
            </div>
            <div class="featured-info">
              <h3 class="featured-title">{{ article.title }}</h3>
              <div class="featured-meta">
                <div>
                  <span v-if="article.tags.length" class="tag-pill" 
                  :style="{ color: article.tags[0].color, border: '1px solid ' + article.tags[0].color }" 
                  @click.stop="goTag(article.tags[0])">
                    #{{ article.tags[0].name }}
                  </span>
                </div>
                <span class="featured-views">
                  <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.43701 2.37513C7.48623 2.48549 8.33445 3.40056 8.33484 4.47367L8.32409 4.68604C8.22117 5.66558 7.41652 6.47007 6.43701 6.57311L6.22465 6.58386C5.15127 6.58366 4.23628 5.73548 4.12611 4.68604L4.11536 4.47367C4.11577 3.32907 5.07997 2.36459 6.22465 2.36438L6.43701 2.37513Z" fill="#BAC2CD"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.22461 0C7.94877 0 9.50115 0.485949 10.625 1.28711C11.7489 2.08839 12.4492 3.20964 12.4492 4.47461C12.4491 5.73951 11.7489 6.86082 10.625 7.66211C9.50116 8.46328 7.94873 8.94922 6.22461 8.94922C4.50049 8.94922 2.94806 8.46328 1.82422 7.66211C0.700321 6.86082 6.97775e-05 5.73951 0 4.47461C0 3.20964 0.700291 2.08839 1.82422 1.28711C2.94807 0.485949 4.50045 0 6.22461 0ZM6.22461 0.986328C4.79807 0.986328 3.50537 1.37596 2.57227 1.99805C1.63834 2.6207 1.0743 3.46838 1.07422 4.38672C1.07422 5.30512 1.6383 6.15274 2.57227 6.77539C3.50538 7.39746 4.79802 7.78711 6.22461 7.78711C7.6512 7.78711 8.94384 7.39746 9.87695 6.77539C10.8109 6.15274 11.375 5.30512 11.375 4.38672C11.3749 3.46838 10.8109 2.6207 9.87695 1.99805C8.94385 1.37596 7.65115 0.986328 6.22461 0.986328Z" fill="#838A94"/>
                  </svg>
                  &nbsp;{{ formatCount(article.view_count) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section v-else class="hot-section">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="text" style="width:120px;height:22px;margin-bottom:15px;" />
            <div class="featured-list">
              <div v-for="i in 4" :key="'sk-h-' + i" class="featured-card skeleton-card">
                <div style="display:flex;gap:12px;width:100%;">
                  <el-skeleton-item variant="image" style="width:140px;height:80px;border-radius:12px;flex-shrink:0;" />
                  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;">
                    <el-skeleton-item variant="text" style="width:70%;height:18px;" />
                    <el-skeleton-item variant="text" style="width:40%;height:14px;" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeData, getArticles } from '../../api'
import { resolveUploadUrl } from '../../utils/uploadUrl'
import defaultImg from '../../assets/default.png'

const router = useRouter()
const loading = ref(true)
const carousels = ref([])
const categories = ref([])
const featured = ref([])
const hotArticles = ref([])
const carouselRef = ref(null)
let touchStartX = 0
let touchStartY = 0

const windowWidth = ref(window.innerWidth)
const carouselHeight = computed(() => windowWidth.value <= 768 ? '200px' : '480px')

const onResize = () => { windowWidth.value = window.innerWidth }

const loadHomeData = async () => {
  loading.value = true
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
  } finally {
    loading.value = false
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

const onTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

const onTouchEnd = (e) => {
  const deltaX = e.changedTouches[0].clientX - touchStartX
  const deltaY = e.changedTouches[0].clientY - touchStartY
  // 水平滑动距离大于垂直滑动距离且超过阈值，视为左右滑动
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
    e.preventDefault()
    if (deltaX > 0) {
      carouselRef.value?.prev()
    } else {
      carouselRef.value?.next()
    }
  }
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
  window.addEventListener('resize', onResize)
  loadHomeData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* 轮播 */
.carousel-section {
  margin-bottom: 30px;
}

.carousel-card {
  height: 100%;
  background-size: 100% 100%;
  background-position: center;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
  border-radius: 16px;
}

.carousel-overlay {
  padding: 20px 0;
  background: rgba(0, 0, 0, 0.4);
  width: 100%;
  color: #fff;
}
.carousel-content {
  max-width:1200px;
  margin: 0 auto;
  padding: 0 20px;
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
}

.carousel-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

/* 分类 */
.category-section {
  margin-bottom: 10px;
  margin-top: 20px;
  padding: 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
}

.category-card {
  padding: 12px 1px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
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
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.category-icon img {
  max-height: 100%;
  max-width: 100%;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 精选 */
.featured-section {
  margin-bottom: 30px;
}

.featured-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.featured-card {
  display: flex;
  flex-direction: row;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  gap: 12px;
  transition: all 0.3s;
}
.featured-thumb {
  width: 140px;
  height: 80px;
  background: #1a1a2e3d;
  background-size: 100%;
  background-position: center;
  position: relative;
  flex-shrink: 0;
  border-radius: 12px;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #333;
}

.featured-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.featured-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  padding-right: 2px;
}

.tag-pill {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 3px;
}

.tag-pill:hover {
  opacity: 0.7;
}
.hot-section{
  padding-bottom: 30px;
}

.skeleton-card {
  cursor: default;
  pointer-events: none;
}

@media (max-width: 768px) {
  .category-icon img {
    width: 60px;
  }
  .category-grid {
    grid-template-columns: repeat(5, 1fr);
    padding: 0 10px;
  }

  .carousel-title {
    font-size: 18px;
  }
}
</style>
