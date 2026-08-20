<template>
  <div class="admin-tags">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon> 新建标签
      </el-button>
    </div>

    <el-table :data="tags" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="标签名称" min-width="150" />
      <el-table-column prop="color" label="颜色" width="150">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 8px">
            <div :style="{ width: '24px', height: '24px', borderRadius: '4px', background: row.color }"></div>
            <span>{{ row.color }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 标签编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标签' : '新建标签'" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标签名称" required>
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTags, adminCreateTag, adminUpdateTag, adminDeleteTag } from '../../api'

const tags = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editId = ref(null)

const form = ref({
  name: '',
  color: '#409EFF',
})

const loadTags = async () => {
  loading.value = true
  try {
    const res = await getTags()
    if (res.code === 0) tags.value = res.data
  } catch (err) {
    ElMessage.error('加载标签失败')
  } finally {
    loading.value = false
  }
}

const openDialog = (row) => {
  if (row) {
    isEdit.value = true
    editId.value = row.id
    form.value = { name: row.name, color: row.color }
  } else {
    isEdit.value = false
    editId.value = null
    form.value = { name: '', color: '#409EFF' }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入标签名称')
    return
  }
  submitting.value = true
  try {
    let res
    if (isEdit.value) {
      res = await adminUpdateTag(editId.value, form.value)
    } else {
      res = await adminCreateTag(form.value)
    }
    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadTags()
    }
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个标签吗？', '提示', { type: 'warning' })
    const res = await adminDeleteTag(id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadTags()
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
  loadTags()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}
</style>
