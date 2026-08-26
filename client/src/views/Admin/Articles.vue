<template>
  <div class="admin-articles">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterCategory" placeholder="筛选分类" clearable @change="loadArticles" style="width: 160px">
          <el-option label="全部分类" value="" />
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="String(cat.id)" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="筛选状态" clearable @change="loadArticles" style="width: 140px">
          <el-option label="全部状态" value="" />
          <el-option label="已发布" :value="1" />
          <el-option label="草稿" :value="0" />
        </el-select>
        <el-input
          v-model="filterKeyword"
          placeholder="搜索文章标题"
          clearable
          @keyup.enter="loadArticles"
          style="width: 220px"
        >
          <template #append>
            <el-button @click="loadArticles"><el-icon><Search /></el-icon></el-button>
          </template>
        </el-input>
      </div>
      <el-button type="primary" @click="$router.push('/admin/article/edit')">
        <el-icon><Plus /></el-icon> 新建文章
      </el-button>
    </div>

    <!-- 文章表格 -->
    <el-table :data="articles" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="title" label="标题" min-width="350">
        <template #default="{ row }">
          <div class="article-title-cell">
            <span>{{ row.title }}</span>
            <el-tag v-if="row.is_featured" type="warning" size="small" style="margin-left: 8px">轮播</el-tag>
            <el-tag v-if="row.is_recommended" type="success" size="small" style="margin-left: 4px">精选</el-tag>
            <el-tag v-if="row.status === 0" type="info" size="small" style="margin-left: 4px">草稿</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="category.name" label="分类" width="120" />
      <el-table-column prop="author" label="作者" width="120" />
      <el-table-column prop="view_count" label="浏览量" width="100" />
      <!-- <el-table-column prop="created_at" label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column> -->
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/admin/article/edit/${row.id}`)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadArticles"
        @current-change="loadArticles"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminGetArticles, adminDeleteArticle, adminGetCategories } from '../../api'

const articles = ref([])
const categories = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterCategory = ref('')
const filterStatus = ref('')
const filterKeyword = ref('')

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (filterCategory.value) params.category_id = filterCategory.value
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (filterKeyword.value) params.keyword = filterKeyword.value

    const res = await adminGetArticles(params)
    if (res.code === 0) {
      articles.value = res.data.list
      total.value = res.data.total
    }
  } catch (err) {
    ElMessage.error('加载文章失败')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await adminGetCategories()
    if (res.code === 0) {
      categories.value = res.data
    }
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', { type: 'warning' })
    const res = await adminDeleteArticle(id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadArticles()
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadArticles()
  loadCategories()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.article-title-cell {
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
</style>
