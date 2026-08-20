<template>
  <div class="admin-carousels">
    <el-alert
      title="提示：现在通过文章的「首页轮播」开关来控制是否显示在首页轮播中"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    />
    
    <div class="toolbar">
      <el-button @click="loadCarousels">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </div>

    <el-table :data="carousels" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="封面" width="150">
        <template #default="{ row }">
          <img v-if="row.cover_image" :src="row.cover_image" style="width: 120px; height: 68px; object-fit: cover; border-radius: 4px" />
          <span v-else style="color: #909399">无封面</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="summary" label="摘要" min-width="200" show-overflow-tooltip />
      <el-table-column prop="sort_order" label="排序权重" width="180">
        <template #default="{ row }">
          <el-input-number 
            v-model="row.sort_order" 
            :min="0" 
            :max="999" 
            size="small"
            @change="handleSortChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="category.name" label="分类" width="120" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="goToEdit(row.id)">编辑文章</el-button>
          <el-button link type="danger" @click="handleRemoveFromCarousel(row.id)">移出轮播</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminGetArticles, adminUpdateArticle } from '../../api'

const router = useRouter()
const carousels = ref([])
const loading = ref(false)

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 加载轮播文章列表（is_featured=1 的文章）
const loadCarousels = async () => {
  loading.value = true
  try {
    const res = await adminGetArticles({ 
      pageSize: 100,
      is_featured: 1 // 只获取推荐到首页的文章
    })
    if (res.code === 0) {
      carousels.value = res.data.list
    }
  } catch (err) {
    console.error('加载轮播文章失败:', err)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 跳转到文章编辑页面
const goToEdit = (id) => {
  router.push(`/admin/article/edit/${id}`)
}

// 修改排序权重
const handleSortChange = async (row) => {
  try {
    const res = await adminUpdateArticle(row.id, {
      sort_order: row.sort_order
    })
    if (res.code === 0) {
      ElMessage.success('排序已更新')
    }
  } catch (err) {
    ElMessage.error('更新失败')
    loadCarousels() // 重新加载恢复原值
  }
}

// 从轮播中移除（关闭 is_featured 开关）
const handleRemoveFromCarousel = async (id) => {
  try {
    await ElMessageBox.confirm('确定要将此文章从首页轮播中移除吗？', '提示', { 
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await adminUpdateArticle(id, { is_featured: 0 })
    if (res.code === 0) {
      ElMessage.success('已从轮播中移除')
      loadCarousels()
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('移除失败:', err)
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  loadCarousels()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}
</style>
