<template>
  <div class="article-list-page">
    <div class="nav">
      <el-button link @click="$router.push('/')" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <div class="text">正文</div>
    </div>
    <div class="container list-container">
      <!-- 筛选标题 -->
      <div class="filter-bar">
        <div class="filter-left">
          <h2 class="filter-title">
            <span v-if="categoryName">{{ categoryName }}</span>
            <span v-else-if="tagName">#{{ tagName }}</span>
            <span v-else>全部文章</span>
          </h2>
        </div>
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
                  :style="{ color: tag.color, border: '1px solid ' + tag.color }"
                  @click.stop="$router.push(`/articles?tag_id=${tag.id}&tag_name=${encodeURIComponent(tag.name)}`)"
                >
                  #{{ tag.name }}
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
  padding-top: 20px;
  padding-bottom: 30px;
}

.nav{
  display: flex;
  align-items: center;
  padding: 14px 20px 10px;
  border-bottom: 1px solid #ebeef5;
}
.nav .text{
  text-align: center;
  width: 100%;
  font-size: 18px;
  display: none;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  margin-left: 2px;
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
  margin-left: 2px;
}

.sub-category-bar {
  display: flex;
  gap: 0px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
 .sub-category-bar button {
  padding: 10px 12px;
  font-size: 14px;
  border-radius: 122px;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 0px;
  margin-right: 4px;
}


.featured-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  padding: 4px 6px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  margin-right: 4px;
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
