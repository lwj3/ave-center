<template>
  <div class="file-manager">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件管理</span>
          <el-radio-group v-model="filterType" size="small" @change="loadFiles">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="image">图片</el-radio-button>
            <el-radio-button label="video">视频</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="files" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="预览" width="120">
          <template #default="{ row }">
            <img 
              v-if="row.type === 'image'" 
              :src="row.url" 
              class="file-preview"
              @click="previewFile(row)"
            />
            <video 
              v-else 
              :src="row.url" 
              class="file-preview video"
              @click="previewFile(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="originalname" label="文件名" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'image' ? 'success' : 'warning'" size="small">
              {{ row.type === 'image' ? '图片' : '视频' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="copyUrl(row)">
              复制链接
            </el-button>
            <el-button 
              link 
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
              :disabled="row.used_by && row.used_by.length > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadFiles"
          @current-change="loadFiles"
        />
      </div>
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="文件预览" width="60%">
      <div class="preview-container">
        <img v-if="previewFileData?.type === 'image'" :src="previewFileData.url" class="preview-image" />
        <video v-else :src="previewFileData?.url" controls class="preview-video" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminGetFiles, adminDeleteFile } from '../../api'

const files = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterType = ref('')
const previewVisible = ref(false)
const previewFileData = ref(null)

// 加载文件列表
const loadFiles = async () => {
  loading.value = true
  try {
    const res = await adminGetFiles({
      type: filterType.value,
      page: page.value,
      pageSize: pageSize.value,
    })
    if (res.code === 0) {
      files.value = res.data.list
      total.value = res.data.total
    }
  } catch (err) {
    console.error('加载文件列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 预览文件
const previewFile = (file) => {
  previewFileData.value = file
  previewVisible.value = true
}

// 复制URL
const copyUrl = async (file) => {
  const url = `${window.location.origin}${file.url}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

// 删除文件
const handleDelete = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.originalname}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const res = await adminDeleteFile(file.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadFiles()
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.file-manager {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s;
}

.file-preview:hover {
  transform: scale(1.1);
}

.file-preview.video {
  object-fit: contain;
  background: #000;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-video {
  width: 100%;
  max-height: 70vh;
}
</style>
