<template>
  <div class="home-page">
    <!-- 分类导航 -->
    <section class="category-section">
      <div class="category-grid">
        <div
          v-for="cat in categories.filter(c => !c.parent_id)"
          :key="cat.id"
          class="category-card"
          @click="goCategory(cat)"
        >
          <span class="category-icon">
            <img :src="cat.icon"/>
          </span>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
    </section>
    <!-- 轮播图 -->
    <section class="carousel-section" v-if="carousels.length">
      <el-carousel :interval="5000" height="280px">
        <el-carousel-item v-for="item in carousels" :key="item.id">
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

    <div class="container">
      <!-- 精选文章（推荐到首页的） -->
      <section class="featured-section" v-if="featured.length">
        <h2 class="section-title">课程精选</h2>
        <div class="featured-list">
          <div
            v-for="article in featured"
            :key="article.id"
            class="featured-card"
            @click="goArticle(article.id)"
          >
            <div class="featured-thumb" :style="article.featured_image ? { backgroundImage: `url(${resolveUploadUrl(article.featured_image)})` } : article.cover_image ? { backgroundImage: `url(${resolveUploadUrl(article.cover_image)})` } : {}">
              <div v-if="article.video_url" class="play-icon">▶</div>
            </div>
            <div class="featured-info">
              <h3 class="featured-title">{{ article.featured_title || article.title }}</h3>
              <div class="featured-meta">
                <div>
                  <span v-if="article.tags.length" class="tag-pill" :style="{ color: article.tags[0].color, backgroundColor: article.tags[0].color + '18' }" @click.stop="goTag(article.tags[0])">
                    {{ article.tags[0].name }}
                  </span>
                </div>
                <span class="featured-views">👁 &nbsp;{{ formatCount(article.view_count) }}</span>
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
        <div class="featured-list">
          <div
            v-for="article in hotArticles"
            :key="article.id"
            class="featured-card"
            @click="goArticle(article.id)"
          >
            <div class="featured-thumb" :style="article.cover_image ? { backgroundImage: `url(${resolveUploadUrl(article.cover_image)})` } : {}">
              <div v-if="article.video_url" class="play-icon">▶</div>
            </div>
            <div class="featured-info">
              <h3 class="featured-title">{{ article.title }}</h3>
              <div class="featured-meta">
                <div>
                  <span v-if="article.tags.length" class="tag-pill" :style="{ color: article.tags[0].color, backgroundColor: article.tags[0].color + '18' }" @click.stop="goTag(article.tags[0])">
                    {{ article.tags[0].name }}
                  </span>
                </div>
                <span class="featured-views">👁 &nbsp;{{ formatCount(article.view_count) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeData, getArticles } from '../../api'
import { resolveUploadUrl } from '../../utils/uploadUrl'

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
  padding: 40px 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
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
  margin-bottom: 8px;
}

.carousel-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

/* 分类 */
.category-section {
  margin-bottom: 10px;
  margin-top: 20px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.category-card {
  padding: 12px 6px;
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
  margin-bottom: 40px;
}

.featured-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.featured-card {
  display: flex;
  flex-direction: row;
  background: #fff;
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
  background-size: cover;
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
  margin-bottom: 12px;
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
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.tag-pill:hover {
  opacity: 0.7;
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
