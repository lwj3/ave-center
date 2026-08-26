<template>
  <div class="article-list-page">
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

      <!-- 子分类筛选 -->
      <div v-if="subCategories.length" class="sub-category-bar">
        <el-button
          :type="!activeSubCategoryId ? 'primary' : 'default'"
          @click="selectSubCategory(null)"
        >
          全部
        </el-button>
        <el-button
          v-for="sub in subCategories"
          :key="sub.id"
          :type="activeSubCategoryId === sub.id ? 'primary' : 'default'"
          @click="selectSubCategory(sub.id)"
        >
          {{ sub.name }}
        </el-button>
      </div>

      <!-- 文章列表 -->
      <div v-loading="loading" class="featured-list">
        <div
          v-for="article in articles"
          :key="article.id"
          class="featured-card"
          @click="$router.push(`/article/${article.id}`)"
        >
          <div class="featured-thumb" :style="{ backgroundImage: `url(${article.cover_image ? resolveUploadUrl(article.cover_image) : defaultImg})` }">
            <div v-if="article.video_url" class="play-icon">▶</div>
          </div>
          <div class="featured-info">
            <h3 class="featured-title">{{ article.title }}</h3>
            <div class="featured-meta">
              <div>
                <span v-for="tag in (article.tags || []).slice(0, 3)" :key="tag.id"
                  class="tag-pill"
                  :style="{ color: tag.color, backgroundColor: tag.color + '18' }"
                  @click.stop="$router.push(`/articles?tag_id=${tag.id}&tag_name=${encodeURIComponent(tag.name)}`)"
                >
                  {{ tag.name }}
                </span>
              </div>
              <span class="featured-views">👁 &nbsp;{{ formatCount(article.view_count) }}</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticles, getCategories } from '../../api'
import { resolveUploadUrl } from '../../utils/uploadUrl'
import defaultImg from '../../assets/default.png'

const route = useRoute()
const articles = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const categoryName = ref(route.query.category_name || '')
const tagName = ref(route.query.tag_name || '')
const subCategories = ref([])
const activeSubCategoryId = ref(null)

// 加载子分类
const loadSubCategories = async () => {
  if (!route.query.category_id) {
    subCategories.value = []
    return
  }
  try {
    const res = await getCategories()
    if (res.code === 0) {
      const parent = res.data.find(c => c.id === parseInt(route.query.category_id))
      subCategories.value = parent?.children || []
    }
  } catch (err) {
    console.error('加载子分类失败:', err)
  }
}

const selectSubCategory = (subId) => {
  activeSubCategoryId.value = subId
  page.value = 1
  loadArticles()
}

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    }
    // 优先使用子分类ID，否则使用父分类ID
    if (activeSubCategoryId.value) {
      params.category_id = activeSubCategoryId.value
    } else if (route.query.category_id) {
      params.category_id = route.query.category_id
    }
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
watch(() => route.query, async (newQuery) => {
  categoryName.value = newQuery.category_name || ''
  tagName.value = newQuery.tag_name || ''
  activeSubCategoryId.value = null
  page.value = 1
  await loadSubCategories()
  loadArticles()
})

onMounted(async () => {
  await loadSubCategories()
  loadArticles()
})
</script>

<style scoped>
.article-list-page {
  min-height: 100vh;
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

.sub-category-bar {
  display: flex;
  gap: 0px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.article-count {
  font-size: 14px;
  color: #909399;
}

.featured-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.featured-views {
  flex-shrink: 0;
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


</style>
